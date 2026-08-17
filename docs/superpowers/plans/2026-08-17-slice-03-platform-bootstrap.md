# Slice 3 — Platform Bootstrap (SURF-SA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Super Admin platform console — nineteen capability modules across two navigation bands — as a browser-only, static-export storyboard that demonstrates every workflow without claiming a single production capability.

**Architecture:** A shared SURF-SA spine (module registry, two-band navigation, invariant chips, command-state renderer, access-class gate, prototype disclosure) that every module screen consumes. Each module is one route under `app/super-admin/<slug>/`, owning its own directory so modules can be built independently. All mutation flows through the existing `ScenarioCommandGateway`; all access decisions through the existing `evaluateAccess`.

**Tech Stack:** Next.js 16.3.1 App Router (`output: 'export'`), React 19.2.8, TypeScript 5.9.3 strict, Tailwind CSS 4.3.3, Zod 4.4.3, Vitest 4.1.10, Playwright 1.62.1 + axe.

**Spec:** `docs/superpowers/specs/2026-08-17-slice-03-platform-bootstrap-design.md`
**Census:** `docs/census/2026-08-17-surf-sa-build-map.md`

## Global Constraints

- **No backend.** No API routes, Server Actions, middleware, databases, secrets, or network calls that mutate. Static export only.
- **Never claim a production capability that is only simulated** (§29.4). Every screen carries the prototype disclosure.
- **The six ENFORCED invariants render as status chips, never as controls** — not focusable, no pressed state, no tooltip implying an approval path.
- **Three renderings for a prohibition, by rule:** ABSENT · DISABLED WITH A NAMED REASON · CLASS BADGE REPLACING THE ACTION BAR. Never by taste.
- **On SURF-SA, no link ever resolves to record-level tenant content.** It resolves to a session-request form.
- **No metric below tenant-month, no rate, no per-worker series, no comparison of people.**
- **The words *tamper-evident*, *chained*, *signed*, *verified* appear nowhere in SURF-SA copy.**
- **Names are canonical; `SCR-SA-NN` numbers appear only as annotations.** No route is keyed on a bare number.
- Four platform roles: `ROLE-PLAT-ROOT` (exactly one account) · `ROLE-PLAT-ADMIN` · `ROLE-PLAT-ENG` · `ROLE-PLAT-SUP`. All four get **read** on every screen unless a control or rule says otherwise; every affordance is driven by per-control allowed-roles, never by module-level `roles_allowed`.
- **With every AI model unavailable, all nineteen modules remain operable and the emergency pause remains exercisable** (`AC-SA-000-09`).
- Aggregates render an as-of timestamp and degrade to **stale-with-age** or **unavailable** — never zero, never blank (`AC-SA-01-03`).
- TypeScript `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`. No `any`, no suppressed diagnostics. Typed failures, never thrown exceptions on expected paths.
- Closed vocabularies use `as const satisfies readonly T[]` with a real exhaustiveness check.
- Determinism: no ambient `Date.now()`, `new Date()`, `Math.random()` in `src/`.
- WCAG 2.2 AA on every route and every state. No dead controls.

---

## Task 1: The SURF-SA spine

**Files:**
- Create: `src/surfaces/sa/modules.ts` — the nineteen-module registry, two bands
- Create: `src/surfaces/sa/invariants.ts` — the six ENFORCED invariants, closed
- Create: `src/surfaces/sa/command-state.ts` — the fifteen device command states, closed, ordered
- Create: `src/surfaces/sa/access-classes.ts` — the three named access classes, closed
- Create: `src/surfaces/sa/critical-actions.ts` — the eleven critical-class actions
- Create: `src/ui/sa/InvariantChip.tsx` · `CommandStateBadge.tsx` · `ProhibitionNotice.tsx` · `PrototypeDisclosure.tsx`
- Test: `tests/unit/sa-spine.test.ts`, `tests/component/sa-spine.test.tsx`

**Interfaces:**
- Produces: `SA_MODULES` (19, banded), `SaModuleId`, `SA_INVARIANTS` (6), `COMMAND_STATES` (15, ordered), `ACCESS_CLASSES` (3), `CRITICAL_ACTIONS` (11), and the four components above.
- Consumes: `evaluateAccess` from `@/policy/evaluate`; `ROLES` from `@/domain/roles`; primitives from `@/ui/primitives`.

- [ ] **Step 1: Write the failing test for the module registry**

```ts
import { SA_MODULES, SA_BANDS } from '@/surfaces/sa/modules'

it('carries exactly nineteen modules across two bands, seven and twelve', () => {
  expect(SA_MODULES).toHaveLength(19)
  const a = SA_MODULES.filter((m) => m.band === 'definition')
  const b = SA_MODULES.filter((m) => m.band === 'operations')
  expect(a).toHaveLength(7)
  expect(b).toHaveLength(12)
  expect(SA_BANDS).toHaveLength(2)
})

it('never mints MOD-SA-20 — it is an alias-by-denial, not a module', () => {
  expect(SA_MODULES.map((m) => m.id)).not.toContain('MOD-SA-20')
})

it('states both bands are V1, so the split carries no acceptance meaning', () => {
  for (const b of SA_BANDS) expect(b.v1).toBe(true)
})
```

- [ ] **Step 2: Run it RED.** `pnpm vitest run tests/unit/sa-spine.test.ts` — expect "Cannot find module".
- [ ] **Step 3: Implement `modules.ts`.** Nineteen entries, `id`/`name`/`slug`/`band`/`purpose`. Band A (`definition`) is `MOD-SA-01`…`07`; Band B (`operations`) is `MOD-SA-08`…`19`. Names from spec §1. `as const satisfies` with an exhaustiveness check.
- [ ] **Step 4: Run GREEN.**
- [ ] **Step 5: The six invariants, with the rendering gate**

```ts
it('renders every invariant as a status chip, never as a control', () => {
  const { container } = render(<InvariantChip invariant={SA_INVARIANTS[0]!} />)
  expect(container.querySelector('button')).toBeNull()
  expect(container.querySelector('input')).toBeNull()
  expect(container.querySelector('[role=switch]')).toBeNull()
  expect(container.querySelector('[tabindex]')).toBeNull()
})
```

Implement `SA_INVARIANTS` (6, closed) and `InvariantChip`. A disabled toggle implies an enabled state exists somewhere — that is the defect this test exists to prevent.

- [ ] **Step 6: The fifteen command states, ordered**, and `CommandStateBadge`. Assert the exact order from L42846 and that the set is closed at fifteen.
- [ ] **Step 7: `ProhibitionNotice`** with the three renderings as a closed union — `absent` | `disabled-with-reason` | `class-badge`. A `disabled-with-reason` rendering with no reason must not compile.
- [ ] **Step 8: `PrototypeDisclosure`** — asserts the copy contains none of *tamper-evident*, *chained*, *signed*, *verified*.
- [ ] **Step 9: Commit.**

---

## Task 2: The console shell and module index

**Files:**
- Modify: `app/super-admin/page.tsx` — replace the 32-line placeholder
- Create: `app/super-admin/SaConsoleShell.tsx`
- Test: `tests/component/sa-console.test.tsx`, `tests/e2e/sa-console.spec.ts`

- [ ] **Step 1:** Failing test — the index lists all nineteen modules grouped into two named bands, "Definition layer" and "Operations layer", each labelled V1.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** Implement. Every module links to its own route by **slug, never by `SCR-SA-NN`**.
- [ ] **Step 4:** GREEN, axe clean, one `<h1>`.
- [ ] **Step 5:** Commit.

---

## Tasks 3–21: The nineteen modules

Each module is one task, one route directory, built to the same contract. **Task N builds exactly one module and touches only `app/super-admin/<slug>/` plus its own tests.**

Per-module contract — every module screen must:

1. Render under the console shell with its band and module id shown as an annotation.
2. Handle the twelve applicable screen states (`STATE-01`…`STATE-13` less the frontline-only `STATE-07`), including **`STATE-11` artificial-intelligence-unavailable, under which the module remains operable** (`AC-SA-000-09`).
3. Drive every affordance from per-control allowed-roles via `evaluateAccess`, showing what each of the four platform roles sees — including what it sees when it may not act.
4. Use the three prohibition renderings by rule (spec §3).
5. Render aggregates with an as-of timestamp, degrading to stale-with-age or unavailable — never zero, never blank.
6. Resolve every tenant-content link to a **session-request form**, never to record-level content.
7. Carry the prototype disclosure.
8. Render an explicit **"unspecified in source"** panel naming each affordance the source does not define, rather than inventing one.

| Task | Module | Band | Notes from the census |
|---|---|---|---|
| 3 | `MOD-SA-01` Platform Overview and Health | definition | Exactly **eight** aggregate elements (`AC-SA-01-01`). `OBJ-SA-INCIDENT` six states. Connectivity ladder 30/60/120 min. One agent degrading across 2+ tenants is **one platform incident**. One control only — do not invent acknowledge/assign/escalate. |
| 4 | `MOD-SA-02` Atom Registry | definition | Atom creation is **ABSENT** for every account (L43253). |
| 5 | `MOD-SA-03` Core Agents and Composed-Agent Review | definition | Renders agent state, not incident ownership. |
| 6 | `MOD-SA-04` Memory Architecture | definition | **Zero controls.** Five typed memory stores. Read-only policy cards + "unspecified in source" panel naming the four missing affordances. Memory has **no export path**; an individual-level profile record **cannot be created**. |
| 7 | `MOD-SA-05` Eval Harness | definition | The evaluation gate: enabling a capability with pending or failing scenarios is prohibited for **every** account; the enablement control **is not offered at all** while a scenario fails (L65361). |
| 8 | `MOD-SA-06` Trace Viewer | definition | **No viewer screen** (D9). Built as an honest absence carrying the decision record and `DEC-SEC-020`'s ambient-browsing warning. Zero controls. |
| 9 | `MOD-SA-07` Platform Settings | definition | **Ten** navigable categories (D21); severity catalog, locale packs, invariants-and-floor-register, emergency pause as cross-cutting sections. Seventeen governed settings. The six invariants render **locked** here — as chips. Scheduled-work and feature material labelled **User-Mandated Product Extension** (D22). Emergency pause: **Admin proposes, root approves**; Platform Engineer DISABLED "proposal only — pending DEC-PAUSE-001". |
| 10 | `MOD-SA-08` Console Users, Roles and Change Approvals | operations | The approval queue is **not a formality** (R8): change class, critical-class routing, the **root-unavailable freeze** as a first-class screen state (D13), self-approval refusal, and the two named failure states approved-not-applied and approved-not-executed. "Create user" DISABLED for Admin: "User creation is root-only". |
| 11 | `MOD-SA-09` Tenants, Lifecycle and Pilots | operations | Lifecycle invited→pilot→active→soft→hard→compliance→archived. **Seven** tenant-detail tabs (D20), eighth flagged unresolved. `AC-SA-09-14`: **no operational action from the tenant detail page for any console role** (R3). |
| 12 | `MOD-SA-10` Tenant Metrics and Aggregates | operations | Anonymisation **precedes** aggregation and cannot be disabled by any account including root. Tenant memory reads "Unavailable — counts and volume only" for every role. |
| 13 | `MOD-SA-11` Tiers, Entitlements and Caps | operations | Three tier bands. Tier Record draft→pending root approval→published→superseded. Downgrade **cannot take effect mid-cycle** and queues. Grandfathered vs migrated. Owns the **per-tenant feature override** (D7). One control — do not invent. |
| 14 | `MOD-SA-12` Usage and Metering | operations | Worker-Shift is a **billing unit**: a count on a commercial ledger, never a rate, never a per-worker series, never a comparison (R5). Usage ladder 80% / 100% / 100-125% burst. |
| 15 | `MOD-SA-13` Devices and Fleet | operations | **Highest risk module** (R1). Fifteen command states; fixtures **advance through** states on explicit user action with the state name always visible. **No console view renders an unreached device as wiped** (`AC-SA-13-05`). Sync-then-wipe mandatory. |
| 16 | `MOD-SA-14` Platform Notifications and Tenant Communications | operations | **Two** channels, closed. |
| 17 | `MOD-SA-15` Support Access | operations | The support session: **read-only without exception**, tenant ends it from its own banner, **no extension**, **no export from inside a session** (D18). Platform Engineer **ABSENT** with the conflict noted (D17). |
| 18 | `MOD-SA-16` JBS Access | operations | **No standing access.** Every touch scoped, time-boxed, reason-linked, audited and mirrored. One control — do not invent. |
| 19 | `MOD-SA-17` Data Lifecycle and Archival | operations | **Nothing is purged**; fifteen-year hot-retrievability horizon. Delete/purge **ABSENT** on every storage surface. Closure sequence Active→ExportProvided→Archived→Anonymised→Tiered. Anonymisation touches the identity-resolution layer, **never audit rows** (D11). |
| 20 | `MOD-SA-18` Platform Audit | operations | Audit entry state is **`committed` alone** (D3). Edit/delete **ABSENT**, not even greyed. Class filter data-driven from a provisional fixture; **the class count appears nowhere** (D4). Never *tamper-evident*, *chained*, *signed*, *verified* (D10). |
| 21 | `MOD-SA-19` The Tenant-Configuration Registry | operations | Platform default, bound and current tenant value for every setting; rejects out-of-bound writes. Three write classes. |

Each task: failing test → RED → implement → GREEN → axe → commit.

---

## Task 22: The slice gates

**Files:** Create `tests/coverage/slice-03-gates.test.ts`

Eight gates, **each proven able to fail by planting a violation on the axis the gate is for**:

- [ ] G1 — No invariant renders as `<button>`, `<input>` or `[role=switch]` anywhere under `app/super-admin/`.
- [ ] G2 — No link on SURF-SA resolves to record-level tenant content; tenant links resolve to a session-request form.
- [ ] G3 — No metric below tenant-month, no rate, no per-worker series.
- [ ] G4 — *tamper-evident* / *chained* / *signed* / *verified* appear nowhere in SURF-SA copy. **Comment-stripped** via the AST stripper.
- [ ] G5 — No route keyed on a bare `SCR-SA-NN`.
- [ ] G6 — All nineteen modules render under `STATE-11`, and the emergency pause remains exercisable.
- [ ] G7 — Every aggregate renders an as-of timestamp and degrades to stale-with-age or unavailable, never zero, never blank.
- [ ] G8 — Each of the eleven critical-class actions routes to root approval, and a blocked attempt writes an audit event.

Report what was **tried** against each gate and what **survived** — never that a named list passes.

---

## Task 23: Slice verification

- [ ] Clean rebuild `rm -rf out .next && pnpm verify`, exit 0.
- [ ] All nineteen module routes render in the static export with one `<h1>` each.
- [ ] axe clean on every new route and every screen state.
- [ ] `out/` carries no blueprint filename and no absolute author path.
- [ ] Registry indexes updated: SURF-SA module rows move from `not-represented` to `demonstrated-in-storyboard`, and the coverage dashboard reconciles.
- [ ] Commit.

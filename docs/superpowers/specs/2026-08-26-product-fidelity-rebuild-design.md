# Product-fidelity rebuild — design

**Date** 2026-08-26 · **Approvals** APP-017 (approach A, production level), APP-018 (design
approved, no-question autonomous authority, blueprint-then-internet research order)
**Frozen source** `AVIIXA_Production_Product_Blueprint.md`
sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`,
18,565,031 bytes, 122,241 lines — re-hashed at session entry, unchanged, no drift.
**Lifecycle mode** `NATIVE_GIT_LIFECYCLE` · **Execution mode** `subagent-driven-development`

---

## 1. Why this design exists

The client re-issued the master prompt with six materially new sections: §2.3
live-verification-only testing, §8.6.2 product fidelity, §10.6 the guided-tour engine,
§12.6 the JSON-file database, §24.2 workflow-driven shipping, §24.3 remediation of a prior
partial build. §24.3 requires that the existing routes be audited against §8.6.2 **before
anything new is added**. That audit was run and it convicts the shipped presentation layer.

### 1.1 The audit, measured rather than asserted

| tell | count |
|---|---|
| `app/` components rendering blueprint line-locators (`L42806`) as page content | **107 of 154** |
| components with `max-w-prose` narrative paragraphs as body content | 76 |
| components with bullet lists as body content | 23 |

The rendered Tenants page opens with `Screen annotations only, never route keys (D1):
SCR-SA-14 … (L42806, L42807), SB-SA-09 (L44984)` above a screen-state radio group used as
page furniture. It fails all three §8.6.2 litmus tests — Figma, screenshot and deletion.

### 1.2 The second measurement, which reframes the work

The generated registries hold **5,015 census rows across the fourteen inventories**. Their
implementation status:

| status | rows |
|---|---|
| not-represented | 4,684 |
| demonstrated-in-storyboard | 299 |
| not-applicable | 22 |
| mounted-in-another-screen | 10 |

| inventory | rows | demonstrated |
|---|---|---|
| functions | 990 | 21 |
| workflows | 724 | 80 |
| actionable-controls | 627 | 16 |
| ai-storyboards | 613 | 90 |
| features | 534 | 6 |
| sub-features | 526 | 1 |
| business-use-cases | 330 | 2 |
| notifications | 286 | 3 |
| business-objects | 99 | 6 |
| scheduled-work | 90 | 3 |
| modules | 81 | 69 |
| offline-scenarios | 70 | 0 |
| events | 28 | 0 |
| commands | 17 | 2 |

79 of 81 modules have a route; **6% of the census is demonstrated.** The prior build shipped
module-level storyboard *pages*, not a product. So this is not "restyle 107 screens" — it is
"build the product", using the 102 existing routes as scaffolding whose bodies are replaced
by real product user interface that actually exercises the 990 functions and 627 controls.

Stating that plainly is part of the design: every position report from here is a measured
figure against these registries, never a completion claim.

---

## 2. What survives, what is rebuilt

**Survives untouched** — the expensive, verified part, eleven slices of correctness:
`src/domain`, `src/policy`, `src/kernel`, `src/scenario`, `src/persistence`, `src/offline`,
`src/ai`, `src/scheduling`, `src/registry`, `registries/` (all fourteen inventories, the
reach maps, `registries/blueprint-locators.json`), the route tree, and the source-citation
gates that hold 1,019 identifier-anchored citations at their exact blueprint lines.

**Rebuilt** — the body of every product screen. The locators, source classifications and
story-step sentences those bodies render are **relocated, never deleted**: into the
traceability registry and into §10.6 tour narration, which is where §11 says story-step
fields belong. Nothing traceable is lost in the rebuild; the §24.3 loop-ledger entry for
each screen family carries its registry links across.

**Deleted** — the 28 co-located `app/**/fixtures.ts` files, absorbed into §12.6 collections;
and every retained test suite whose assertions describe a deleted document-style rendering,
deleted with its screen rather than repaired (APP-017).

### 2.1 The one-way edge

`src/ui` splits into two disjoint trees:

- `src/ui/product/` — the real product. **Never imports from `src/ui/demo/`.**
- `src/ui/demo/` — demo chrome. Imports product freely.

An ESLint `no-restricted-imports` rule enforces the direction. The §8.6.2 screenshot test —
a chrome-hidden capture must be unmistakable for the real product — is only checkable if
this edge holds, so it is enforced mechanically rather than by review.

---

## 3. Data layer (§12.6)

### 3.1 Collections

`src/data/collections/<name>.json`, one file per collection, each an array of entities with
stable IDs and relations by ID. The set, derived from the business-objects registry and the
blueprint's object catalogue:

`tenants · users · roles · role-grants · sites · areas · locations · shifts · workers ·
qualifications · qualification-grants · devices · workflow-definitions · work-instructions ·
content-blocks · training · specifications · evaluations · packages · jobs · runs ·
unit-executions · step-executions · captures · evidence · deviations · holds · summaries ·
reports · parts · notifications · commands · events · audit · schedules · feature-controls ·
entitlements · ai-requests · access-sessions · tours`

Every collection has a zod schema in `src/data/schemas/`. `scripts/validate-collections.mjs`
runs in the compile-level checks and **fails the build on a seed that does not validate** —
including unknown fields, which are rejected rather than ignored, per §3.2 of the master
prompt on version-mismatch masking.

### 3.2 Repository

`src/data/repository.ts` is the only door to business truth. It loads the seeds at boot into
the in-memory store and exposes create/read/update/delete and query operations exactly as a
real backend would, enforcing:

- the §12.5 truth-store boundaries — Studio definition truth, Hub official operational truth,
  device-local replica and durable queue, server command queue, Command Center freshness-aware
  projections, Super Admin platform configuration, product audit, telemetry, review metadata;
- the §12.2 state machines, which already exist in `src/domain` and are wired in rather than
  re-implemented;
- the permission model, through the existing `src/policy` evaluators.

**Components never import a seed file and never hold business truth in component state.** A
second `no-restricted-imports` rule holds it. This is what keeps the seam honest: replacing
the JSON layer with a real API later changes one layer, not 154 screens.

Mutations apply to the in-memory store and persist per the §12.4 IndexedDB contract already
built in `src/persistence`. Export/import round-trips the same collection shapes, so an
exported session is itself a valid database.

### 3.3 Volume

Production-realistic, not demo-realistic. Enough rows that every dashboard widget computes a
real number, every filter changes the result set, every pagination control paginates, every
state each screen must render is reachable from seed data, and the §10.1 Bright Bikes /
Riverside / Assembly cast stays consistent across every collection that references it.
`FixtureAdequacyRecord` (§8.6.1) is generated per search, filter, sort, pagination, chart and
bulk action, proving a positive result, an empty result, a boundary and an observable
before/after difference. Seeds are deterministic and fingerprinted; the simulated clock, never
the wall clock, drives time-dependent rows.

---

## 4. Product presentation layer

An enterprise design system built to ship. Primitives, each with the full §20.1 state matrix
(default, hover, focus, active, selected, disabled, loading, invalid, warning, stale, offline,
queued, pending, conflict, failed, fallback, safe-stop, recovered, success):

`AppShell` per surface · `DataTable` (sort, filter, column visibility, pagination,
virtualization above ~200 rows, selection, bulk actions, sticky regions, responsive card
fallback, export simulation) · the form set with real inline validation and error summaries ·
`Wizard` · `ObjectPage` with tabs · drawers · dialogs · toasts · KPI tiles · charts with
synchronized table equivalents · `Timeline` · a full-screen `RunPlayer` sized for gloved hands.

Existing design tokens extend into semantic scales. Accessibility is built into the primitives
once rather than per screen: WCAG 2.2 AA, landmarks, skip links, route-change focus, focus
trap and restoration, live-region status announcements, error-summary association, keyboard
alternatives for every drag, diagram and reorder interaction, target size, zoom and reflow,
forced colors, reduced motion, en/es accessible names, and non-colour state communication.

**The acceptance bar is the §8.6.2 canonical example, taken literally.** Real branded sign-in
with fields, inline validation and errors → platform dashboard with metrics computed from the
repository → tenant table with working search and filters → Create Tenant wizard with
validation → the new tenant appearing with its state, audit trail and follow-on actions. Every
workflow in every surface is built to that bar.

---

## 5. Demo chrome

`src/ui/demo/` holds, visually distinct from product user interface and collapsible to nothing:

- the role simulator, driving `DemoControllerContext` only;
- tour controls;
- scenario controls — connectivity, simulated clock, failure injection, checkpoints, reset,
  snapshot export/import;
- one inspector, holding the live cross-surface propagation drawer (rendering each affected
  surface's real current state), the event/command/notification/schedule/audit timeline, and
  the source, decision, acceptance, test and review evidence for the current screen.

§7.3.1 holds: `DemoControllerContext` and `ProductSessionContext` stay separate; changing the
demo persona executes no product command, approves nothing, and never alters the actor on an
existing product audit event.

---

## 6. Tour engine (§10.6)

Tour definitions are versioned data in the traceability registry, each step bound to stable
control, screen, workflow and state-machine IDs, replayable from a named seed to an identical
end state.

The runner **drives the real product**: navigates real routes, focuses real inputs, types
character-visible, opens real dialogs, clicks through the same handlers a human uses, performs
role and surface switches visibly with a caption naming who is acting and why, and moves the
simulated clock or connectivity when the flow needs offline or scheduled behaviour. **There is
no second implementation** — no video, no screenshot slideshow, no CSS re-enactment, no
parallel tour-only DOM, and no state mutation that bypasses the product's own action layer. If
the tour can do it, a human can do it by hand on the same screens.

Presentation: spotlight on the active element, a one-or-two-sentence narration caption per step
(this is where §11 step text lives), a progress indicator, and controls for play, pause, next,
back, restart, speed, exit and **Take over** — handing control to the user at the exact current
state.

A tour step that cannot find its target or produce its expected post-state is a **defect that
blocks release**, never a silently skipped step. Launch points: every workflow-index row, every
registry-index entry, a contextual "Watch how this works" on each screen, and a global Tours
menu grouped by surface, module and workflow with search and status. Nominal tour per workflow
plus denied, failure, first-fallback, fallback-failure and recovery variant tours wherever §9.5
makes them applicable. Cross-surface workflows perform their handoffs inside one tour.

---

## 7. Indexes and reconciliation

**Workflow Index (§10.5)** — every workflow with its ID, plain-language name, owning surface
and module, initiating and participating roles, primary objects, implementation status, variant
coverage summary and launchable tours, filterable on each dimension.

**Registry indexes (§9.6)** — a browsable index screen per inventory, all fourteen, with live
counts and per-item implementation status, drilling into each item's card, all linked from the
coverage dashboard. A count that exists only in a report, with no browsable index behind it,
does not satisfy §9.6.

**The reconciliation table (§9.6)** is published in the coverage dashboard and the review
package: candidate, extracted count, count scope, deduplication rule, delta, resolution. Known
deltas against the master prompt's validation candidates, to be reconciled and never conflated:

| inventory | prompt candidate | extracted | note |
|---|---|---|---|
| modules | 81 | 81 | agrees |
| offline-scenarios | 70 | 70 | agrees |
| workflows | 81 | 724 | **different count scope** — the candidate is chapter-level families, the extraction is workflow rows. The two 81s (modules, workflows) are proven unconflated per §9.6. |
| business-objects | 41 | 99 | scope delta, reconciled in the table |
| events | 30 | 28 | delta |
| commands | 5 classes | 17 | class versus instance |
| notifications | 15 types | 286 | type versus instance |
| ai-storyboards | 30 | 613 | scope delta |
| scheduled-work | 35 + 22 + 13 | 90 | three registers versus one inventory |

---

## 8. Verification (§2.3)

Release evidence is the **Live-Verification Ledger**, `docs/process/ledgers/
live-verification-ledger.json`: real Google Chrome driven through the Chrome MCP server. Each
row records path ID, role and surface, connectivity and simulated-clock state, the exact step
sequence performed, expected result from the registry, observed result, a screenshot at each
material state, console errors and network requests observed — **any external-origin request is
a Critical defect** — pass/fail/blocked, and the defect link on failure. It closes both ways
against the §9.6 inventories and the §13.1 control census.

Retained automated checks are compile-level only, because they run in seconds and stop broken
builds from wasting live-testing time: TypeScript strict typecheck; lint, formatting and
prohibited-pattern scans; JSON collection and registry schema validation; static build, export
and no-external-network scans.

**No new test case is written anywhere.** `/superpowers:test-driven-development` is recorded
policy-excluded. The 324 existing suites keep running as a free regression net and are demoted
— they are no longer release evidence — and those asserting a deleted rendering are deleted
with their screen.

**Regression rule.** With no automated safety net, every change re-drives live before it is
called done: the changed workflow, plus every workflow sharing a changed screen, component,
repository method or state machine. The loop ledger records exactly which rows were re-driven.
Determinism — seeded collections and the simulated clock — is what makes the re-drives
reproducible and must not be weakened.

**Screenshots (§26.2)** are captured at every material state of every ledger row, keyed by
screen, persona, scenario state, locale, theme and viewport, with clock, seed, fonts,
animations, caret and reduced motion pinned. There is no visual-regression baseline system.

---

## 9. Shipping order (§24.2)

**One foundation runway, then workflow units.**

*Runway:* the §12.6 collections, schemas and repository; the `src/ui/product` primitives and
token extension; the `src/ui/demo` chrome and inspector; the tour engine; the Workflow Index;
the fourteen registry indexes; the live-verification harness and ledger; the one-way-edge and
no-seed-import lint rules; the collection validator.

*Then workflow units,* along the §24.2 dependency arc — platform bootstrap and tenant
provisioning → tenant configuration, users, Workers, qualifications, devices → Studio authoring
through publication and package → Hub Job, Run, assignment and official truth → Frontline online
execution and capture → offline, package, reconnect, command, conflict, convergence → Command
Center monitoring and the closed action set → notifications, schedules, audit, reports, handoff
→ artificial intelligence and its absence → platform controls, suspensions, incidents, support,
recovery, archival → client-review closure and release evidence.

A shipped workflow unit contains its real product screens and states on every affected surface,
its §13.1 controls, its role results, its applicable denied/failure/fallback/recovery variants,
its guided tour and variant tours, its registry and index entries, its seed rows, and its
passing ledger rows including the regression re-drives. A unit that cannot finish inside one
execution window is split at a step boundary with its partial state recorded honestly; it is
never marked shipped while incomplete.

### 9.1 Decomposition — one plan per unit, never one plan for the programme

This design governs the whole programme; it is deliberately **not** a single implementation
plan. The first plan written from it covers the **runway only**. Each workflow unit thereafter
gets its own short spec and its own plan, cut from this design and from the frozen source, and
runs its own execute → independent review → live verification cycle. Spec self-review and
independent review still bind on every one of them; APP-018 released only the client's own
read of each spec, not the reviews.

---

## 10. What this design does not change

The owed slice-11 audit round 8, slices 12 and 13, and the closing obligation are **not
cancelled**. §24.3 puts the fidelity rebuild in front of them; it does not remove them. The
closing claim — *"nothing is remaining, ready to demo"* — still requires a clean fresh
verification on the exact reviewed bytes.

Two limits survive every delegation and are not the controller's to waive: an unresolved
**source** decision is disclosed on screen with its alternatives and the controller's pick
labelled a client-delegated choice, and **no production capability is claimed that is only
simulated.** The hard no-backend boundary (§4), the static-export contract (§4.2) and the
no-external-request rule (§4.3) are unchanged and remain mechanically enforced.

## 11. Risks, named

1. **Scale.** 4,684 not-represented census rows is many sessions of work. The mitigation is
   §24.2's workflow-unit discipline — each unit is independently complete and independently
   verified, so an interrupted session leaves shipped units rather than a broken tree.
2. **The rebuild deleting coverage silently.** Mitigated by §24.3's requirement that each
   rebuilt screen family carry its registry links across, recorded as a loop-ledger entry, and
   by the registry indexes making a lost link visible as a status regression.
3. **No automated net during a presentation-layer rewrite.** Mitigated by keeping the 324
   suites running (APP-017) and by the §2.3 regression rule naming the re-drive set per change.
4. **A tour that diverges from the product.** Mitigated structurally: the tour drives real
   handlers, so divergence is impossible by construction, and a step that cannot reach its
   target is a release-blocking defect.

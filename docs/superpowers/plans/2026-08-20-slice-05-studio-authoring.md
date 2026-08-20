# Slice 5 — Standards and Operations Studio (`SURF-STU`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the Standards and Operations Studio — all eighteen derived modules, authoring through publication and package — as a browser-only static-export storyboard in which the Workflow Builder is a **real interactive authoring journey**, not a picture, and in which every open source decision renders with both readings rather than being silently settled.

**Architecture:** A shared `SURF-STU` spine (`evaluateStudioAccess`, the Studio state model, nineteen closed vocabularies, the module registry, the shell, the publish-check registry, the journey fixture) that every module consumes. One route per module under `app/studio/<slug>/`. All access decisions through `evaluateStudioAccess`, layered on slice 3's `evaluateAccess`. All mutation through `ScenarioCommandGateway` (`src/scenario/gateway.ts`), and every write through the audit path.

**Spec:** `docs/superpowers/specs/2026-08-20-slice-05-studio-authoring-design.md`
**Census:** `docs/census/2026-08-20-surf-stu-slice05-build-map.md` and `…-raw-maps.json`
**Frozen source:** `/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md`, sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines. **Re-hash at slice entry.**

---

## 0. THE SOURCE-AUTHORITY RULE — read this before any task

Slice 4 shipped **three defective briefs**: two quoted a truncated permission matrix (one of them cut the only row carrying that module's withheld cells) and one quoted strings that appear nowhere in the source. **Every one was caught by an implementer going to the source unprompted. None was caught by a reviewer** — because a reviewer reading the brief and the diff sees them agree.

So, for every task in this plan:

> **The matrix quoted in your task is a convenience, transcribed from the census, which was itself transcribed cell by cell from the frozen source at the line span stated on it. The frozen source at that line span is the authority. If the source and this plan disagree in any cell, in any row, or in the number of rows: the source wins, you build the source's answer, and the disagreement is a FINDING you report in your task report. Do not silently follow either one.**

Read your module's matrix at its stated line span with `sed -n 'A,Bp'` before you write a line of code. Report the row count you found alongside the row count this plan states.

**Two known count discrepancies in the derived material, stated here so nobody reconciles them silently:**

1. The census header claims **239 data rows across 26 matrices** and **187 per-module rows (164 action + 23 consolidated)**. Summing the seventeen per-module action matrices as this plan transcribes them gives **154**, not 164 — so 177 per-module and **229** overall, not 239. The 26-matrix count reconciles; the row counts do not. **No gate may be keyed on 239, 187 or 164.** Gates assert *contents*, never cardinality (the D8 pattern). Report what you count.
2. The design's §8 heading says *"nineteen tasks in six file-disjoint waves"* while its own table lists **twenty-two**. This plan supersedes both counts.

---

## 1. Global Constraints

- **No backend.** Static export. No API routes, Server Actions, middleware, databases, secrets, or mutating network calls.
- **Never claim a production capability that is only simulated.** No Studio view claims a device state, a delivered escalation, or an effective clearance (S10). Adoption renders in its true command state from the fifteen-state ladder.
- **The Studio has no offline mode.** `STATE-07` renders **nowhere** on `SURF-STU` (D22). **Nothing on this surface ever queues a write.** Connection loss splits four ways (D4): loaded content → `STATE-08` with a freshness marker · a read that fails outright → `STATE-12` naming what failed **and whether anything was written** · every write control → **DISABLED with a named reason, never queued** · the editor additionally holds an explicit disconnected state with the local draft buffer and the plain statement that **no save has been recorded** (`AC-STU-009`, L30871). Reconnection → `STATE-13`, and **structural validation re-runs in full** before submission is re-enabled (L32152).
- **`STATE-10` and `STATE-11` DO apply here** — on `SCR-STU-04` and `SCR-STU-13` — a departure from slice 4 where both were inapplicable everywhere. Three live artificial-intelligence touchpoints sit in the authoring path (L48330, `TEST-SCR-STU-005` L48358).
- **Every write goes through the audit path, after its own domain refusals and before its mutation.** `FB-STU-10` (L31220) is the strictest contract in the chapter: *"an action that cannot be audited does not happen… There is no first fallback that permits the action to proceed unaudited."* Terminal safe state: the object stays at its prior state, **no version number is minted**, and **a version number is never re-used**. Retry is bounded and idempotent, re-using the submission identifier. **The Studio keeps no audit log of its own** (L31481) — it reads through slice 4's audit fixture.
  **The covering test for every audited handler MUST mutate something observable before the audit fails, and assert the mutation did not persist.** Slice 4 demonstrated its audit contract on the one handler of four that changed nothing; that is defect shape 3 and it will not be repeated.
- **Scope is enforced in what a screen READS, not what it DRAWS.** On this surface the scope dimension is **draft visibility** (`AC-STU-048` L32013, `AC-STU-151` L34668). The selector filters; the component receives only what the identity may read; the gate asserts the **selector**, not the render.
- **Affordances are driven per-control through `evaluateStudioAccess`, never by a module-level role list.** The evaluator takes a matrix row; it never takes a list of roles.
- **Separation of duties is evaluated by identity, never by role** (L33389, L34592): *"A user holding both the Supervisor and Quality Manager roles is still one person and still cannot occupy two stages."* A fixture persona holds both roles.
- **Fail closed** (L34605): where the identity layer is unreachable the Studio *"permits nothing beyond published read"*; where a grant is revoked mid-session *"the session is not silently degraded."*
- **Prohibition renderings apply BY RULE, and two rulings are INHERITED from slice 4 and are NOT re-litigated:**
  - **`Explicitly prohibited` carries NO rendering anywhere in the source.** The rule is derived, not quoted: **categorical** (the role cannot hold it in any scope) → **ABSENT**; **routing** (another role on the same screen holds it, and the actor's own alternative is nearby) → **DISABLED WITH A NAMED REASON** (`FUNC-STU-18-04-A-1` L34595, `AC-STU-155` L34672, and L31976 concretely on the New Workflow button).
  - **`Unavailable` is overloaded across two senses that render oppositely.** On the **connectivity** axis it is sense A → **DISABLED with the condition named**. On the **role** axis it is sense B → **ABSENT**. `MOD-STU-18` row 23 (L34563) settles the connectivity axis in one row: seven columns `Unavailable — the Studio requires an active connection`, one column `Explicitly prohibited — no access at all`.
  - `Not applicable — <reason>` → **ABSENT**, reason in help text. `Read-only` → `STATE-06` **with the cause named**; *"'read-only' alone is never shown"* (L48013).
  - `Client Decision Required` → **DISABLED with the decision identifier and both readings on screen** (`AC-RBAC-602` from slice-4 D8; `AC-STU-157` L34674).
- **A cell whose token is `Not applicable` for the Quality Manager and `Allowed` for a Supervisor is a CROSS-SURFACE STATEMENT, never a control** (R22). The five instances: `MOD-STU-14` row 2 (package build), `MOD-STU-13` row 7 (clearance), `MOD-STU-09` row 7 (worker profile field), `MOD-STU-12` row 6 (rebase), `MOD-STU-05` row 8 (action bundle). **No Studio route offers any of the five.**
- **Every sentence pointing at content elsewhere is pinned by a test that FAILS WHEN ITS TARGET IS REMOVED** — never a test that iterates an array and so can only pass (R13, slice-4 defect shape 5). The pointer-bearing sentences: library items (`AC-STU-071`), a coaching default per locale (`AC-STU-074`), a maintained certification (L33664), a branch target (L32101), a block reference (L32483), a part reference (L33211).
- **Every screen renders an explicit "unspecified in source" panel** naming each undefined affordance. **DO NOT INVENT A CONTROL.** Where the source states an architectural absence — `MOD-STU-16` row 4, *"there is no separate on/off switch"* — rendering a disabled toggle invents the control the source says does not exist.
- **The eighteen is a derived count and never renders bare.** Every occurrence of a Studio module count in this build's own documents and screens carries *"derived count, not stated in the Statement of Work"* and links `DEC-STUDIO-001` (`AC-STU-014` L30992, L14442, `TEST-ROLE-1023` L14497). This binds **this plan too** — every count of eighteen in this document carries the qualifier by reference to this bullet.
- **No persisted table or fixture has a worker identifier as a grouping key for a behavioural measure.** Carried from slice 4 unchanged. The coaching-effectiveness panel groups by **asset**; the Lane-A signal is asset, language, pattern, screen (L34166). Never worker.
- **Screen ids are ANNOTATIONS, never route keys.** Catalogue B (`SCR-STU-01`…`15`, L48259) is canonical (D1). Routes are keyed by **slug**, a plain name. The nineteen one-off literals outside both catalogues are recorded as uncatalogued storyboard names and **none becomes a route**. Two routes may annotate the same screen id where catalogue B merges what catalogue A splits (`SCR-STU-13` covers `MOD-STU-02` and `MOD-STU-15`).
- **Closed vocabularies use `as const satisfies readonly T[]` with a REAL exhaustiveness check** — the `Exclude<...> extends never ? true : never` pattern already in `src/policy/decision.ts`. A closed set with no exhaustiveness check is a list.
- **Determinism:** no ambient `Date.now()`, `new Date()`, `Math.random()` anywhere in `src/`. Use `src/domain/clock.ts`.
- TypeScript `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`. No `any`, no suppressed diagnostics. Typed failures, never thrown exceptions on expected paths.
- WCAG 2.2 AA on every route and state. One `<h1>` per route. **No dead controls** — an enabled control carries a handler, a disabled one carries a reason. `SCR-STU-04` is the densest screen on the platform and the source names it the accessibility risk (L48332): every section is a landmark region with a heading, section five's conditional appearance is **announced**, every validation message is programmatically associated with its field, keyboard traversal follows section order, and **the canvas is operable without a pointing device with branch targets selectable from a list as well as by drag.**
- **Per-module gates enumerate their files FROM THE DIRECTORY, never a hardcoded list**, and assert the enumeration is complete against the eighteen-row module registry. A directory scan that finds nothing and passes is the "baseline chosen so the failure cannot appear" defect, and is worse than no gate.
- **Every gate plants its own defect on the axis the gate is for, proves it red, and restores it.** A gate that cannot fail is worse than no gate. Slice 4 shipped four of them and one guard whose baseline made the failure unreachable.
- **Fix once, where all callers route.** Count the call sites before and after; put both counts in your report.

---

## 2. The two source contradictions that MUST NOT be settled

Slice 4 met the first of these shapes and the answer is established. **Disclose both readings, obey neither, and pin both locator sets in a gate fixture.**

### 2.1 `AC-STU-097` versus `AC-STU-138` on `DEC-LANEB-001`

They contradict **at named-test strength** for a package-borne Lane-B value. `AC-STU-097` (L33397) holds the chain absolute; `AC-STU-138` (L34332) holds the Lane-B decision to be the human sign-off. **They cannot both hold.** The only instruction binding both sides is `AC-STU-104` (L33404) / `AC-STU-143` (L34337): **surface it, never implement it silently.**

- **Owner: Task 7 (`MOD-STU-11`).** Mirror consumer: Task 22 (`MOD-STU-16`), which renders the *same* disclosure component with the *same* locator set.
- The build adopts the source's own hybrid (D14) as the **working position, labelled a client-delegated choice under APP-012**: the single decision suffices EXCEPT for a specification limit, a severity mapping or a gate rule, which route through the full chain. It is the only reading under which both criteria hold, on disjoint value sets.
- **Neither acceptance criterion is asserted as the source's answer.** The gate fixture in Task 24 holds **both** locator sets — `AC-STU-097`/L33397 and `AC-STU-138`/L34332 — and asserts that both render on screen with `DEC-LANEB-001` named. Removing either locator turns the gate red.
- The classifier depends on `DEC-PKGFIELD-001` (L33807), which is **open** — *"Part VII does not enumerate it"*. It ships as a **named interface over a seeded field map whose provenance renders.**

### 2.2 `DEC-WFROLL-001` versus `DEC-VERROLL-001` — one question, two identifiers, no cross-reference

`DEC-WFROLL-001` (chapter 28, L53350, 8 references) and `DEC-VERROLL-001` (chapter 7, L8623, 5 references) ask the rollback question with **no cross-reference between them**.

- **Owner: Task 10 (`MOD-STU-12`).**
- **Both identifiers render**, so a client search on either finds the same card. The chapter-28 card is the one carrying options, a recommendation, a trade-off and a decision owner (L53710); the chapter-7 mention is one line. The build registers `DEC-WFROLL-001` as canonical and `DEC-VERROLL-001` as its alias **and says so on screen** — it does not silently drop one.
- Task 24's gate fixture pins **both** identifier strings and both locators. Removing either turns it red.
- The rollback **behaviour** is not open and is not negotiable (L53703, L53706): *"Deleting or hiding a published version is refused; prior versions are retained in full. Rolling back by editing a published version in place is refused. Skipping the chain for a rollback is refused."* And L53707: in-flight runs cannot be re-based — *"the correct response is operational — cancel or complete under supervision — not technical."*

---

## 3. The per-module contract — every module screen must do all fifteen

1. Wrap in `StudioShell` (Task 4), showing the module id and its `SCR-STU-NN` **annotation**. **Never a route key.**
2. Handle the applicable screen states. **`STATE-07` renders nowhere.** `STATE-09` applies only on `SCR-STU-04` and `SCR-STU-11` at publication. `STATE-10`/`STATE-11` apply only on `SCR-STU-04` and `SCR-STU-13`. Connection loss splits four ways per Global Constraints.
3. Drive **every affordance per-control** through `evaluateStudioAccess`, showing what each column of **your own module's matrix** sees — including when it may not act. **Never a module-level role list.**
4. Apply the prohibition renderings **by rule** (Global Constraints), not cell by cell from intuition.
5. Render every `Client Decision Required` cell as **DISABLED with its decision identifier and both readings on screen**. Never guess one.
6. State that audit is in the same transaction; on an audit-write failure say **the action did not happen** and name what was not minted.
7. Enforce draft visibility **in the read**. Two reads, never one read plus a render flag.
8. Register every publish-blocking check you own into the **Task 5 publish-check registry**. Never implement a check a sibling module also implements.
9. Name every cross-slice seam with `StudioSeamNotice` (Task 4). A silent stub is the defect.
10. Render a **cross-surface statement**, never a control, for any act the matrix places on another surface.
11. Carry the prototype disclosure.
12. Render an explicit **"unspecified in source"** panel naming each undefined affordance. **Do not invent a control.**
13. Every sentence pointing at content elsewhere is pinned by a test that fails when its target is removed.
14. Every write: domain refusals first → audit → mutation. The covering test **mutates something observable before the audit fails.**
15. axe clean on every route and every state before the task reports.

---

## 4. Pre-dispatch conflict table — verified, not inherited

The design claims *"22 tasks in 6 file-disjoint waves"* and asks that disjointness be verified rather than inherited. **Verdict: the claim holds LITERALLY and fails SUBSTANTIVELY.** The declared path lists do not overlap as written, but six files that many tasks must write are owned by **no** task, two declared paths are **wrong**, four "stub closure" couplings are file conflicts dressed as sequencing, and one pair of route slugs differs by a single character. Every row below was found by diffing the design's twenty-two path lists against each other, against the live tree, and against the census's dependency order.

| # | Pair | Shared file or interface | Kind | Ruling |
|---|---|---|---|---|
| **C1** | Every wave-2…6 task × *nobody* | `app/studio/StudioShell.tsx`, `app/studio/page.tsx` | **FILE, unowned** | The contract says "wrap in the surface shell" and no task creates one. Slice 4 had Task 2 for exactly this; slice 5's design dropped it. **New Task 4 (Wave 1) owns the shell and the module index.** `app/studio/page.tsx` already exists as a surface stub and is rewritten there. |
| **C2** | Every module task × *nobody* | `src/studio/modules.ts` — the eighteen modules, slugs, screen catalogue B, matrix-row vocabulary | **FILE, unowned** | Task 11 was to "consume T10's screen list through the module registry" — a registry no task builds. **Task 4 owns it.** It is the slice-5 analogue of `src/surfaces/doh/modules.ts`. |
| **C3** | Task 4 × `src/surfaces/doh/modules.ts` precedent | `rolesReaching` derived from matrices that live under `app/` | **CYCLE HAZARD** | `src/surfaces/doh/modules.ts` value-imports `app/hub/HubShell` and a **build-time generated** JSON because deriving reach from the matrices closed a real `src`→`app` value cycle. Slice 5 must not re-open it: **Task 4 owns `scripts/build-stu-module-reach.mjs` → `registries/generated/stu/module-reach.json`**, run from `pnpm build:registries`. Nothing under `src/studio/` value-imports `app/`. |
| **C4** | T10 × T11 (design numbering) | The eleven publish-time checks (S3) | **INTERFACE, unowned** | The design assigns S3 to no task while ten modules touch it. T10's live validation panel and T8's publish path would each implement the severity-mapping check — **R6 shipped twice, and gate 6 ("plant one violation per check") becomes unwritable.** **New Task 5 (Wave 1) owns the check registry**: eleven named checks, each with its blocking-element message and the cannot-run→blocked rule. Modules register implementations; nobody re-implements. |
| **C5** | Every journey task × *nobody* | The `SEQ-011` fixture and the five-surface effects | **FILE, unowned** | The master prompt demands a real journey with five-surface effects at every step; no task owns the shared scenario or the effects data. **Task 5 owns the fixture and `FiveSurfaceEffects`; Task 23 owns the walkthrough route.** |
| **C6** | T5 × T8 (design numbering) | `src/studio/modules/stu-11/**` — *"T8 closes T5's diff stub"* | **FILE** | Closing a stub inside another task's path **is** a file collision. **Ruling: injection.** Task 7 declares the `DiffEngine` interface and a `diffUnavailable` default **in its own path** (the "hold, never advance" behaviour of `FUNC-STU-12-01-A-2`, L33486, is Task 7's own and must exist before any diff does). Task 10 implements the real engine **in its own path** and injects it at its own route. **Task 10 never edits `src/studio/modules/stu-11/**`.** The design's "closes the stub" wording is corrected here. |
| **C7** | T9 × T10 (design numbering) | *"T10 ships with the routing pointer stubbed; T9 closes it"* | **STALE** | `MOD-STU-07` (Wave 3) lands **before** `MOD-STU-04` (Wave 4). There is no stub to close. Task 14 imports Task 11's pointer picker directly. |
| **C8** | T11 × T12 (design numbering) | The difficulty-level component mounts inside Section 1 of `SCR-STU-04` | **FILE/ORDER** | `MOD-STU-09` has **no route of its own** (census: *"Within Section 1 of `SCR-STU-PANEL`"*). In the same wave, its owner would have to edit `SCR-STU-04`'s files. **Ruling: split the design's T12.** `MOD-STU-09` (model + six-cell coverage strip, no route) moves to **Wave 3**; `MOD-STU-06` (blocks, its own route `SCR-STU-05`) stays in **Wave 5**. Task 15 owns the one-line mount; Task 12 owns the component file. Props frozen in both briefs. |
| **C9** | T11 × T17 (design numbering) | `SCR-STU-PARTADD` is an inline panel inside the work-instruction step editor | **FILE/ORDER** | T17's declared path list has **no `app/**` path at all**, yet its panel renders inside T11's route. **Ruling: `MOD-STU-10` moves to Wave 3** — it is isolated (nothing depends on it) and has no slice-5 dependency. Task 13 owns the panel component; Task 15 owns the one-line mount. |
| **C10** | T11 × T18 (design numbering) | `SB-STU-05`, the Severity 1 arming confirmation | **DUPLICATE OWNERSHIP** | `SB-STU-05` is `MOD-STU-02`'s storyboard (L31814) but the design gives the arming confirmation to T11 **and** D23 to T18. **Ruling: Task 15 (`MOD-STU-05`) owns the panel and its audited write.** Task 21 renders a **read-only cross-reference** to it plus the `DEC-STUXREF-001` off-by-one disclosure. Gate: exactly one implementation of the confirmation write in the tree. |
| **C11** | T6 × T18 (design numbering) | The Atomic Capabilities view and D12 | **DUPLICATE OWNERSHIP** | Both T6 (`MOD-STU-01`) and T18 (`MOD-STU-15`) are given D12. **Ruling: Task 8 owns the Atomic Capabilities view, its DISABLED enablement controls and the `DEC-CAPAUTH-001` disclosure.** Task 21 is a **consumer** of the enablement state through the registry and holds no enablement control. |
| **C12** | T18 × T19 (design numbering) | `SCR-STU-LEARN` is *"a view of `SCR-STU-13`"* (D1) yet T19 gets its own route | **INTERNAL CONTRADICTION IN THE DESIGN** | **Ruling: keep the separate route** (`app/studio/learning/`) and **annotate it `SCR-STU-13`**, consistent with "screen ids are annotations, never route keys". **No new `SCR-STU-*` literal is minted for it.** Tasks 21 and 22 must use the identical annotation string; both briefs state it. |
| **C13** | T7 × T9 (design numbering) | `app/studio/library/**` versus `app/studio/libraries/**` | **NEAR-COLLISION** | Two route directories differing by one character, for two different modules. A glob (`app/studio/librar*`) in any gate hits both, and a mistyped import resolves to the wrong module. **Ruling: renamed to `app/studio/workflow-library/` (`MOD-STU-03`) and `app/studio/content-libraries/` (`MOD-STU-07`).** |
| **C14** | T21 × the build | `registries/generated/**` declared as a **write** path | **WRONG PATH** | `registries/generated/*.json` is **generated output** — `scripts/build-registries.mjs` rewrites it on every `pnpm build`. Hand-edited rows are erased at the next build and would be invisible until slice 10. **Ruling: Task 25 writes `scripts/build-registries.mjs` only** (the generator already carries derived rows — see its 63-source-defined + 18-derived module assertion at lines 388–392, which is the pattern to follow). `registries/generated/**` is declared as **output, owned by no task**. |
| **C15** | T21 × Task 4 | `scripts/**` declared as a glob | **FILE** | Task 4 needs `scripts/build-stu-module-reach.mjs`; T21 claimed all of `scripts/`. **Ruling: both declare exact files. `scripts/**` as a glob is forbidden in any path list in this slice.** |
| **C16** | T4 × the live tree | `src/routes/definitions.ts` | **FILE, unowned — and a live defect** | `ROUTES` currently gives `SURF-STU` `allowedRoles: ['TENANT_ADMIN','SUPERVISOR','QUALITY_MANAGER']` — the **Read-only Auditor is silently excluded**, which pre-empts `DEC-AUDSTU-001` in exactly the direction `AC-STU-157` forbids. **Ruling: Task 6 owns this file**, and the Auditor must reach a screen that **tells** them the decision is open, not be absent from the registry. The change is made through the evaluator's `clientDecisionRequired` outcome, never by widening `allowedRoles` silently. `tests/unit/routes.test.ts` moves with it. |
| **C17** | T20 × every module task | Gate imports of module fixtures | **ORDER** | The design says *"T18 and T19 run after T20's gate scaffolding exists only if T20 lands first; otherwise all five are parallel."* That is incoherent: a per-module gate that enumerates directories **before the modules exist** passes on an empty set. **Ruling: Task 24 is strictly after every module task**, and its enumeration gate asserts completeness against the eighteen-row module registry so an empty scan is red, not green. |
| **C18** | Every slice-5 task × the **running** hub-fix agent | `app/hub/**` and `tests/**` | **DISPATCH** | An agent is currently fixing two defects in `app/hub/**` and `tests/**`. **No slice-5 task declares `tests/**` as a glob** — every test file is named exactly — and **no slice-5 dispatch touching any path under `tests/` may go out until that agent reports.** Wave 1 tasks 1, 2, 3 and 5 each declare one exact new test file; hold them or hold their test files. **No slice-5 task touches `app/hub/**` at all.** |
| **C19** | T1 × T4 (design numbering) | `evaluateStudioAccess` versus `MOD-STU-18`'s consolidated matrix | **INTERFACE** | If the evaluator carries role lists it becomes a second copy of the matrix. **Ruling: Task 1 owns the evaluator and its input types; the evaluator takes a MATRIX ROW, never a role list.** Task 6 owns the matrix data. |
| **C20** | T3 × T4 (design numbering) | Grant states in the vocabulary versus grant records in `MOD-STU-18` | **INTERFACE** | **Ruling: Task 3 owns the closed set `Assigned · Active · Revoked · Expired`; Task 6 owns the grant records and D24's `Expired`-on-`GRANT-STU-IMPL` ruling.** |
| **C21** | Task 6 × Task 24 | §25.3's disputed eight-row table | **INTERFACE, both required** | Task 6 renders it as attributed-but-disputed; Task 24 gates that no Auditor cell resolves to a permission status. No file overlap. Both are mandatory; neither substitutes for the other. |
| **C22** | Task 25 × Task 26 | `pnpm verify` runs `build:registries` | **ORDER** | Task 26 is last and alone. |

### Task-against-itself rows

| Task | Self-conflict | Ruling |
|---|---|---|
| **Design T12** (`MOD-STU-06` + `MOD-STU-09`) | Two modules, one path list, and one of them has no route | **Split** — see C8. Now Tasks 12 and 17, in different waves. |
| **Design T18** (`MOD-STU-02` + `MOD-STU-15`) | Two modules, one path list | **Kept as one (Task 21).** `MOD-STU-02` *"owns nothing; composes 05, 07 and 13"* and both render on `SCR-STU-13`. Splitting them would split one screen across two tasks — the exact shape C8 and C9 exist to prevent. The internal seam is stated in the task. |
| **Design T4** (`MOD-STU-18` + two app routes) | Three paths, two of them routes | **Kept as one (Task 6).** `SCR-STU-01` sign-in and `SCR-STU-15` permissions are one module's two faces of one matrix; separating them would put the consolidated matrix in one task and its sign-in rendering in another. |
| **Design T20** (gates, glob) | `tests/coverage/slice-05-*.test.ts` is a glob | **Exact file: `tests/coverage/slice-05-gates.test.ts`.** One file, sixteen gates, gapless sequence guard carried from slice 3. |
| **Design T21** (registry, two globs) | Both globs wrong or over-broad | See C14, C15. Exact files only. |
| **Design T10** (`MOD-STU-04`, the exemplar) | Largest task in the slice | **NOT split — and the reasoning is in §5.2.** Both candidate internal seams were rejected because each either shares `app/studio/builder/page.tsx` or invents a second route for one catalogued screen. |

---

## 5. The Workflow Builder — where the journey splits, and why

### 5.1 The journey is split nine ways, along module-ownership seams the source itself draws

The master prompt demands the full interactive journey with five-surface effects at every step. Census §4 maps all twenty-two steps to owning modules; **that mapping is the split**, because a seam anywhere else would put one module's object in two tasks.

| Journey steps | Owning module | Task | Why the seam falls here |
|---|---|---|---|
| 1–2 open or create · choose taxonomy | `MOD-STU-03` | **9** | Owns `OBJ-STU-WORKFLOW` and the taxonomy. Every journey starts at the Library (`AC-STU-017`). |
| 3–5, 8 name/scope/version · add, reorder, remove screens · branches and the gate-failure default · validate | `MOD-STU-04` | **14** | One screen, one object graph, one matrix. The canvas is *simultaneously* the worker's path and the sequence-detection reference (L32042) — the one thing that must not be split. |
| 6 configure the nine sections | `MOD-STU-05` | **15** | Nine sections, five publication blockers, its own matrix and its own screen. |
| 7 author one level, draft the other two | `MOD-STU-09` | **12** | No route of its own; a component mounted in Section 1. Wave 3 so Wave 4 can mount it (C8). |
| 9 save draft | `FB-STU-01` | **2 + 14** | The disconnected editor state is spine (Task 2); the draft itself is the Builder's. |
| 10 compare versions | `MOD-STU-12` | **10** | The diff engine, injected into the chain (C6). |
| 11–14, 16 preview · submit · return with comments · revise · maker-checker approve | `MOD-STU-11` | **7** | The chain is a **service with four reuse consumers**, not a screen. |
| 15 evaluate (composed agents only, **never Workflows**) | `MOD-STU-15` | **21** | `TEST-STU-133` (L34148): no composed reasoning agent appears in any work package or executes on a device. |
| 17, 20, 21, 22 publish · supersede · roll back · archive | `MOD-STU-12` | **10** | One version object, one lifecycle, one rollback disclosure. |
| 18 generate the package | `MOD-STU-14` | **19** | The manifest and the pinning contract. |
| 19 **pin** | seam to slice 6 | **19** | `WF-AUT-010`'s surface is the **Hub**, `MOD-DOH-06`. Slice 5 **renders** the pin and **never fires a build**. |
| the journey itself, end to end | — | **23** | The shared fixture is Task 5; the walkthrough route composes the real module routes over it. |

### 5.2 `MOD-STU-04` itself does NOT split further — and here is why

Two internal seams were considered and both rejected:

- **Settings panel | canvas.** They share `app/studio/builder/page.tsx`, so parallel dispatch leaves the typecheck red until both land; sequential dispatch is not a wave.
- **Canvas | structural validation.** Validation is already lifted out of this module into the Task 5 publish-check registry (C4). What remains inside `MOD-STU-04` is the *live* panel that **reads** the registry — a few dozen lines, not a task.

Splitting further would either share a route file or invent a second route for `SCR-STU-03`, which catalogue B defines as **one** screen. The task's size is instead managed by (a) the check registry taking the eleven checks out, (b) the module registry taking the screen list out, and (c) the shell taking the chrome out.

### 5.3 The design's disjointness claim for the two largest tasks — checked

> *"T10 and T11 are the two largest tasks in the slice and share no path. T11 consumes T10's screen list through the module registry, not through a shared file."*

**On paths: the claim holds** — `src/studio/modules/stu-04/**` + `app/studio/builder/**` versus `src/studio/modules/stu-05/**` + `app/studio/screen-config/**` do not intersect.

**In substance it did not, until three fixes:**
1. The module registry it names **did not exist in any task's path list** (C2) — now Task 4's.
2. The Builder's live validation panel lists *"screens with no severity mapping, screens missing a curated coaching default in a declared locale"* — **`MOD-STU-05`'s and `MOD-STU-17`'s data.** Without the check registry (C4) both tasks implement the same publication blocker and `R6` ships twice.
3. `SCR-STU-04` hosts **two components neither task owned**: the difficulty coverage strip (C8) and the part-add inline panel (C9). Both are now Wave-3 tasks with frozen props and a one-line mount in Task 15.

With those three, the claim holds. **Recorded as verified, not inherited.**

---

## 6. Waves and exact file lists — diff this table before every dispatch

**Wave boundaries are file boundaries.** No two tasks in a wave touch the same path. Per RESUME §6a, the controller diffs each dispatch's path list against **every running agent**, not against the other dispatch in the same message. Three collisions happened in slice 4 because that was done against the wrong set.

**Globs are forbidden in a path list.** `src/studio/modules/stu-NN/**` is permitted only because exactly one task owns each `stu-NN` directory and creates every file in it. `tests/**`, `scripts/**` and `registries/generated/**` never appear.

| Wave | Task | Module / scope | Exact paths |
|---|---|---|---|
| **1** | 1 | Spine: `evaluateStudioAccess`, grants, identity SoD, fail-closed, Tier-2 refusal classification | `src/studio/access/evaluate.ts` · `src/studio/access/grants.ts` · `src/studio/access/refusal.ts` · `tests/unit/stu-access.test.ts` |
| **1** | 2 | Spine: screen states, D4 connectivity split, D22, adoption renderer, freshness | `src/studio/state/screen-states.ts` · `src/studio/state/connectivity.ts` · `src/studio/state/adoption.ts` · `tests/unit/stu-state.test.ts` |
| **1** | 3 | Spine: nineteen closed vocabularies + the `DEC-*` disclosure component | `src/studio/vocab/*.ts` · `src/studio/disclosure/DecisionDisclosure.tsx` · `src/studio/disclosure/decisions.ts` · `tests/unit/stu-vocab.test.ts` |
| **1** | 4 | Spine: module registry, screen catalogue B, shell, module index, seam registry, reach generator | `src/studio/modules.ts` · `src/studio/screens.ts` · `src/studio/seams.ts` · `app/studio/StudioShell.tsx` · `app/studio/page.tsx` · `src/ui/stu/StudioSeamNotice.tsx` · `scripts/build-stu-module-reach.mjs` · `tests/component/stu-shell.test.tsx` |
| **1** | 5 | Spine: the eleven publish-time checks as a registry · the `SEQ-011` journey fixture · `FiveSurfaceEffects` | `src/studio/publish/checks.ts` · `src/studio/publish/register.ts` · `src/studio/journey/fixture.ts` · `src/studio/journey/effects.ts` · `src/ui/stu/FiveSurfaceEffects.tsx` · `tests/unit/stu-publish-checks.test.ts` |
| **2** | 6 | `MOD-STU-18` — permissions, grants, `SCR-STU-15`, `SCR-STU-01`; D3, D13, D24; §25.3 disclosure | `src/studio/modules/stu-18/**` · `app/studio/permissions-and-grants/**` · `app/studio/sign-in/**` · `src/routes/definitions.ts` · `tests/unit/stu-permissions.test.ts` |
| **2** | 7 | `MOD-STU-11` — the chain as a service, `SCR-STU-11`, preview, staffability, `Stalled`, D17, **`DEC-LANEB-001`** | `src/studio/modules/stu-11/**` · `app/studio/approvals/**` · `tests/unit/stu-approvals.test.ts` |
| **2** | 8 | `MOD-STU-01` — Tier-2 boundary, Atomic Capabilities read-only, D12, S8 | `src/studio/modules/stu-01/**` · `app/studio/capabilities/**` · `tests/unit/stu-charter.test.ts` |
| **3** | 9 | `MOD-STU-03` — `OBJ-STU-WORKFLOW`, `SCR-STU-02`, taxonomy, D6, D20, never-zero linkage | `src/studio/modules/stu-03/**` · `app/studio/workflow-library/**` · `tests/unit/stu-library.test.ts` |
| **3** | 10 | `MOD-STU-12` — versioning, diff, linkage, archive, export, `SCR-STU-12`, D5, **rollback** | `src/studio/modules/stu-12/**` · `app/studio/versions/**` · `tests/unit/stu-versions.test.ts` |
| **3** | 11 | `MOD-STU-07` — three libraries, pointer model, `SCR-STU-06/07/08`, D15, D17, `DEC-EMBED-001` | `src/studio/modules/stu-07/**` · `app/studio/content-libraries/**` · `tests/unit/stu-content-libraries.test.ts` |
| **3** | 12 | `MOD-STU-09` — three levels × two locales, the six-cell strip, D16. **No route.** | `src/studio/modules/stu-09/**` · `tests/unit/stu-difficulty.test.ts` |
| **3** | 13 | `MOD-STU-10` — the parts seam, the inline panel, the **unconfirmed** path. **No route.** | `src/studio/modules/stu-10/**` · `src/studio/seams/parts/**` · `tests/unit/stu-parts-seam.test.ts` |
| **4** | 14 | **`MOD-STU-04` — the exemplar.** Four settings, exactly two defaults, the canvas, branching, `SCR-STU-03` | `src/studio/modules/stu-04/**` · `app/studio/builder/**` · `tests/unit/stu-builder.test.ts` |
| **4** | 15 | `MOD-STU-05` — the nine sections, `SCR-STU-04`, the arming confirmation (D23), D19 | `src/studio/modules/stu-05/**` · `app/studio/screen-configuration/**` · `tests/unit/stu-screen-config.test.ts` |
| **4** | 16 | `MOD-STU-17` — localisation, `SCR-STU-14`, the per-locale blocking check, fail-closed | `src/studio/modules/stu-17/**` · `app/studio/localisation/**` · `tests/unit/stu-localisation.test.ts` |
| **5** | 17 | `MOD-STU-06` — blocks, `SCR-STU-05`, the cross-Workflow refusal at the service layer | `src/studio/modules/stu-06/**` · `app/studio/instruction-blocks/**` · `tests/unit/stu-blocks.test.ts` |
| **5** | 18 | `MOD-STU-13` — two levels, three validation points, `SCR-STU-10`, the stricter default | `src/studio/modules/stu-13/**` · `app/studio/qualification-requirements/**` · `tests/unit/stu-qualifications.test.ts` |
| **5** | 19 | `MOD-STU-14` — the manifest (D8), integrity, `Quarantined`, pinning, `SB-STU-17` | `src/studio/modules/stu-14/**` · `app/studio/work-package/**` · `tests/unit/stu-package.test.ts` |
| **5** | 20 | `MOD-STU-08` — the Training Library, `SCR-STU-09`, the exclusion guarantee | `src/studio/modules/stu-08/**` · `app/studio/training-library/**` · `tests/unit/stu-training.test.ts` |
| **6** | 21 | `MOD-STU-02` + `MOD-STU-15` — agent configuration and the Agent Builder, `SCR-STU-13`, D13 | `src/studio/modules/stu-02/**` · `src/studio/modules/stu-15/**` · `app/studio/agents/**` · `tests/unit/stu-agents.test.ts` |
| **6** | 22 | `MOD-STU-16` — memory writes, the learning view, the Lane-B record, D14, D18, S11 | `src/studio/modules/stu-16/**` · `app/studio/learning/**` · `tests/unit/stu-learning.test.ts` |
| **6** | 23 | The journey walkthrough — 22 steps over Task 5's fixture, five-surface effects at every step | `app/studio/journey/**` · `tests/component/stu-journey.test.tsx` |
| **7** | 24 | The sixteen slice-5 gates, each planting its own defect | `tests/coverage/slice-05-gates.test.ts` |
| **7** | 25 | Registry closure — 41 derived notifications, 3 object gaps, both feature schemes mapped once | `scripts/build-registries.mjs` · `tests/unit/registry-build.test.ts` |
| **8** | 26 | Slice verification | — |

**Not owned by any task, and deliberately:** `registries/generated/**` (build output), `app/hub/**` (a different agent), everything under `src/surfaces/doh/**` and `src/surfaces/sa/**` (previous slices).

---

# WAVE 1 — THE FLOOR (Tasks 1–5, fully parallel)

Nothing in Wave 1 renders a module screen. Everything in Wave 2 onward consumes all five.

---

## Task 1 — `evaluateStudioAccess`, the grant model, and the Tier-2 refusal classification

**Files**
- Create `src/studio/access/evaluate.ts` — `evaluateStudioAccess`, layered on slice 3's `evaluateAccess` (`src/policy/evaluate.ts`)
- Create `src/studio/access/grants.ts` — `GRANT-STU-AUTHOR`, `GRANT-STU-AGENT`, `GRANT-STU-IMPL`
- Create `src/studio/access/refusal.ts` — the Tier-2 refusal classification (S7)
- Create `tests/unit/stu-access.test.ts`

**Produces:** `evaluateStudioAccess`, `StudioGrantId`, `StudioAccessInput`, `classifyTierTwoRefusal`.

**The contract (S1, L33389, L34584, L34592, L34605).** The Studio does **not** have slice 4's nine intersecting conditions. Its inputs are **role + grant + tier + object state + separation of duties**, and:

- **Separation of duties is evaluated BY IDENTITY, NEVER BY ROLE.** L33389: *"Person distinctness is checked against identity, not against role, because multi-role is additive and the audit log records identity and action rather than 'acting as role'. A user holding both the Supervisor and Quality Manager roles is still one person and still cannot occupy two stages."* A role-based check passes every test written with single-role personas — that is R8, and the fixture persona in this task holds **both** roles.
- **The grant is a first-class input, not a sixth role** (L34584): *"authoring is a capability, not a sixth role."*
- **Fail closed** (L34605, `AC-STU-156` L34673): *"Where the identity layer is unreachable, the Studio denies authoring capabilities and permits nothing beyond published read, failing closed. Where a grant is revoked mid-session, the next authorised action is refused with the revocation named; the session is not silently degraded."*

**C19 — the evaluator takes a MATRIX ROW, never a role list.** If it carries role lists it becomes a second copy of `MOD-STU-18`'s matrix, and the two will drift. Task 6 owns the matrix data; this task owns the evaluation.

**S7, the Tier-2 boundary (`FUNC-STU-01-01-C-1`, L31599; `AC-STU-041`, L31674).** *"Refused at the application programming interface layer, not merely hidden in the user interface"*, and *"the refusal itself is audited, and if the audit write fails, **the refusal is still enforced because refusing is the safe direction**."* Note the asymmetry against `FB-STU-10`: an audit failure kills a **write**, and does **not** revive a **refusal**.

- [ ] **Step 1: Failing test — identity, not role**
```ts
it('refuses the second stage to one person holding both roles', () => {
  const person = { identityId: 'IDN-DUAL-01', roles: ['SUPERVISOR', 'QUALITY_MANAGER'] }
  const authored = evaluateStudioAccess({ ...reviewRow, actorOfRecord: 'IDN-DUAL-01', authorOfRecord: 'IDN-DUAL-01', identity: person })
  expect(authored.outcome).toBe('explicitlyProhibited')
  expect(authored.reason).toMatch(/one person/i)
})
it('does not let a second role rescue the same identity', () => {
  // The defect this pins: a role-based check sees SUPERVISOR authored and
  // QUALITY_MANAGER reviewing, finds two roles, and allows it.
  expect(evaluateStudioAccess({ ...releaseRow, actorOfRecord: 'IDN-DUAL-01', reviewerOfRecord: 'IDN-DUAL-01' }).outcome)
    .not.toBe('allowed')
})
```
- [ ] **Step 2: Failing test — fail closed**
```ts
it('permits nothing beyond published read when the identity layer is unreachable', () => {
  const r = evaluateStudioAccess({ ...authorRow, identityLayer: 'unreachable' })
  expect(r.outcome).toBe('unavailable')
  expect(evaluateStudioAccess({ ...publishedReadRow, identityLayer: 'unreachable' }).outcome).toBe('readOnly')
})
it('names the revocation rather than degrading the session', () => {
  const r = evaluateStudioAccess({ ...authorRow, grantState: 'Revoked' })
  expect(r.reason).toMatch(/GRANT-STU-AUTHOR/)
  expect(r.reason).toMatch(/revok/i)
})
```
- [ ] **Step 3: RED.** `pnpm vitest run tests/unit/stu-access.test.ts`
- [ ] **Step 4: Implement.** Compose slice 3's `evaluateAccess` — do not fork it. Count the call sites of `evaluateAccess` before and after and put both counts in your report.
- [ ] **Step 5: The Tier-2 refusal.** A refused define-class request is refused **at the service layer**, audited, and **still refused when the audit write fails**. The covering test forces the audit write to fail and asserts the refusal still holds.
- [ ] **Step 6: GREEN, typecheck, lint. Report.**

---

## Task 2 — The Studio state model, the connectivity ruling, and the adoption renderer

**Files**
- Create `src/studio/state/screen-states.ts` — the applicable subset of the thirteen, with the four departures
- Create `src/studio/state/connectivity.ts` — D4's four-way split
- Create `src/studio/state/adoption.ts` — S10 over slice 3's fifteen command states (`src/surfaces/sa/command-state.ts`)
- Create `tests/unit/stu-state.test.ts`

**Produces:** `STU_APPLICABLE_STATES`, `studioConnectivityTreatment`, `renderAdoption`.

**S4 — the four departures, quoted whole from L48330** (the source's own paragraph, not a restatement):

> *"All fifteen screens render the contract defaults with four stated departures. `STATE-07` offline is not applicable anywhere on this surface, because authoring requires a connection; a lost connection renders `STATE-12` with unsaved-work protection. `STATE-09` queued applies only on `SCR-STU-04` and `SCR-STU-11` at publication, where the new version's distribution to devices renders in command state rather than as complete. `STATE-10` and `STATE-11` apply on `SCR-STU-04` and `SCR-STU-13`: when the drafting aid is degraded or unavailable, the author writes all three difficulty levels manually and the panel says so, because the platform's artificial intelligence accelerates authoring and never publishes. `STATE-04` validation on this surface carries a special weight: the locale completeness check and the missing-severity-mapping check are publication blockers, not warnings."*

**That paragraph contradicts chapter 20 and the global contract, and D4 is the reconciliation.** L48014 says `STATE-08`/`STATE-13`; L48330 says `STATE-12`; chapter 20's own connectivity state machine (L30839–L30851) names four states that are none of the thirteen — Connected, Degraded, ReadOnlyCache, Suspended — and `FB-STU-01` (L30863) describes *"an explicit disconnected state"* with a local draft buffer, submit disabled, and *"no save has been recorded"*. **No `DEC-*` identifier exists for this.** D4's split is the only reading satisfying L48014, L48330 and L30842 together, and it renders as a client-delegated choice under APP-012 with all three readings and their locators on screen.

- [ ] **Step 1: Failing test — `STATE-07` is absent and nothing queues**
```ts
it('excludes STATE-07 from every Studio screen', () => {
  expect(STU_APPLICABLE_STATES.map(s => s.id)).not.toContain('STATE-07')
})
it('applies STATE-09 on exactly two screens', () => {
  expect(screensWithState('STATE-09')).toEqual(['SCR-STU-04', 'SCR-STU-11'])
})
it('applies STATE-10 and STATE-11 on exactly two screens', () => {
  expect(screensWithState('STATE-10')).toEqual(['SCR-STU-04', 'SCR-STU-13'])
  expect(screensWithState('STATE-11')).toEqual(['SCR-STU-04', 'SCR-STU-13'])
})
```
- [ ] **Step 2: Failing test — the four-way split**
```ts
it('splits connection loss four ways and never queues', () => {
  expect(studioConnectivityTreatment({ kind: 'loaded-content' })).toMatchObject({ state: 'STATE-08', freshness: 'required' })
  expect(studioConnectivityTreatment({ kind: 'failed-read' })).toMatchObject({ state: 'STATE-12', namesWhatFailed: true, namesWhetherAnythingWasWritten: true })
  expect(studioConnectivityTreatment({ kind: 'write-control' })).toMatchObject({ render: 'disabled', queued: false })
  expect(studioConnectivityTreatment({ kind: 'editor' })).toMatchObject({ localBuffer: true, message: /no save has been recorded/i })
  expect(studioConnectivityTreatment({ kind: 'reconnect' })).toMatchObject({ state: 'STATE-13', revalidate: 'full' })
})
```
- [ ] **Step 3: RED, implement, GREEN.**
- [ ] **Step 4: The adoption renderer (S10).** `AC-STU-023` (L31226) *"No Studio view describes a published version as in force on a device."* `AC-STU-112` (L33590) *"Adoption is reported per device with explicit command states and never as a binary claim of being live."* And the reconciliation rule, L33579: a device whose command state cannot be determined renders **unknown with its last known state and timestamp, never as adopted.**
```ts
it('renders an indeterminate device as unknown with its last known state, never adopted', () => {
  const r = renderAdoption({ deviceId: 'DEV-1', commandState: null, lastKnown: { state: 'dispatched', at: 'T0' } })
  expect(r.label).toMatch(/unknown/i); expect(r.label).toMatch(/T0/); expect(r.label).not.toMatch(/adopted|live/i)
})
```
- [ ] **Step 5:** `SB-STU-03`'s honest summary line (L31304) is the exemplar and ships as a fixture string: *"Published. One Job notified. Zero of one devices on this version."*
- [ ] **Step 6: GREEN, typecheck, lint. Report.**

---

## Task 3 — Nineteen closed vocabularies and the decision-disclosure component

**Files**
- Create `src/studio/vocab/*.ts` — one file per vocabulary group, each `as const satisfies readonly T[]` with a **real** exhaustiveness check
- Create `src/studio/disclosure/decisions.ts` — the twenty-four `DEC-*` records with both readings and their locators
- Create `src/studio/disclosure/DecisionDisclosure.tsx`
- Create `tests/unit/stu-vocab.test.ts`

**The nineteen closed sets, with their locators (design §4):**

| vocabulary | members | locator |
|---|---|---|
| Studio module ids | `MOD-STU-01` … `MOD-STU-18`, **derived** | L30911 |
| Studio screen ids | `SCR-STU-01` … `SCR-STU-15` | L48259 |
| Capture types | measurement entry · photo capture · barcode or Quick Response code scan · checkbox confirmation · digital signature · free text · dropdown selection · **none** | `AC-STU-065`, L32421 |
| The four Workflow settings | name · Job Type · optional Service Type tag · locale coverage | L32040 |
| The two inheritable defaults | default escalation routing template · default coaching trigger percentage | L32040 |
| The nine configuration sections | screen content · input type · timing · gate and proof · specification limits · coaching content · deviation rules and severity mapping · tool and equipment · qualification override | L32216 |
| Difficulty levels | simple · standard · expanded | L32945 |
| Locales | English · Spanish | L34357, L34381 |
| Notification channels | in-app · email | L32613, L32636 |
| Version bump classes | PATCH · MINOR · MAJOR | L33426 |
| Adoption states per Job | Notified · Decided-adopt · Decided-defer · Outdated | L33479 |
| Submission states | Submitted · Returned with comments · Advanced · Released · Withdrawn — **plus `Stalled` as a flag (D21)** | L33289 |
| Package states | Defined · Built · Delivered · Pinned · Superseded — **plus `Quarantined` and `Distributable` as flags (D21)** | L33839 |
| Coaching asset states | Uploaded · Approved · Indexed · Flagged for review · Retired | L32647 |
| Composed agent states | Composed · Evaluation pending · Evaluation passed · In approval · Platform review · Deployed | L34030 |
| Grant states | Assigned · Active · Revoked · Expired | L34573 |
| Fallback contracts | `FB-STU-01` … `FB-STU-10` | L31443 |
| Command states | the fifteen, **shared from slice 3** — import, never re-declare | L31181 |
| Permission tokens | the nine, **shared from slice 2a** — import `PERMISSION_OUTCOMES` | slice-4 D8 |

**Two counts that must never be minted.** There is **no eighth capture type** and **no third inheritable default**. L32040: *"an implementation that adds a third inheritable default, however convenient, departs from the specification and must be raised as a change request."* Severity is the obvious candidate and is the one thing forbidden (`MOD-STU-04` row 6).

**D19 — the capture types are ADOPTED, not open.** `DEC-CAP-001` (L32232): two seven-type lists exist and they **differ**. §1.7/§7.8.3 list measurement, scan, photo, **checklist**, **boolean**, electronic signature, free text; §5.5.3 lists measurement entry, photo capture, barcode or QR scan, **checkbox confirmation**, digital signature, free text, **dropdown selection**. The adopted position is the **§5.5.3** set, *"with checkbox confirmation carrying a multiplicity setting, so one confirmation is what §1.7 and §7.8.3 call a boolean and many confirmations are what they call a checklist; the merge removes a type name and no capability."* Build the closed set **from `AC-STU-065`'s own words at L32421** and render both readings in the disclosure. `TEST-WF-AUT-002-04` (L53401) makes divergence a **build failure**.

- [ ] **Step 1: Failing test — the counts that must never be minted**
```ts
it('holds exactly seven capture types plus none, and no eighth', () => {
  expect(CAPTURE_TYPES).toHaveLength(8) // seven plus 'none'
  expect(CAPTURE_TYPES).not.toContain('checklist')
  expect(CAPTURE_TYPES).not.toContain('boolean')
})
it('holds exactly two inheritable defaults, and severity is not one', () => {
  expect(INHERITABLE_DEFAULTS).toEqual(['default-escalation-routing-template', 'default-coaching-trigger-percentage'])
})
it('holds exactly four Workflow settings and exactly nine sections', () => {
  expect(WORKFLOW_SETTINGS).toHaveLength(4)
  expect(CONFIGURATION_SECTIONS).toHaveLength(9)
})
```
- [ ] **Step 2: The exhaustiveness check is REAL.** Each set uses the `type Missing = Exclude<Union, (typeof SET)[number]>; const _x: Missing extends never ? true : never = true` pattern from `src/policy/decision.ts`. **Prove it:** temporarily add a member to a union without adding it to the array, confirm `pnpm typecheck` fails, restore. Record the failing output in your report.
- [ ] **Step 3: The disclosure component.** One component renders a decision: its identifier, **both** readings, each reading's locator, the adopted working position, and the words **"client-delegated choice under APP-012"**. `DecisionDisclosure` is the only place a decision is rendered; a module writing its own disclosure prose is a defect.
- [ ] **Step 4: Twenty-four decision records** (design §3, D1–D24) each with `id`, `question`, `readings: [{text, locator}, …]`, `adopted`, `alias?`. `DEC-WFROLL-001` carries `alias: 'DEC-VERROLL-001'` and **both render**; `DEC-LANEB-001` carries both `AC-STU-097`/L33397 and `AC-STU-138`/L34332 and **neither is marked as the source's answer**.
- [ ] **Step 5: GREEN, typecheck, lint. Report the typecheck-failure evidence from Step 2.**

---

## Task 4 — The module registry, screen catalogue B, the Studio shell, and the seam registry

**Files**
- Create `src/studio/modules.ts` — the eighteen modules, slugs, matrix-row vocabulary
- Create `src/studio/screens.ts` — catalogue B, fifteen rows
- Create `src/studio/seams.ts` — the cross-slice seam registry
- Create `app/studio/StudioShell.tsx`
- Modify `app/studio/page.tsx` — the module index (currently a surface stub)
- Create `src/ui/stu/StudioSeamNotice.tsx`
- Create `scripts/build-stu-module-reach.mjs`
- Create `tests/component/stu-shell.test.tsx`

**C3 — DO NOT re-open the `src`→`app` value cycle.** `src/surfaces/doh/modules.ts` documents it in full: deriving `rolesReaching` from matrices that live under `app/` pointed the shared contract at its own consumers and closed a value cycle that survived only because the field was a getter. The fix was a build-time generator. **Do the same here**: `scripts/build-stu-module-reach.mjs` writes `registries/generated/stu/module-reach.json`, runs from `pnpm build:registries` immediately after `build-doh-module-reach.mjs`, and refuses to write if anything under `src/studio/` value-imports `app/`.

**The eighteen modules and their route slugs.** Slugs are plain names. **Screen ids are annotations; a slug is never a screen number.**

| module | name | slug | screen annotation |
|---|---|---|---|
| `MOD-STU-01` | Charter and Position | `capabilities` | `SCR-STU-13` (catalogue A `SCR-STU-CAPS`, folded at L48271) |
| `MOD-STU-02` | Agent Configuration | `agents` | `SCR-STU-13` |
| `MOD-STU-03` | Workflow Library and Tenant Workspace | `workflow-library` | `SCR-STU-02` |
| `MOD-STU-04` | Workflow Builder | `builder` | `SCR-STU-03` |
| `MOD-STU-05` | Screen Authoring | `screen-configuration` | `SCR-STU-04` |
| `MOD-STU-06` | Shared Instruction Blocks | `instruction-blocks` | `SCR-STU-05` |
| `MOD-STU-07` | Content Libraries | `content-libraries` | `SCR-STU-06`, `SCR-STU-07`, `SCR-STU-08` (three tabs) |
| `MOD-STU-08` | Training Library | `training-library` | `SCR-STU-09` |
| `MOD-STU-09` | Difficulty Levels | *(no route)* | rendered in Section 1 of `SCR-STU-04` |
| `MOD-STU-10` | Parts-Registry Authoring Seam | *(no route)* | inline panel of `SCR-STU-04` |
| `MOD-STU-11` | Approval Workflow | `approvals` | `SCR-STU-11` |
| `MOD-STU-12` | Versioning and Publication | `versions` | `SCR-STU-12` |
| `MOD-STU-13` | Qualification Requirements | `qualification-requirements` | `SCR-STU-10` |
| `MOD-STU-14` | The Offline Package | `work-package` | **uncatalogued** — `SB-STU-17` (L33905); catalogue B has no row |
| `MOD-STU-15` | The Agent Builder | `agents` (shared with 02) | `SCR-STU-13` |
| `MOD-STU-16` | Memory and Two-Lane Learning | `learning` | `SCR-STU-13` (catalogue A `SCR-STU-LEARN`, a **view**, D1 / C12) |
| `MOD-STU-17` | Localisation | `localisation` | `SCR-STU-14` |
| `MOD-STU-18` | Permissions and Roles | `permissions-and-grants` + `sign-in` | `SCR-STU-15`, `SCR-STU-01` |

**D1 — catalogue B is the route key.** The nineteen one-off literals outside both catalogues (`SCR-STU-SCREENCFG` L11251, `SCR-STU-AGENTBUILDER` L12027, `SCR-STU-DEGRADE-01` L15086, `SCR-STU-GRANT-01` L16457, `SCR-STU-APPROVE` L20338, `SCR-STU-SCREEN-CONFIG` L61890, `SCR-STU-RELEASE` L62023/L68317, `SCR-STU-AGENTCFG`/`SCR-STU-LIBRARIES`/`SCR-STU-CAPABILITY` L68013, `SCR-STU-BUILDER`/`SCR-STU-DIFFICULTY`/`SCR-STU-QUALREQ` L68164, `SCR-STU-QUEUE`/`SCR-STU-PREVIEW` L68317, `SCR-STU-PUBLISH`/`SCR-STU-VERSIONS` L68467, `SCR-STU-VERSION-01` L93443, `SCR-STU-PUB-01` L100558) are recorded as **uncatalogued storyboard names** and **none becomes a route**.

**S12 — the derived count renders with its qualifier, everywhere.** The module index shows eighteen modules and **must** carry *"derived count, not stated in the Statement of Work"* with `DEC-STUDIO-001` linked. `AC-STU-014` (L30992) binds this build's own documents and screens, not only the blueprint's.

- [ ] **Step 1: Failing test — no bare count**
```ts
it('renders the module count with its derived qualifier and DEC-STUDIO-001', () => {
  render(<StudioModuleIndex />)
  const header = screen.getByText(/18|eighteen/i).closest('[data-count-scope]')!
  expect(header).toHaveTextContent(/derived count, not stated in the Statement of Work/i)
  expect(header).toHaveTextContent('DEC-STUDIO-001')
})
```
- [ ] **Step 2: The shell.** Module id and screen annotation render as an **annotation region**, never as a route segment. The role switcher offers the five tenant roles plus the Plant Manager **persona** (D14/`DEC-ROLE-001`: *"a persona whose Studio access is delivered by a Supervisor role without the authoring grant"* — L34522) and the two platform access classes. **Worker renders as not-a-Studio-user with the cost stated** (`AC-STU-150`, L34667: *"A Worker cannot reach any Studio route by any means."*).
- [ ] **Step 3: The seam registry.** Twenty-one seams from design §5 / census §6, each with consumer, owner, slice, and contract sentence. **Five carry no owning slice at all** (§6.3) and their records say so: `MOD-DOH-19` Parts Registry, the severity action bundle editor, the tag-to-qualification-set mapping, the composed-agent platform review queue, the multimodal embedding service. `StudioSeamNotice` renders *"owner stated, no slice assigned"* for those five rather than inventing one.
- [ ] **Step 4: The reach generator.** Assert it refuses to run when `src/studio/` value-imports `app/` — plant the import, prove the generator exits non-zero, restore.
- [ ] **Step 5: axe on the shell and the index. GREEN, typecheck, lint. Report.**

---

## Task 5 — The publish-check registry, the journey fixture, and the five-surface effects

**Files**
- Create `src/studio/publish/checks.ts` — the eleven checks as data
- Create `src/studio/publish/register.ts` — registration and evaluation
- Create `src/studio/journey/fixture.ts` — the `SEQ-011` scenario
- Create `src/studio/journey/effects.ts` — the twenty-two steps' five-surface effects
- Create `src/ui/stu/FiveSurfaceEffects.tsx`
- Create `tests/unit/stu-publish-checks.test.ts`

**S3 — publish-time validation is a fail-closed GATE SET, not a warning set.** L48330: *"the locale completeness check and the missing-severity-mapping check are publication blockers, not warnings."* The eleven, each naming its blocking element, with the module that will register its implementation:

| # | check | locator | registered by |
|---|---|---|---|
| 1 | structural validity — every node reachable, every branch target resolvable, exactly one entry point | L32101 | Task 14 |
| 2 | a severity mapping on every screen that can deviate | L32308 | Task 15 |
| 3 | a capture type inside the adopted seven | L32291 | Task 15 |
| 4 | specification limits complete with unit and drawing reference on every measurement screen | L32301 | Task 15 |
| 5 | a curated coaching default per declared locale | L32304 | Task 15 |
| 6 | locale completeness across every worker-facing element | L34409 | Task 16 |
| 7 | every library pointer resolvable | L32483, L33211 | Tasks 11, 13, 17 |
| 8 | every named certification still maintained | L32321 | Task 18 |
| 9 | every capability dependency satisfiable | L30782 | Task 8 |
| 10 | a recorded Severity 1 arming confirmation | L32313 | Task 15 |
| 11 | a staffable chain | L33307 | Task 7 |

**Where the check itself cannot run, publication is BLOCKED** (`FB-STU-09` L31453; `AC-STU-149` L34487): *"where the check itself cannot run, publication is blocked, failing closed, because publishing an unverified locale is the exact failure the check exists to prevent."*

**C4 — this registry exists so no check is implemented twice.** The Builder's live validation panel and the publish path both **read** it. A module implementing a sibling's check is a defect.

- [ ] **Step 1: Failing test — eleven, each blocking individually, each naming its element**
```ts
it('blocks publication on each of the eleven checks individually', () => {
  for (const check of PUBLISH_CHECKS) {
    const r = evaluatePublish(fixtureViolating(check.id))
    expect(r.blocked).toBe(true)
    expect(r.blockers.map(b => b.checkId)).toContain(check.id)
    expect(r.blockers.find(b => b.checkId === check.id)!.blockingElement).toBeTruthy()
  }
})
it('blocks publication when a check cannot run at all', () => {
  expect(evaluatePublish(fixtureWith({ checkStatus: { 'locale-completeness': 'unrunnable' } })).blocked).toBe(true)
})
```
**This test must fail on an empty registry**, not pass vacuously — assert `PUBLISH_CHECKS.length === 11` first and assert every id is distinct.

- [ ] **Step 2: The journey fixture.** `SEQ-011`'s ending state (L68040) is the most complete single statement of a finished draft in the source and is the target state:

> *"a draft of **Assembly — Wheel Bolt Torque Verification** exists with its screens authored, the wheel bolt torque specification set to a lower limit of 44 Newton metres and an upper limit of 47 Newton metres against drawing reference `DWG-A441`, severity banding set so that a departure of 0 to 10 per cent outside the limits maps to Severity 2 and beyond 10 per cent maps to Severity 1, the containment checklists selected per severity level, coaching defaults designated, the qualification baseline set to Torque Wrench Operator Certification with screen-level overrides where authored, all three work-instruction difficulty levels present, and both language variants complete; the draft is submitted into the approval chain and is not published, not versioned as a release, and not available for Job assignment."*

The four sequence states are the fixture's state machine: `STATE-STU-PREPARED` → `STATE-WF-DRAFT-SUBMITTED` → `STATE-WF-RELEASE-APPROVED` → `STATE-WF-PUBLISHED-V210`.

- [ ] **Step 3: The five-surface effects.** Twenty-two step records, each carrying DOH · STU · CC · FL · SA, quoted from census §4 with the `WF-AUT-0NN` locator. **Where a surface is unaffected the record says so explicitly** — an empty string is a defect, the same rule as a blank matrix cell.
- [ ] **Step 4: `FB-SEQ-012`, the one-person quality team, as a first-class fixture state** (L68262, L68291): *"no eligible Reviewer exists because the only other grant-holder authored the submission… the submission stays submitted and unpublished, no version exists, no package can be built, and no Job can link to it"* — *"work does not get published faster, it does not get published at all."*
- [ ] **Step 5: GREEN, typecheck, lint. Report.**

---

# WAVE 2 — GOVERNANCE BEFORE CONTENT (Tasks 6–8, fully parallel)

---

## Task 6 — `MOD-STU-18` Permissions and Roles in the Studio

**Files:** `src/studio/modules/stu-18/**` · `app/studio/permissions-and-grants/**` · `app/studio/sign-in/**` · **modify** `src/routes/definitions.ts` · `tests/unit/stu-permissions.test.ts`

**Screens:** `SCR-STU-15` Studio permissions and grants (L48273, catalogue B only) and `SCR-STU-01` Sign-in (L48259). Storyboard `SB-STU-21` (L34631). **Section §5.18, card L34500–L34686.**

**Purpose (L34533):** *"Gate every Studio capability by role and grant, and enforce a separation-of-duties floor that no tenant can widen."*
**Owning surface (L34532):** *"Standards and Operations Studio (`SURF-STU`); grant administration sits in the tenant administration area inside the Delivery Operations Hub."*

**The two rules that bound every other module (L34508):** *"Drafts and in-review versions are visible only to grant-holders and the chain; published content is what read-only roles see. Nothing in the table can be widened by a tenant beyond the platform's separation-of-duties floor: an author can never approve their own work, and the Release Authority can never be bypassed."*

> **THE QUOTATION BELOW IS A CONVENIENCE. The frozen source at the stated line spans is the authority. Read them with `sed -n` before you build. A disagreement in any cell, any row, or the row count is a FINDING to report — not something to resolve silently in either direction.**

### 6.1 §5.18's own table — L34512–L34518, **five** data rows

This is the SOURCE table. It is headed *"Fixed role"*, it **includes Plant Manager**, and it **omits the Read-only Auditor entirely.**

| Fixed role, as the source heads the column | Access in the Studio |
|---|---|
| Quality Manager | Full authoring across all nine sections, Shared Instruction Blocks, and Content Libraries which the Quality Manager owns; manages Qualification Requirements; Release Authority by tenant default; holds or delegates the Agent Author capability; learning read view |
| Supervisor | Read-only access to published Workflow content — screen sequences, instruction text, specification limits — for reference. With the authoring grant, meaning a quality engineer staffed in this role: create Workflows, author all nine sections, create and apply Shared Instruction Blocks, propose Content Library changes, and submit for review; act as Reviewer on submissions they did not author; cannot approve or release |
| Plant Manager | Read-only access to published Workflow content. No access to drafts or in-review versions; cannot edit |
| Tenant Admin | Administers Studio capacities — assigns and revokes the authoring grant and the Agent Author delegation, per the tenant administration area; read-only access to published content; holds no stage of the approval chain, for separation of duties |
| Frontline Worker | No access to the Studio. Workers meet Workflow content exclusively through the Frontline surface during Run execution |

### 6.2 Chapter 20's expansion — L30819–L30828, **eight** data rows

| Tenant role | Studio access as stated | Classification |
|---|---|---|
| Quality Manager (`ROLE-TEN-QM`) | Allowed — full authoring across all nine screen configuration sections, Shared Instruction Blocks, and Content Libraries which the Quality Manager owns; manages Qualification Requirements; Release Authority by tenant default; holds or delegates the Agent Author capability; learning read view | `SoW Fact` — §5.18 |
| Supervisor (`ROLE-TEN-SUP`), without the authoring grant | Read-only — published Workflow content only: screen sequences, instruction text, specification limits, for reference | `SoW Fact` — §5.18 |
| Supervisor with the authoring grant (`GRANT-STU-AUTHOR`) | Allowed with conditions — create Workflows, author all nine sections, create and apply Shared Instruction Blocks, propose Content Library changes, submit for review, act as Reviewer on submissions they did not author; cannot approve or release | `SoW Fact` — §5.18 |
| Tenant Admin (`ROLE-TEN-ADMIN`) | Allowed with conditions — administers Studio capacities, assigning and revoking the authoring grant and the Agent Author delegation from the tenant administration area; read-only access to published content; holds no stage of the approval chain | `SoW Fact` — §5.18 |
| Read-only Auditor (`ROLE-TEN-AUD`) | Client Decision Required — `DEC-AUDSTU-001`; the §5.18 table does not include this role | `Client Decision Required` |
| Worker (`ROLE-TEN-WKR`) | Explicitly prohibited — no Studio access of any kind | `SoW Fact` — §5.18 |
| Plant Manager (persona, listed as a fixed role in §5.18) | Read-only — published Workflow content; no access to drafts or in-review versions; cannot edit. Carried under `DEC-ROLE-001` | `Client Decision Required` |
| Implementation team, during onboarding (`GRANT-STU-IMPL`) | Allowed with conditions — full authoring and submission rights, no approve or release rights, all actions audited, access revoked at the conclusion of onboarding | `SoW Fact` — §5.11.4, §5.18 |

### 6.3 Platform roles and the Studio — L30807–L30812, **four** data rows

| Platform role | Standing Studio access | Access through a named class | Note |
|---|---|---|---|
| Root Super Admin (`ROLE-PLAT-ROOT`) | Explicitly prohibited | Allowed with conditions — compliance-emergency path only, dual-authorised with one Admin, time-boxed, scope declared before it opens | Exactly one account exists; created through the backend at platform commissioning. |
| Admin (`ROLE-PLAT-ADMIN`) | Explicitly prohibited | Allowed with conditions — support session read-only, or as the second authorisation on the compliance-emergency path | Cannot author or release tenant Workflow content in any class. |
| Platform Engineer (`ROLE-PLAT-ENG`) | Explicitly prohibited | Allowed with conditions — support session read-only; registry and evaluation work happens in the console, not the Studio | Mutating console changes submit into the approval cycle. |
| Support (`ROLE-PLAT-SUP`) | Explicitly prohibited | Allowed with conditions — read-only, time-boxed support session with a tenant-visible banner | No configuration changes in any surface. |

### 6.4 The consolidated Studio permission matrix — L34539–L34563, **twenty-three** data rows, nine columns

**The widest matrix on the surface.** L34537: *"Every cell carries an explicit status."*

| # | Capability | Quality Manager | Supervisor with `GRANT-STU-AUTHOR` | Supervisor without the grant | Plant Manager persona | Tenant Admin | Read-only Auditor | Worker | `GRANT-STU-IMPL` |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Open the Studio | Allowed | Allowed | Allowed | Allowed | Allowed | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions — onboarding only |
| 2 | Read published Workflow content | Allowed | Allowed | Read-only | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions |
| 3 | Read drafts and in-review versions | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions |
| 4 | Create a Workflow | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 5 | Author all nine configuration sections | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 6 | Create and apply Shared Instruction Blocks | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 7 | Create, edit, archive Content Library items | Allowed — the Quality Manager owns the libraries | Explicitly prohibited — may propose only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 8 | Propose a Content Library change | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 9 | Manage Qualification Requirements | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 10 | Submit for review | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 11 | Act as Reviewer | Allowed with conditions — not own submission | Allowed with conditions — only on submissions they did not author | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 12 | Approve or release | Allowed with conditions — Release Authority by tenant default, never on own submission or one they reviewed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 13 | Hold or delegate the Agent Author capability | Allowed | Explicitly prohibited unless delegated `GRANT-STU-AGENT` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited — assigns it, does not hold it by default | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 14 | Compose a reasoning agent | Allowed with conditions — Growth or Enterprise tier | Allowed with conditions — only with `GRANT-STU-AGENT` and Growth or Enterprise | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — only if delegated `GRANT-STU-AGENT` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 15 | Enable or disable an atomic capability | Client Decision Required — `DEC-CAPAUTH-001` | Client Decision Required — `DEC-CAPAUTH-001` | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-CAPAUTH-001` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 16 | Read the learning view | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Explicitly prohibited |
| 17 | Decide a Lane-B proposal | Allowed — in the Client Command Center | Client Decision Required — `DEC-LANEBAUTH-001` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited — no Client Command Center access at all | Explicitly prohibited | Explicitly prohibited |
| 18 | Assign or revoke `GRANT-STU-AUTHOR` and `GRANT-STU-AGENT` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed — administers Studio capacities from the tenant administration area | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 19 | Hold any stage of the approval chain | Allowed with conditions — one stage per submission | Allowed with conditions — Author or Reviewer only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited — holds no stage, for separation of duties | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited — author and submit only |
| 20 | Publish Training Library content | Allowed with conditions — as Release Authority | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 21 | Generate a portable-document-format export of a version | Allowed | Allowed | Read-only — may generate the read-only export | Read-only — may generate the read-only export | Read-only — may generate the read-only export | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions |
| 22 | Widen any of the above beyond the separation-of-duties floor | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 23 | Use any Studio capability while offline | Unavailable — the Studio requires an active connection | Unavailable — same reason | Unavailable — same reason | Unavailable — same reason | Unavailable — same reason | Unavailable — same reason | Explicitly prohibited — no access at all | Unavailable — same reason |

**Row 23 settles the `Unavailable` sense for the whole surface's connectivity axis.** Seven columns `Unavailable — the Studio requires an active connection` (sense A, the capability exists and is withheld by a condition → **DISABLED with the condition named**) against one column `Explicitly prohibited — no access at all` (never held → **ABSENT**). Same row, same axis, two tokens, two renderings.
**Row 22 is a meta-row:** not a capability, the floor itself asserted as a row, prohibited for all nine columns **including the Tenant Admin who administers everything else.**
**Row 21's `Read-only` carries a rendering instruction inside the token** — `Read-only — may generate the read-only export`. Mapping `Read-only` mechanically to a disabled control removes an export the source grants.

### 6.5 THE DISPUTED RESTATEMENTS — build the disclosure, never the statuses

**D2: the chapter-20 module matrices govern every cell, without exception.** Three coarser tables disagree and all three are transcribed below so you can see the disagreement rather than inherit it.

**§25.3 — L48319–L48328, eight data rows. THIS IS THE ONE THE CENSUS FLAGS AS THE MOST LIKELY SOURCE OF A SLICE-5 BRIEF DEFECT.**

| Action | Tenant Admin | Supervisor | Quality Manager | Read-only Auditor | Worker |
|---|---|---|---|---|---|
| Open published Workflow content | Read-only | Read-only | Allowed | Not applicable — the Auditor works from the Delivery Operations Hub record, which carries every publication event | Explicitly prohibited |
| Create or edit a Workflow draft | Unavailable | Allowed with conditions — only with the authoring grant | Allowed | Unavailable | Explicitly prohibited |
| Act as Reviewer on a submission | Explicitly prohibited — the Tenant Admin holds no stage of the chain | Allowed with conditions — only with the authoring grant and only on submissions this identity did not author | Allowed with conditions — never on this identity's own submission | Unavailable | Explicitly prohibited |
| Publish a version as Release Authority | Explicitly prohibited | Unavailable | Allowed with conditions — tenant default, overridable per workflow | Unavailable | Explicitly prohibited |
| Maintain Content Libraries | Unavailable | Allowed with conditions — may propose changes through the approval chain | Allowed | Read-only | Explicitly prohibited |
| Compose a reasoning agent | Allowed with conditions — may delegate the Agent Author capability but not exercise it | Unavailable | Allowed with conditions — requires the Agent Author capability and a Growth or Enterprise tier | Unavailable | Explicitly prohibited |
| Assign or revoke the authoring grant | Allowed | Unavailable | Unavailable | Read-only | Explicitly prohibited |
| Define a severity level | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

> **THIS TABLE GIVES THE READ-ONLY AUDITOR A STATUS ON ALL EIGHT ROWS** — `Not applicable`, `Unavailable`, `Read-only` — where chapter 20 gives `Client Decision Required` on the equivalent rows and **`AC-STU-157` (L34674) forbids exactly that**: *"every Read-only Auditor cell states `Client Decision Required` rather than being guessed."*
>
> **It is a compact, authoritative-looking, five-column table and it is the single most likely thing on this surface for an implementer to transcribe.** It is recorded as **attributed-but-disputed**: it renders on `SCR-STU-15` inside `DecisionDisclosure` as the *alternative reading* under `DEC-AUDSTU-001`, with its L48319 locator, **and not one of its Auditor statuses reaches an affordance.**
>
> It also disagrees on two further cells: row 5 gives the Auditor `Read-only` on Content Libraries where `MOD-STU-07`'s matrix (L32637) gives `Client Decision Required`; row 7 gives the Auditor `Read-only` on grant administration where the consolidated matrix (L34558) gives `Explicitly prohibited`.

**`MTX-TEN-02b` — L22031–L22050, eighteen data rows.** Preamble L22029: *"The count is `Derived Clarification` under `DEC-STUDIO-001`. Every Read-only Auditor cell in this table is `Client Decision Required` under `DEC-AUDSTU-001`, and every Worker cell is `Explicitly prohibited` … both are stated once here and repeated in the table because blank cells are prohibited."*

| # | Derived module | Tenant Admin | Supervisor | Quality Manager | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|
| `MOD-STU-01` | Charter and Position | `Read-only` | `Read-only` | `Read-only` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-02` | Agent Configuration | `Read-only` | `Allowed with conditions` `[Y3]` | `Allowed` `[Y4]` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-03` | Workflow Library and Tenant Workspace | `Read-only` `[Y5]` | `Allowed with conditions` `[Y3]` | `Allowed` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-04` | Workflow Builder | `Unavailable` `[Y6]` | `Allowed with conditions` `[Y3]` | `Allowed` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-05` | Screen Authoring, the nine configuration sections | `Unavailable` `[Y6]` | `Allowed with conditions` `[Y3]` | `Allowed` `[Y7]` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-06` | Shared Instruction Blocks | `Read-only` | `Allowed with conditions` `[Y3]` | `Allowed` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-07` | Content Libraries | `Read-only` | `Allowed with conditions` `[Y8]` | `Allowed` `[Y9]` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-08` | Training Library | `Read-only` | `Allowed with conditions` `[Y3]` | `Allowed` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y10]` |
| `MOD-STU-09` | Work-Instruction Difficulty Levels | `Read-only` | `Allowed with conditions` `[Y11]` | `Allowed with conditions` `[Y11]` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-10` | Parts-Registry Authoring Seam | `Unavailable` `[Y12]` | `Allowed with conditions` `[Y3]` | `Allowed` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-11` | Approval Workflow | `Explicitly prohibited` `[Y13]` | `Allowed with conditions` `[Y14]` | `Allowed with conditions` `[Y15]` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-12` | Versioning and Publication | `Explicitly prohibited` `[Y13]` | `Explicitly prohibited` `[Y16]` | `Allowed with conditions` `[Y17]` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-13` | Qualification Requirements | `Read-only` | `Allowed with conditions` `[Y3]` | `Allowed` `[Y18]` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-14` | Offline Package | `Read-only` `[Y19]` | `Read-only` `[Y19]` | `Read-only` `[Y19]` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-15` | Agent Builder | `Allowed with conditions` `[Y20]` | `Client Decision Required` `[Y21]` | `Allowed with conditions` `[Y22]` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-16` | Memory and the Two-Lane Learning Loop | `Read-only` | `Read-only` | `Allowed with conditions` `[Y23]` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-17` | Localisation | `Read-only` | `Allowed with conditions` `[Y3]` | `Allowed with conditions` `[Y24]` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |
| `MOD-STU-18` | Permissions and Roles in the Studio | `Allowed with conditions` `[Y20]` | `Read-only` | `Read-only` | `Client Decision Required` `[Y1]` | `Explicitly prohibited` `[Y2]` |

The four conditions at L22052 that change a build decision:
- `[Y6]` *"The Tenant Admin administers Studio capacities and reads published content; no authoring capacity is assigned"* — attached to three `Unavailable` cells.
- `[Y12]` *"The bulk-upload registry is administered in the tenant administration area; the Studio holds only the inline-add seam"*.
- `[Y19]` *"The offline package is assembled by the platform at run assignment and is inspected rather than authored"*.
- `[Y21]` *"`DEC-DELEG-001`: §5.18 permits the Quality Manager to delegate the Agent Author capability while §4.8.4 states delegation is deferred beyond V1. **Until decided, the build denies Supervisor access to the Agent Builder and names the decision.**"*

**Where it disagrees with chapter 20:** `MOD-STU-04`/`MOD-STU-05` give the Tenant Admin `Unavailable` here, chapter 20 gives `Explicitly prohibited` on the draft canvas and `Read-only` on the published one (L32061–L32062, L32259–L32260). `MOD-STU-12` gives the Supervisor `Explicitly prohibited` here, chapter 20 gives the Supervisor-with-grant `Allowed` on six of twelve rows (L33458–L33468). Under D9 these render **oppositely**, so D2 matters: **chapter 20 governs, and these sense-B `Unavailable` cells never render at all.**

**`MTX-TEN-01` — L21928, one data row**

| Surface | Tenant Admin | Supervisor | Quality Manager | Read-only Auditor | Worker |
|---|---|---|---|---|---|
| Standards and Operations Studio (`SURF-STU`) | `Allowed with conditions` `[U6]` | `Read-only` `[U7]` | `Allowed` `[U8]` | `Client Decision Required` `[U9]` | `Explicitly prohibited` `[U10]` |

**`MTX-PLAT-01` — L21068, one data row**

| Surface | Root Super Admin | Admin | Platform Engineer | Support |
|---|---|---|---|---|
| Standards and Operations Studio (`SURF-STU`) | `Allowed with conditions` `[P4]` | `Allowed with conditions` `[P8]` | `Explicitly prohibited` `[P6]` | `Allowed with conditions` `[P7]` |

**`MTX-PLAT-01` gives the Platform Engineer `Explicitly prohibited` at surface level** while §20.1.3's platform table (L30811) gives the same role `Allowed with conditions — support session read-only`. **Both are true**: the surface matrix states **standing** access, the chapter table states access through a **named class**. A build reading only the surface matrix renders the Engineer as never able to see a Studio screen, which is wrong inside a support session. Render both, labelled.

### 6.6 Decisions this task owns

- **D3 / `DEC-AUDSTU-001` (L34524) — the slice's headline disclosure.** 47 cells across 15 of 26 matrices. L34524 is **binding**: *"Until decided, every Read-only Auditor cell in this chapter reads `Client Decision Required` rather than being guessed."* Render the token, name the decision, put **both** readings on screen, and **state the cost the source itself states**: option (a) *"would force auditors to depend on the audited party to produce evidence, which weakens the audit."* Option (b) is **staged behind the decision**, never enabled.
- **D13 / `DEC-DELEG-001`** — **not in chapter 20's open-decisions table**, yet chapter 20 gives `MOD-STU-15` a whole column presuming delegation exists. §4.8.4: *"Delegation is deferred beyond V1."* Build `[Y21]`'s interim position and name the decision.
- **D24 / `DEC-TENGRANT-001` (L16457)** — raised outside chapter 20 and absent from its table. States L34573: *"A grant is Assigned, Active, Revoked, or Expired, the last applying to the implementation team's capacity at onboarding's end."* **`Expired` applies to `GRANT-STU-IMPL`; the other two grants render `Client Decision Required`.**
- **D14 / `DEC-ROLE-001` (L34522)** — Plant Manager is a **persona** *"whose Studio access is delivered by a Supervisor role without the authoring grant, which produces exactly the access §5.18 describes"*; the divergence is recorded, not resolved.

### 6.7 Steps

- [ ] **Step 1: Read all five matrices at their line spans.** Report the row counts you found: 5 / 8 / 4 / 23 / 8 / 18 / 1 / 1.
- [ ] **Step 2: Failing test — no Auditor cell resolves to a permission status**
```ts
it('leaves every Read-only Auditor cell as clientDecisionRequired', () => {
  const auditorCells = CONSOLIDATED_MATRIX.map(r => r.cells.READONLY_AUDITOR)
  expect(auditorCells.length).toBe(23)           // not vacuous on an empty matrix
  const resolved = auditorCells.filter(c => c.outcome !== 'clientDecisionRequired' && c.outcome !== 'explicitlyProhibited')
  expect(resolved).toEqual([])
})
it('names DEC-AUDSTU-001 in every clientDecisionRequired Auditor denial', () => {
  for (const c of CONSOLIDATED_MATRIX.map(r => r.cells.READONLY_AUDITOR).filter(c => c.outcome === 'clientDecisionRequired'))
    expect(c.reason).toContain('DEC-AUDSTU-001')
})
```
- [ ] **Step 3: Failing test — row 23's two senses render oppositely**
```ts
it('renders row 23 Unavailable as disabled-with-condition and the Worker cell as absent', () => {
  render(<PermissionsScreen role="QUALITY_MANAGER" online={false} />)
  expect(screen.getByRole('button', { name: /author/i })).toBeDisabled()
  expect(screen.getByText(/the Studio requires an active connection/i)).toBeInTheDocument()
  render(<PermissionsScreen role="WORKER" />)
  expect(screen.queryByRole('button', { name: /author/i })).toBeNull()
})
```
- [ ] **Step 4: Failing test — the §25.3 disclosure exists and is inert**
```ts
it('renders §25.3 as attributed-but-disputed and grants nothing from it', () => {
  render(<PermissionsScreen role="READONLY_AUDITOR" />)
  expect(screen.getByText(/L48319/)).toBeInTheDocument()
  expect(screen.getByText(/attributed.*disputed/i)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /maintain content libraries/i })).toBeNull()
})
```
- [ ] **Step 5: `src/routes/definitions.ts` (C16).** `SURF-STU` currently omits `READONLY_AUDITOR` from `allowedRoles`, which pre-empts `DEC-AUDSTU-001` in the direction `AC-STU-157` forbids. The Auditor must reach a screen that **tells them the decision is open**. Make the change through the evaluator's `clientDecisionRequired` outcome; **do not widen `allowedRoles` silently**, and update `tests/unit/routes.test.ts` in the same change. **Hold this step until the running `tests/**` agent reports (C18).**
- [ ] **Step 6: `SCR-STU-01` sign-in and `SB-STU-21` (L34631)** — the signed-in identity, its roles, its grants, the tenant tier, then each Studio capability marked Available or Unavailable **with the specific missing condition named**, e.g. *"Requires the authoring grant. Ask your Tenant Admin."* The Tenant Admin's view adds Assign and Revoke **with a note that the Tenant Admin holds no stage of the approval chain**.
- [ ] **Step 7: Fail-closed test.** Identity layer unreachable → nothing beyond published read. Grant revoked mid-session → the next authorised action is refused **with the revocation named**, and the session is not silently degraded.
- [ ] **Step 8: The audit path.** Assign/revoke are writes: domain refusals → audit → mutation. **The covering test mutates the grant record before the audit fails and asserts the grant did not change.**
- [ ] **Step 9: axe. GREEN, typecheck, lint. Report both call-site counts for any shared helper you touched.**

---

## Task 7 — `MOD-STU-11` Approval Workflow: the chain as a service

**Files:** `src/studio/modules/stu-11/**` · `app/studio/approvals/**` · `tests/unit/stu-approvals.test.ts`
**Screen:** `SCR-STU-11` (L48269); catalogue A `SCR-STU-QUEUE` (L31079), `SCR-STU-PREVIEW` (L31080), `SCR-STU-DRAFTAI` (L31089, a **state** of this screen per D1). Storyboard `SB-STU-14` (L33357). **Section §5.11, card L33233–L33416.**

**Purpose (L33262):** *"Enforce three-stage human sign-off with separation of duties on every piece of content that reaches the frontline."*
**User benefit (L33263):** *"A wrong specification limit has to survive three people to reach a worker, and the record of who passed it is permanent."*

**S2 — this is a SERVICE with four reuse consumers, not a screen.** `MOD-STU-08` Training Library (L32846), `MOD-STU-07` Content Library edits under `DEC-LIBREV-001` (L32678), `MOD-STU-09` every drafted difficulty level (L32994), `MOD-STU-15` composed agents plus two further gates (L34052). `FUNC-STU-11-06-A-1` (L33320): *"one governance floor for everything that reaches the floor."* **The covering test exercises the chain through ALL FOUR consumers, not one.**

**The chain, verbatim (L33239–L33243):**
> ***"No Workflow content reaches the frontline without explicit human sign-off at each stage.** The chain has three stages:
> - **Author** — completes the Workflow and submits it for review.
> - **Reviewer** — a qualified peer or senior quality engineer opens the submission from the Approval Queue, steps through each screen in preview, reviews instruction text, specification limits, coaching content, and deviation rules, and either returns the Workflow with comments or advances it. **The Reviewer cannot edit content directly — corrections go back to the Author.**
> - **Release Authority** — grants final publication sign-off against the diff and the change summary, creating a new version. **The Release Authority cannot be bypassed.**"*

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L33268–L33279 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L33268–L33279, **ten** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker | Implementation team grant |
|---|---|---|---|---|---|---|---|---|
| 1 | Author and submit | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — onboarding only |
| 2 | Review a submission | Allowed with conditions — not their own submission, and not if they will release it | Allowed with conditions — act as Reviewer on submissions they did not author | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 3 | Edit content while reviewing | Explicitly prohibited — the Reviewer cannot edit; corrections go back to the Author | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 4 | Return a submission with comments | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 5 | Advance a submission to release | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 6 | Release and publish | Allowed with conditions — Release Authority by tenant default, never on a submission they authored or reviewed | Explicitly prohibited — cannot approve or release | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 7 | Hold a per-workflow Release Authority override | Allowed with conditions — assignment eligibility is `DEC-RELAUTH-001` | Client Decision Required — `DEC-RELAUTH-001` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 8 | Assign Release Authority per workflow | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 9 | Bypass the Release Authority | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 10 | Read the approval log | Allowed | Allowed | Read-only | Read-only — holds no stage of the chain | Client Decision Required — `DEC-AUDSTU-001`; the Delivery Operations Hub audit log is the specified route | Explicitly prohibited | Allowed with conditions |

**The implementation-team column is `Explicitly prohibited` on nine of ten rows** and the tenth is the read. That column is the separation-of-duties floor made visible: *"Approval authority rests with the tenant from day one"* (L33251).

### What this task must build

- **Separation of duties by IDENTITY (L33389).** *"A user holding both the Supervisor and Quality Manager roles is still one person and still cannot occupy two stages."* `TEST-STU-152` (L34681) is the source's own test. The fixture persona holds both roles.
- **Release Authority (L33247):** defaults to the Quality Manager as a **tenant-level** default with a per-workflow override. *"It is not assigned per Service Type"* — nothing structural hangs on the tag.
- **`DEC-RELAUTH-001` (L33255), the silent operational deadlock.** *"a tenant with exactly one Quality Manager and one authoring-grant holder can author and review but cannot release… The Workflow stalls and the floor keeps running on the prior version, which is safe but is also a silent operational deadlock."* Build the recommended **pre-submission staffing check naming the shortfall**, *"because a deadlock discovered at release time wastes an entire authoring cycle."* Register it as publish-check #11.
- **`Stalled` as a FLAG (D21).** In `SEQ-012`'s diagram only, and the only state that makes the deadlock visible to a tenant. The enumerated states remain the five of L33289: Submitted · Returned with comments · Advanced · Released · Withdrawn.
- **`SB-STU-14`'s one hard control rule:** *"The Advance control is disabled with a stated reason if the reviewer is the Author."* At the Release Authority stage *"the preview is replaced by the diff and the change summary, with Release and Decline controls and a mandatory reason field on Decline."*
- **Reconnect honesty (L33365):** *"A transition interrupted by connectivity loss is not recorded, so the submission remains at its prior stage; on reconnection the actor sees the true stage and repeats the transition. **No transition is ever inferred from a partial request.**"*
- **Rejection requires comments (L53535):** *"Rejection without comments is refused, because the comment is the instruction to the Author."* And `AC-WF-AUT-006-03` (L53543): *"Returned items are visible in the Author's queue independently of notification delivery."*
- **Revision cannot skip the Reviewer (L53567), and `AC-WF-AUT-007-04` (L53575): *"No auto-acceptance of a resubmission exists."*
- **D17 / `DEC-LIBREV-001`:** *"lightweight review"* means the **full three-stage chain with a scoped preview limited to the changed item** — the source's own recommendation and its own interim treatment. Expose it as the reuse contract the four consumers call.
- **`FB-SEQ-012` (L68262)** renders as a first-class outcome, using Task 5's fixture.
- **C6 — the diff engine is INJECTED.** Declare `DiffEngine` and a `diffUnavailable` default **in this task's own path**. `FUNC-STU-12-01-A-2` (L33486): the submission is **held rather than advanced** when the diff is unavailable, *"because advancing an unvalidated classification could auto-adopt a behaviour change."* **Task 10 never edits this task's files.**

### §2.1 — `DEC-LANEB-001`: this task owns the disclosure

`DEC-LANEB-001` (L33253). Reading (a): the chain is absolute and a Lane-B patch must still pass Reviewer and Release Authority. Reading (b): the Lane-B decision by a Quality Manager in the Client Command Center *is* the human sign-off. **`AC-STU-097` (L33397) and `AC-STU-138` (L34332) cannot both hold for a package-borne Lane-B value.** The only instruction binding both sides is `AC-STU-104` (L33404) / `AC-STU-143` (L34337): **surface it, never implement it silently.**

**Build:** the source's hybrid (D14) as the adopted working position, labelled a client-delegated choice under APP-012 — reading (b) restricted to values that cannot alter a specification limit, a severity mapping or a gate rule; anything touching those three routes through the full chain. **Render both readings with both locators.** Neither is asserted as the source's answer. The value classifier ships as a **named interface over a seeded field map** because `DEC-PKGFIELD-001` is open, and the map's provenance renders.

### Steps

- [ ] **Step 1:** Read L33268–L33279. Report the row count you found (expected 10).
- [ ] **Step 2: Failing test — identity distinctness across all four reuse consumers**
```ts
const CONSUMERS = ['workflow', 'training-library', 'content-library-edit', 'difficulty-level', 'composed-agent'] as const
it('refuses a second stage to the same identity in every consumer', () => {
  expect(CONSUMERS.length).toBeGreaterThan(4)   // not vacuous
  for (const c of CONSUMERS) {
    const s = submit({ consumer: c, author: 'IDN-DUAL-01' })
    expect(review(s, { actor: 'IDN-DUAL-01', roles: ['SUPERVISOR', 'QUALITY_MANAGER'] }).ok).toBe(false)
  }
})
```
- [ ] **Step 3: Failing test — the chain cannot be bypassed and rejection needs comments**
```ts
it('refuses release on a submission the actor authored or reviewed', () => { … })
it('refuses a return with no comments', () => { expect(returnWithComments(s, { comments: '' }).ok).toBe(false) })
it('refuses auto-acceptance of a resubmission', () => { expect(resubmit(s).state).toBe('Submitted') })
it('holds rather than advances when the diff engine is unavailable', () => {
  expect(advance(s, { diff: diffUnavailable }).state).toBe('Submitted')
})
```
- [ ] **Step 4: The staffability check.** Register publish-check #11 into Task 5's registry. Test the one-person-quality-team fixture: submission stays submitted, **no version exists, no package can be built, no Job can link to it.**
- [ ] **Step 5: `DEC-LANEB-001` disclosure** through Task 3's `DecisionDisclosure`, both locators, `AC-STU-104`/`AC-STU-143` named. Test asserts **both** locator strings render.
- [ ] **Step 6: The audit path.** Every transition is a write: domain refusals → audit → mutation. **The covering test advances the submission before the audit fails and asserts the stage did not change and no version was minted.**
- [ ] **Step 7: axe on the queue, the preview and the Release stage. GREEN, typecheck, lint. Report.**

---

## Task 8 — `MOD-STU-01` Charter and Position, and the Atomic Capabilities view

**Files:** `src/studio/modules/stu-01/**` · `app/studio/capabilities/**` · `tests/unit/stu-charter.test.ts`
**Screen:** `SCR-STU-CAPS` Atomic Capabilities (L31084, catalogue A; folded into `SCR-STU-13` in catalogue B at L48271). Storyboards `SB-STU-02` (L30751) and `SB-STU-04` (L31640). **Section §5.1, card L31552–L31678.**

**Purpose (L31565):** *"Establish and enforce the Studio's authority boundary: enable, configure, compose; never define."*
**User benefit (L31566):** *"A tenant can never accidentally create a safety-critical capability that has no evaluation scenarios behind it, and can always see why a control does not exist."*

> **THE TWO MATRICES BELOW ARE A CONVENIENCE. The frozen source at L31571–L31579 and L30757–L30765 is the authority. Read them before you build; report any disagreement as a finding.**

### Permission matrix — L31571–L31579, **seven** data rows

**This is the ONLY module matrix on the surface in actor-per-row shape; every other is action-per-row.**

| Actor | See the charter statements | Change the boundary | Author an atom | Enable a capability within entitlement |
|---|---|---|---|---|
| Quality Manager (`ROLE-TEN-QM`) | Read-only | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — within entitlement, audited |
| Supervisor with authoring grant | Read-only | Explicitly prohibited | Explicitly prohibited | Client Decision Required — the Statement of Work names an authorised user without naming the role; see `DEC-CAPAUTH-001` in section 20.2.15 |
| Supervisor without the grant | Read-only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Tenant Admin (`ROLE-TEN-ADMIN`) | Read-only | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-CAPAUTH-001` |
| Read-only Auditor (`ROLE-TEN-AUD`) | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Worker (`ROLE-TEN-WKR`) | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Platform Engineer (`ROLE-PLAT-ENG`) | Not applicable — the charter is a tenant-surface boundary, expressed platform-side as registry and entitlement controls | Allowed with conditions — engineering change plus Admin approval | Allowed with conditions — handler engineered, evaluation scenarios written, evaluation gate passed | Allowed with conditions — sets the entitlement rather than the enablement |

### The tier authority matrix — L30757–L30765, **seven** data rows

**This matrix governs every module on the surface.** It is quoted once, here, and consumed by the rest through this task's export.

| Action | Tier 1: Super Admin platform console | Tier 2: Standards and Operations Studio | Tier 3: Client Command Center | Floor: Frontline Worker Application |
|---|---|---|---|---|
| Author an atomic capability | Allowed with conditions — engineering change, evaluation gate, maker-checker approval | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Register an atomic capability | Allowed with conditions — Platform Engineer submits, Admin approves | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Set a tenant's capability entitlement | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Enable a capability within entitlement | Allowed | Allowed with conditions — authorised Studio user, within entitlement | Explicitly prohibited | Explicitly prohibited |
| Configure a capability per screen | Not applicable — the console does not hold tenant Workflow content | Allowed with conditions — authoring grant required | Explicitly prohibited | Explicitly prohibited |
| Compose a reasoning agent from capabilities | Not applicable — composition is a tenant act performed in the Studio | Allowed with conditions — Agent Author capability, Growth or Enterprise tier | Explicitly prohibited | Explicitly prohibited |
| Execute a configured capability at run time | Not applicable — execution happens on the device and in the orchestrator | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — within the pinned work package |

**Rendering by rule:** every *Change the boundary* and *Author an atom* cell is **categorical** `Explicitly prohibited` → **ABSENT**. The `DEC-CAPAUTH-001` cells render **DISABLED with the decision identifier**, because the Quality Manager column on the same row is *also* `Client Decision Required` — **nobody holds it, and the control's existence is exactly what the decision is about.**

### D12 — the Atomic Capabilities view, and why it is built read-only

**Row 1 of `MOD-STU-15`'s matrix (L34009) and row 15 of the consolidated matrix (L34555) both read `Client Decision Required` in all four tenant columns.** Nobody holds enablement — and enablement decides **which of the nine configuration sections exist across every Workflow.** `DEC-CAPAUTH-001` (L33992) recommends option (b), Tenant Admin with recorded Quality Manager consultation.

**Build the view read-only, with the enablement controls DISABLED and `DEC-CAPAUTH-001` named, and seed the enablement state so the nine sections render.** Building an operator would pre-empt the decision. Omitting the view would hide the mechanism `AC-STU-006` and `AC-STU-008` require to be visible. **C11: this task owns D12; Task 21 is a consumer and holds no enablement control.**

**`SB-STU-02` (L30751), four columns:** *"capability name in full words, enablement state, the configuration surfaces it switches on, and the Workflows currently relying on it"*, each row carrying *"an enable or disable control and a plain-language consequence line, for example 'Disabling tolerance validation removes the Specification Limits section from all measurement screens and blocks publication of any Workflow that depends on it.'"* Capabilities outside entitlement are *"shown greyed with the reason stated as 'Not included in this tenant's entitlement' rather than hidden"*. **"There is no control anywhere in this view that creates a capability, because none exists."**

**`SB-STU-04` (L31640)** — in any configuration section whose capability is not enabled: *"the Studio renders a single line where the section would be: the section name, the words 'Not available', and the specific reason, for example 'Requires the containment response capability, which is not enabled for this tenant.' A link leads to the Atomic Capabilities view for users permitted to enable it, and states who to ask for users who are not."*

### S8 — configuration follows capability, and the two anti-data-loss rules

- Enabling switches a configuration surface on; disabling removes it and **blocks publication** of dependent Workflows **with the dependent screens named** (`AC-STU-006`, `AC-STU-007`, L30781–L30782). Register publish-check #9.
- `FUNC-STU-01-01-B-1` (L31597), under `FB-STU-07`: an unresolvable capability state makes surfaces *"freeze read-only rather than disappearing, so an author is never shown an empty section that silently discarded a value."*
- **States (L31589):** *"Not applicable — the charter is a standing constraint and has no lifecycle."*
- **Objects: none persisted.** L31585: *"The module's output is the set of enforcement decisions applied by other modules: which configuration surfaces exist, which controls are absent, and which actions are refused."*
- **The one notification row deliberately absent (L31664):** *"A request to define a foundation object is refused | Not applicable — a refusal is audited, not notified; notifying every refusal would train users to ignore notifications."* **Do not add it.**

### Steps

- [ ] **Step 1:** Read L31571–L31579 and L30757–L30765. Report both row counts (expected 7 and 7).
- [ ] **Step 2: Failing test — no capability-creating control exists anywhere**
```ts
it('offers no create-a-capability control on any Studio route', () => {
  // AC-STU-005 (L30780): "No user interface control anywhere in the Studio
  // creates, edits, or deletes an atomic capability."
  const html = readAllBuiltStudioRoutes()
  expect(html.length).toBeGreaterThan(0)                      // not vacuous
  expect(html.join('')).not.toMatch(/new capability|create capability|define an atom/i)
})
```
- [ ] **Step 3: Failing test — the refusal survives an audit failure**
```ts
it('still refuses a define-class request when the audit write fails', () => {
  // FUNC-STU-01-01-C-1, L31599: "refusing is the safe direction."
  expect(requestDefine({ auditWrite: 'fails' })).toMatchObject({ refused: true, audited: false })
})
it('refuses at the service layer, not only in the interface', () => {
  expect(studioService.defineCapability({ actor: 'QUALITY_MANAGER' }).ok).toBe(false)
})
```
- [ ] **Step 4: Failing test — the enablement control is disabled, not absent, and names its decision**
```ts
it('disables enablement for all four tenant columns and names DEC-CAPAUTH-001', () => {
  for (const role of ['QUALITY_MANAGER','SUPERVISOR','TENANT_ADMIN'] as const) {
    render(<AtomicCapabilitiesView role={role} />)
    const btn = screen.getByRole('button', { name: /enable tolerance validation/i })
    expect(btn).toBeDisabled()
    expect(screen.getByText(/DEC-CAPAUTH-001/)).toBeInTheDocument()
  }
})
```
- [ ] **Step 5: `SB-STU-04`'s not-available line** as an exported component the nine-section panel (Task 15) consumes. Its test **fails when the reason string is removed**, not when an array is empty.
- [ ] **Step 6: The freeze-read-only rule.** An unresolvable capability state freezes the section read-only; assert **no value is discarded** by round-tripping a configured value through the frozen state.
- [ ] **Step 7: Register publish-check #9. axe. GREEN, typecheck, lint. Report.**

---

# WAVE 3 — THE RECORD, ITS HISTORY, ITS CONTENT, AND THE TWO EARLY MOUNTS (Tasks 9–13, fully parallel)

Tasks 12 and 13 were moved into this wave from the design's Waves 4 and 5 (conflicts C8 and C9): both produce components that mount inside `SCR-STU-04`, which Wave 4 builds, so they must land first.

---

## Task 9 — `MOD-STU-03` Workflow Library and Tenant Workspace

**Files:** `src/studio/modules/stu-03/**` · `app/studio/workflow-library/**` · `tests/unit/stu-library.test.ts`
**Screen:** `SCR-STU-02` (L48260) — **the landing view**, filtered to Published by default (`AC-STU-017`, L31097); catalogue A `SCR-STU-LIBRARY` (L31069), `SCR-STU-NEWWF` (L31070). Storyboard `SB-STU-06` (L31976). **Section §5.3, card L31871–L32030.**

**Purpose (L31886):** *"Hold, classify, filter, and expose the tenant's complete Workflow inventory with authoring status, version, and linkage."*

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L31902–L31912 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L31902–L31912, **nine** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker | Implementation team grant |
|---|---|---|---|---|---|---|---|---|
| 1 | Open the Library filtered to Published | Allowed | Allowed | Allowed | Allowed | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions — during onboarding only |
| 2 | See Draft and In Review Workflows | Allowed | Allowed with conditions — grant-holders and the chain only | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions — during onboarding only |
| 3 | Create a new Workflow | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — author and submit only |
| 4 | Apply a Job Type to a Workflow | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 5 | Apply a Service Type tag | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 6 | Create a custom Job Type or Service Type tag | Allowed | Client Decision Required — the Statement of Work says tenants may create custom types without naming the role | Explicitly prohibited | Client Decision Required — the tenant administration area is a plausible home; not stated | Explicitly prohibited | Explicitly prohibited | Client Decision Required |
| 7 | Edit or delete a platform-seeded starter type | Explicitly prohibited — inherited read-only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 8 | See linkage counts | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions |
| 9 | See another tenant's Workflows | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**Row 1 is the widest read on the surface; row 2 is the narrowest read that is not a prohibition.** Together they are the **draft-visibility boundary** that `AC-STU-048` (L32013) tests. **R14: enforce it in the READ.** Two selectors, two reads — never one unfiltered read with the draft rows hidden in the component. **The gate asserts the selector, not the render.**

### What this task must build

- **`SB-STU-06` (L31976), including the DISABLED-not-hidden rule:** *"A New Workflow button sits top-right, visible to grant-holders and **disabled with a stated reason for read-only roles rather than hidden**, so a Supervisor understands they need the grant rather than assuming the feature is missing."* This is the surface's canonical routing-prohibition rendering.
- **The zero-is-forbidden rule (L31930, L31956, `AC-STU-053` L32018):** *"linkage counts unavailable from the Delivery Operations Hub render as 'Linkage unavailable, last retrieved at' with the timestamp, **never as zero**"* — because *"showing zero linked Jobs would invite an author to change a Workflow they believe is unused."* Same defect shape as slice 4's loading-never-renders-a-zero rule, on a different axis. **Seam to `MOD-DOH-05`/`MOD-DOH-06`, slice 6** — render `StudioSeamNotice`.
- **D20 / `DEC-TAX-002` (L31892), adopted:** *"The platform-seeded catalogue of Job Types and Service Type tags ships empty: zero seeded entries at version 1. Every tenant creates its own Job Types and Service Type tags immediately, on every tier, with no platform approval step, so no tenant is blocked."* **L31894 is unambiguous: the sixteen names are NOT invented** — *"no screen, table, or example in this chapter names a starter Job Type or Service Type tag as though it were canonical."* **No fixture names one.** The internal tension is recorded rather than smoothed: the card's own option (c) is listed as **contradicting §5.3.2**, and L31896 reconciles it — *"Because the mechanism and the counts are preserved and only the load is deferred, §5.3.2's eight-and-eight statement is satisfied on delivery of the names rather than contradicted."* Render both.
- **`DEC-TAXROLE-001` (L31914)** stays open — the custom-type control renders `Client Decision Required` with the **Tenant Admin** reading recommended and *"an uncontrolled custom Job Type list degrades Workflow selection on the floor"* stated as the cost.
- **Job Type is structural** (L31890): *"every Workflow carries exactly one, the Delivery Operations Hub filters workflow selection by it, and it is available at every commercial tier"*. **Service Type is optional** and *"never decides platform behaviour and nothing structural may hang on it."*
- **D6 — a Workflow, as distinct from a version, HAS an Archived state.** Chapter 20 says yes and flags it as derived from §5.12.3 (L31124, L31924); `OBJ-036` (L8598) omits it. **Yes wins**: the module's own state machine draws it, and a Library with no archived filter cannot express *not linkable*. Record `OBJ-036` as the narrower statement, not a contradiction.
- **The transition the source cannot support (L31959–L31972, L31974):** the state machine draws `Archived --> Published : republication is not defined in the source`. *"the Statement of Work… does not state whether an archived version can be un-archived. Not specified in the Statement of Work. Recorded as part of `DEC-ARCH-001`."* **Render it as an "unspecified in source" entry. Do not invent the control.**
- **Security (L32004):** *"a Workflow identifier from another tenant returns a refusal, not an empty result, and the attempt is audited."*
- **Objects:** `OBJ-STU-WORKFLOW` (L31922) = `OBJ-036` (L8589). **D11: the numeric register is canonical; the mnemonic is a label.**

### Steps

- [ ] **Step 1:** Read L31902–L31912. Report the row count (expected 9).
- [ ] **Step 2: Failing test — draft visibility is a READ, not a render**
```ts
it('returns only published rows to a Supervisor without the grant', () => {
  const rows = workflowsVisibleTo({ role: 'SUPERVISOR', grants: [] })
  expect(rows.length).toBeGreaterThan(0)                        // not vacuous
  expect(rows.every(r => r.status === 'Published')).toBe(true)
  expect(rows.map(r => r.id)).not.toContain(DRAFT_FIXTURE_ID)
})
it('gives the component nothing it may not read', () => {
  render(<WorkflowLibrary rows={workflowsVisibleTo({ role: 'TENANT_ADMIN', grants: [] })} />)
  expect(screen.queryByText(/draft/i)).toBeNull()
})
```
- [ ] **Step 3: Failing test — never zero**
```ts
it('renders unavailable linkage with its timestamp, never as zero', () => {
  render(<WorkflowRow linkage={{ status: 'unavailable', lastRetrievedAt: 'T0' }} />)
  expect(screen.getByText(/Linkage unavailable, last retrieved at/i)).toHaveTextContent('T0')
  expect(screen.queryByText(/^0 Jobs$/)).toBeNull()
})
```
- [ ] **Step 4: Failing test — the empty taxonomy and the un-named sixteen**
```ts
it('ships an empty seeded taxonomy and names no starter type as canonical', () => {
  expect(SEEDED_JOB_TYPES).toEqual([])
  expect(SEEDED_SERVICE_TYPE_TAGS).toEqual([])
})
```
- [ ] **Step 5:** Cross-tenant read returns a **refusal, not an empty result**, and is audited.
- [ ] **Step 6:** The New Workflow button is **disabled with its reason** for read-only roles, never hidden. The test asserts `disabled` **and** the reason text — an `aria-disabled` presence assertion is slice-4 defect shape 2 and will be rejected.
- [ ] **Step 7:** The audit path on create. **The covering test mutates the Workflow record before the audit fails and asserts nothing persisted.**
- [ ] **Step 8: axe. GREEN, typecheck, lint. Report.**

---

## Task 10 — `MOD-STU-12` Versioning and Publication

**Files:** `src/studio/modules/stu-12/**` · `app/studio/versions/**` · `tests/unit/stu-versions.test.ts`
**Screen:** `SCR-STU-12` (L48270); catalogue A `SCR-STU-VERSION`, `SCR-STU-DIFF`, `SCR-STU-LINKAGE` (L31081–L31083) all fold here. Storyboard `SB-STU-15` (L33546); the adoption panel `SB-STU-03` (L31304). **Section §5.12, card L33418–L33602.**

**Purpose (L33450):** *"Mint, classify, describe, distribute, compare, archive, and export Workflow versions, and make the version number the audit receipt for which limits were in force."*

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L33456–L33469 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L33456–L33469, **twelve** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker | Job Owner, a field on the Job |
|---|---|---|---|---|---|---|---|---|
| 1 | Select the bump classification at republish | Allowed — as Author | Allowed — as Author | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — the Job Owner decides adoption, not classification |
| 2 | Validate the classification against the diff | Allowed — as Reviewer | Allowed — as Reviewer | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — same reason |
| 3 | Write the mandatory republish description | Allowed — as Author | Allowed — as Author | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — same reason |
| 4 | Publish a version | Allowed with conditions — as Release Authority only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — same reason |
| 5 | Decide adoption of a notified-class version | Explicitly prohibited unless also the Job Owner | Explicitly prohibited unless also the Job Owner | Explicitly prohibited unless also the Job Owner | Explicitly prohibited unless also the Job Owner | Explicitly prohibited | Explicitly prohibited | Allowed — the decision keys to the Job Owner field |
| 6 | Rebase a scheduled Run | Not applicable — rebasing is a Delivery Operations Hub action | Allowed with conditions — at the supervisor's discretion in the Delivery Operations Hub | Allowed with conditions — same | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — same reason |
| 7 | View the version history and approval log | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Not applicable — the Job Owner sees the change notice, not the Studio |
| 8 | View the screen-level diff | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Not applicable — same reason |
| 9 | View the Job and Run linkage | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Not applicable — same reason |
| 10 | Archive a version manually | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — same reason |
| 11 | Export a version to portable document format | Allowed | Allowed | Read-only — may generate the read-only export | Read-only — may generate the read-only export | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Not applicable — same reason |
| 12 | Swap the pinned package of an in-flight Run | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**Row 5 is the only place on the surface where a permission is granted by a FIELD VALUE rather than by a role or a grant**, and four of the five tenant-role cells say so in the same words: `Explicitly prohibited unless also the Job Owner`. **A build that renders this as a role check gets it wrong for the Quality Manager who happens to own the Job.** L33433: *"Job Owner is a field on the Job record, defaulting to the creator and reassignable — not a role."*
**Row 12 is the only row where every cell across all seven columns is `Explicitly prohibited`** — including the Job Owner column, `Not applicable` on ten of the other eleven rows. **That is the pinning guarantee stated as a matrix row.**
**Row 11's `Read-only` carries a rendering instruction inside the token.** Mapping `Read-only` mechanically to a disabled control removes an export the source grants.
**Row 6 is a cross-surface statement (R22), never a Studio control.**

### What this task must build

- **Semantic versioning (L33424–L33429).** *"At republish the Author selects the bump classification and the Reviewer validates it against the diff — a mis-classified patch is returned."* **PATCH** — corrections that change no operating behaviour: a typographical error, a clarified phrase, an updated reference image, a Lane-B-approved value. **MINOR and MAJOR** — the notified classes: limits, gates, timing, severity mappings, sequence, screens added or removed, with **MAJOR marking restructuring**. *"Every republish requires a mandatory republish description"*, stored permanently for every class and doing double duty as user-facing text for notified classes.
- **Adoption (L33431).** Patch auto-adopts. Notified-class versions are **decided by the owner named on each Job**, with a default one-shift update window before the prior version is flagged outdated. **"Runs in progress continue on the version they started"** — the per-run pinned package is never swapped mid-run.
- **D5 — `Superseded` is the VERSION state; `Outdated` is the per-JOB adoption state.** L33479 uses both in one paragraph for two different things. **`OBJ-037` (L8616) collapses them onto the version and is recorded as an ERRATUM.** Collapsing loses the distinction between *a newer version exists* and *this Job's update window lapsed*, which are separately notified (L33569).
- **D21 — `Distributable` as a flag.** `SEQ-013` L68465: *"`Versioned` and `Distributable` are different states, so **a version can exist in history without ever having been safe to run**."*
- **The two fail-closed differences (L33486, L33505, L33507).** Diff engine unavailable → the submission is **held rather than advanced**. No-active-Jobs indicator uncomputable → **archival is blocked rather than performed on an assumption**. Export → *"a partial export is never produced; the export either completes or fails with the reason stated, because a partially rendered specification document is worse than none."*
- **Recovery (L33579).** *"minted version numbers are reconciled against audit entries and any gap is reported; **a version number is never re-used.** Adoption tracking is re-read per device and any device whose command state cannot be determined is shown as unknown with the last known state and its timestamp, never as adopted."*
- **`DEC-ARCH-001` (L33443).** *"It does not state whether an archived version can be un-archived, whether an archived version can be linked to a new Job, or whether archival is reversible at all."* Recommendation (a), reversible with an audited reason — *"because the platform's only irreversible act is worker personal-data anonymisation."*
- **C6 — implement `DiffEngine` HERE and inject it at this task's own route. Never edit `src/studio/modules/stu-11/**`.**

### §2.2 — the rollback question carries two identifiers; this task owns the disclosure

`DEC-WFROLL-001` (chapter 28, L53350, 8 references) and `DEC-VERROLL-001` (chapter 7, L8623, 5 references) ask the same question **with no cross-reference**. **Both identifiers render** so a client search on either finds the same card; `DEC-WFROLL-001` is registered canonical and `DEC-VERROLL-001` as its alias, **and the screen says so**. Neither is obeyed as settling the question.

The rollback **behaviour** is not open (L53703, L53706, L53707):
> *"A published version turns out to be wrong. The platform does not un-publish it, because the floor may already have run it. Instead the previous content is put through the chain again and comes out as a new, higher version number."* · *"**Deleting or hiding a published version is refused; prior versions are retained in full. Rolling back by editing a published version in place is refused. Skipping the chain for a rollback is refused** — nothing reaches the frontline without sign-off at each stage."* · *"In-flight runs are executing the bad version. They cannot be re-based, so the correct response is operational — cancel or complete under supervision — not technical."*

And L53602: *"A publication cannot re-base an in-flight run. A Supervisor cannot force adoption on a Job they do not own; the adoption decision keys to the Job Owner field. **A Client Command Center user cannot publish anything.**"*

### Steps

- [ ] **Step 1:** Read L33456–L33469. Report the row count (expected 12).
- [ ] **Step 2: Failing test — the field-value permission**
```ts
it('permits adoption by the Job Owner FIELD, not by role', () => {
  const qmNotOwner = { role: 'QUALITY_MANAGER', identityId: 'IDN-QM', job: { ownerId: 'IDN-OTHER' } }
  const qmOwner    = { role: 'QUALITY_MANAGER', identityId: 'IDN-QM', job: { ownerId: 'IDN-QM' } }
  expect(decideAdoption(qmNotOwner).outcome).toBe('explicitlyProhibited')
  expect(decideAdoption(qmOwner).outcome).toBe('allowed')      // the defect this pins
})
```
- [ ] **Step 3: Failing test — the two vocabularies stay apart (D5)**
```ts
it('keeps Superseded on the version and Outdated on the Job adoption', () => {
  expect(VERSION_STATES).toEqual(['Published', 'Superseded', 'Archived'])
  expect(ADOPTION_STATES).toEqual(['Notified', 'Decided-adopt', 'Decided-defer', 'Outdated'])
  expect(VERSION_STATES).not.toContain('Outdated')
})
```
- [ ] **Step 4: Failing test — rollback refusals and both identifiers**
```ts
it('refuses to delete, hide, edit-in-place or chain-skip a published version', () => {
  expect(deleteVersion(published).ok).toBe(false)
  expect(editInPlace(published).ok).toBe(false)
  expect(rollback(published, { skipChain: true }).ok).toBe(false)
})
it('renders BOTH rollback identifiers and neither as settled', () => {
  render(<VersionsScreen />)
  expect(screen.getByText(/DEC-WFROLL-001/)).toBeInTheDocument()
  expect(screen.getByText(/DEC-VERROLL-001/)).toBeInTheDocument()
})
```
- [ ] **Step 5: Failing test — no version number is re-used and none is minted on an audit failure**
```ts
it('mints no version number when the audit write fails', () => {
  const before = mintedNumbers()
  const r = publish(submission, { auditWrite: 'fails' })
  expect(r.ok).toBe(false)
  expect(mintedNumbers()).toEqual(before)
  expect(workflowState()).toBe('In Review')   // observable, and unchanged
})
```
  **This is the audit test that must mutate something observable first.** Set the version's `publishedAt` and adoption rows before the audit call, and assert both are gone.
- [ ] **Step 6:** Archival blocked when the no-active-Jobs indicator cannot be computed. Export completes or fails with the reason — **never partial**.
- [ ] **Step 7:** `SB-STU-03`'s honest adoption line renders from Task 2's `renderAdoption`. No view says *live on the floor*.
- [ ] **Step 8: axe. GREEN, typecheck, lint. Report.**

---

## Task 11 — `MOD-STU-07` Content Libraries

**Files:** `src/studio/modules/stu-07/**` · `app/studio/content-libraries/**` · `tests/unit/stu-content-libraries.test.ts`
**Screens:** `SCR-STU-06`, `SCR-STU-07`, `SCR-STU-08` (L48264–L48266) as three tabs of one route; catalogue A `SCR-STU-CHECKLIST`, `SCR-STU-CORPUS`, `SCR-STU-ROUTING` (L31074–L31076). Storyboard `SB-STU-10` (L32725). **Section §5.7, card L32574–L32784.**

**Purpose (L32587):** *"Hold the tenant's reusable containment checklists, approved coaching assets, and escalation routing templates, referenced by pointer from screens."*

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L32626–L32637 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L32626–L32637, **ten** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|---|
| 1 | Create a Content Library item | Allowed — the Quality Manager owns the Content Libraries | Explicitly prohibited — may propose only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 2 | Edit a Content Library item | Allowed with conditions — edits to published items pass review; scope under `DEC-LIBREV-001` | Explicitly prohibited — may propose only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 3 | Archive a Content Library item | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 4 | Propose a Content Library change through the approval chain | Allowed | Allowed — propose Content Library changes | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 5 | Reference a library item from a screen picker | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 6 | Approve a coaching asset into the corpus | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 7 | Retire a flagged coaching asset | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 8 | Name an individual as an escalation recipient | Explicitly prohibited — templates name roles, never individuals | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 9 | Add a notification channel beyond in-app and email | Explicitly prohibited — two channels only at V1 | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 10 | Read published library content | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |

**THIS MATRIX CARRIES THE SURFACE'S SHARPEST DISABLED-WITH-REASON CASE.** Rows 1, 2, 3, 6 and 7 give the Quality Manager `Allowed` and the Supervisor-with-grant `Explicitly prohibited — may propose only`, while **row 4 gives that same Supervisor `Allowed`**. The prohibition is a **routing** rule, not a categorical one: the control exists on the same screen for the Quality Manager, and the Supervisor's own alternative — Propose — is one row below. **The disabled control teaches the rule at the moment it binds.** Rendering rows 1/2/3/6/7 as ABSENT for the Supervisor is the defect this note exists to prevent.
**Row 10's Auditor cell is `Client Decision Required` — §25.3 row 5 says `Read-only` and is wrong under `AC-STU-157`.** (See Task 6 §6.5.)

### What this task must build

- **The pointer model (L32580, `AC-STU-071` L32763):** *"Items are authored or uploaded once and referenced from many screens via pickers; **screens hold pointers, so updating a library item propagates to every screen that references it.**"* A picker that fails to load **never clears an existing pointer** (`AC-STU-018`, L31098).
- **The archival refusal (L32691, `AC-STU-077` L32769):** *"Where an item is archived while screens still reference it, the archival is refused and the referencing screens are named, because a dangling pointer would leave a screen with no containment or no routing."* **The referencing screens are NAMED — the test must fail when a named screen is removed from the message.**
- **States (L32647):** Checklists and templates: Draft, Published, Archived. Coaching assets: Uploaded, Approved, Indexed, Flagged for review, Retired. *"An asset that is Approved but not yet Indexed is retrievable only by metadata filter, not by semantic ranking, and the screen's curated default carries coaching until indexing completes."*
- **The four properties that keep the corpus safe (L32599–L32602)**, each rendered: curation is retained (*"Embeddings change how an asset is found, never whether it was approved"*); retrieval is hybrid (*"a torque clip cannot surface on a paint screen"*); a default is retained per locale for cold start; retrieval quality is evaluated from day one.
- **Escalation Routing Templates — the three things a rule names (L32612–L32614):** **recipient ROLES, never named individuals** · **channels, in-app and email only** · **response behaviour** — acknowledgement required, timeout, fallback recipients, dedupe window. Run-time resolution (L32616): *"**Resolution is on-shift only; there is no separate on-call calendar.** … **It executes the template; it never chooses recipients.**"* **Seam to `MOD-DOH-10`, slice 10.**
- **The containment-step constraint authoring must ENFORCE (L32653).** Under `DEC-CONTLAUNCH-001` the checklist launches locally from the package, which *"requires every step to be fully renderable from the package with no server call — a step that requires a server lookup cannot be a launch-time step, **and authoring must refuse it**."*
- **The asymmetry the diagram exists to show (L32723):** *"only two of the three reach the device: containment checklists and coaching assets ship in the package, while escalation routing resolves server-side… That asymmetry is why an offline device can contain a deviation but cannot escalate one until it syncs."*
- **Three open decisions render here.** `DEC-LIB-001` (L32591) — D15, pinning semantics adopted, with the counter-argument **on the record and not trivial**: pinning *"delays a safety-motivated checklist improvement by up to one Run."* `DEC-LIBREV-001` (L32622) — D17, the full chain, *"Until it is decided, this blueprint treats library edits as passing the full chain and records the divergence."* `DEC-EMBED-001` (L32606) — the data-processing posture for the external embedding model over media that may contain identifiable workers.
- **The embedding service is EXTERNAL and the storyboard has no network.** The index is a seeded fixture with an explicit **not indexed** state. `AC-STU-072` (L32764) is what makes the simulation honest: *"indexing never changes approval state."*
- **Objects:** `OBJ-STU-CHECKLIST`, `OBJ-STU-ASSET`, `OBJ-STU-ROUTING` (L32643) = `OBJ-040`…`OBJ-043` (L8665–L8722).

### Steps

- [ ] **Step 1:** Read L32626–L32637. Report the row count (expected 10).
- [ ] **Step 2: Failing test — the routing prohibition renders DISABLED, and Propose renders ENABLED, on the same screen**
```ts
it('disables Create with its reason for the grant-holder and enables Propose beside it', () => {
  render(<ContentLibraries role="SUPERVISOR" grants={['GRANT-STU-AUTHOR']} />)
  const create = screen.getByRole('button', { name: /create checklist/i })
  expect(create).toBeDisabled()
  expect(create).toHaveAccessibleDescription(/may propose only/i)
  expect(screen.getByRole('button', { name: /propose a change/i })).toBeEnabled()
})
```
- [ ] **Step 3: Failing test — the archival refusal NAMES the screens, and fails when one is removed**
```ts
it('names every referencing screen in the archival refusal', () => {
  const r = archiveItem('CHK-1')            // referenced by SCR-A and SCR-B
  expect(r.ok).toBe(false)
  expect(r.reason).toContain('SCR-A'); expect(r.reason).toContain('SCR-B')
})
it('fails when a referencing screen is dropped from the message', () => {
  // R13: the pointer test must be able to notice a MISSING element.
  const r = archiveItem('CHK-1', { omitScreens: ['SCR-B'] })
  expect(r.reason).toContain('SCR-B')       // red until the omission is fixed
})
```
- [ ] **Step 4: Failing test — a failed picker never clears an existing pointer**
```ts
it('keeps the existing pointer when the picker fails to load', () => {
  const before = screenPointer('SCR-A', 'containment')
  openPicker({ load: 'fails' })
  expect(screenPointer('SCR-A', 'containment')).toEqual(before)
})
```
- [ ] **Step 5:** Authoring **refuses** a containment step requiring a server lookup. Indexing never changes approval state (round-trip an Approved asset through indexing failure).
- [ ] **Step 6:** No control names an individual recipient; no control adds a third channel. Both assert **absence of the control**, not a disabled one — these are categorical.
- [ ] **Step 7:** Audit path on create/edit/archive/approve/retire. **The covering test mutates the item before the audit fails and asserts the item is unchanged.**
- [ ] **Step 8: axe on all three tabs. GREEN, typecheck, lint. Report.**

---

## Task 12 — `MOD-STU-09` Work-Instruction Difficulty Levels (no route; mounts in `SCR-STU-04` §1)

**Files:** `src/studio/modules/stu-09/**` · `tests/unit/stu-difficulty.test.ts`
**Screen:** none of its own — *"Within Section 1 of `SCR-STU-PANEL`"*. Storyboards `SB-STU-12` (L33038) and `SB-011-02` `SCR-STU-DIFFICULTY` (L68164). **Section §5.9, card L32939–L33088.**

**C8 — this task owns the component FILE; Task 15 owns the one-line MOUNT.** Freeze the props here and state them in both briefs:
```ts
export interface DifficultyCoverageProps {
  readonly screenId: string
  readonly declaredLocales: readonly Locale[]
  readonly cells: readonly DifficultyCell[]   // 3 levels × declared locales
  readonly onOpen: (level: DifficultyLevel, locale: Locale) => void
}
```

**The rule (L32945):** *"Every screen's instruction content exists at three difficulty levels — **simple, standard, and expanded**. The author writes one level; the platform's artificial intelligence drafts the other two; and **every artificial-intelligence-drafted level passes the full review chain before publication — no generated rendering reaches a worker unreviewed.** A field on the worker profile selects which level the Frontline surface renders for that worker; **the level changes the depth of explanation, never the required captures, gates, limits, or severity mappings, which are identical across levels.**"*

**The six-rendering count (L32947):** *"a fully covered screen's instruction content exists in **six authored renderings — three levels by two locales** — every one of which passed review."*

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L32964–L32971 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L32964–L32971, **eight** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|---|
| 1 | Author one difficulty level of a screen's instruction | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 2 | Request artificial-intelligence drafting of the other two levels | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 3 | Edit a drafted level before submission | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 4 | Review drafted levels in the chain | Allowed with conditions — not on own submission | Allowed with conditions — not on own submission | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 5 | Publish a level that has not been reviewed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 6 | Make a level change a capture, gate, limit, or severity mapping | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 7 | Set the difficulty level on a worker profile | Not applicable — the profile field is Delivery Operations Hub master data | Allowed — supervisor-entered worker record maintenance in the Delivery Operations Hub | Allowed — same reason | Allowed — same reason | Read-only | Explicitly prohibited — no self-selection is specified |
| 8 | Read all three levels of published content | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Allowed with conditions — the worker sees only the level their profile selects |

**Row 7 is the ONE row on the surface where the Read-only Auditor gets a definite status** — `Read-only`, not `Client Decision Required` — because the act is a Delivery Operations Hub act where the Auditor's read authority is settled. It is also the row where the Supervisor **without** the grant holds something the Quality Manager does not. **And it is a cross-surface statement (R22): no Studio control sets a worker's profile field.**
**Row 8's Worker cell is the only `Allowed with conditions` in a Worker column anywhere on the surface**, and it too is a Frontline consequence, not a Studio control.

### What this task must build

- **The equivalence guarantee** (`FUNC-STU-09-01-C-1` L32991; `AC-STU-088` L33075): *"Required captures, gates, specification limits, and severity mappings are **byte-identical** across all three levels."* `TEST-STU-093` (L33083) is the source's own test: *"Attempt to configure a level-specific specification limit; confirm no such path exists."*
- **States (L32981):** per level per locale — Authored, Drafted by artificial intelligence, Edited, Reviewed, Published within a version. **A level that is Drafted but not Reviewed blocks publication.**
- **`SB-STU-12`'s coverage strip (L33038):** *"three tabs labelled Simple, Standard, and Expanded, each with a locale sub-selector. The tab the author wrote is marked 'Authored'; the others are marked 'Drafted, awaiting your edit' or 'Reviewed'. A coverage strip above shows six cells, one per level and locale, each green when reviewed and red **with the specific gap named** when not. A permanent line reads: 'Difficulty levels change explanation depth only. Captures, gates, limits, and severity mappings are identical across all levels.'"*
- **D16 / `DEC-WIDIFF-001` (L32949) — the interim rule wins over the recommendation.** They differ: the interim rule is *"Until it resolves, the package definition carries instruction content at all levels"*; the recommendation is option (c), the assigned worker's level plus standard as a substitution fallback. **`AC-STU-090` (L33077) requires the interim rule to be applied**, so build all levels into the manifest and render the recommendation as the alternative with its storage trade-off stated. L33088: *"Packaging: `Client Decision Required` — `DEC-WIDIFF-001`, with the source's interim rule applied."*
- **The unset-profile default (L33011, L32998):** *"Where a worker's profile field is unset, the standard level is rendered as the defined default"* — *"a defined default rather than an absence."* **Seam to `MOD-DOH-04`, slice 4** — an **additive fixture field**, not a new module.
- **`STATE-10`/`STATE-11`** apply on `SCR-STU-04`: when the drafting aid is degraded or unavailable *"the author writes all three difficulty levels manually and the panel says so."*
- **Reuse consumer of Task 7's chain** (L32994): every drafted level passes the full chain.

### Steps

- [ ] **Step 1:** Read L32964–L32971. Report the row count (expected 8).
- [ ] **Step 2: Failing test — no level-specific limit path exists**
```ts
it('has no path to a level-specific specification limit', () => {  // TEST-STU-093
  expect(() => setLimitForLevel('simple', { lower: 1 })).toThrow(/no such path|not a function/)
  expect(Object.keys(screenModel.levels.simple)).not.toContain('specificationLimits')
})
it('keeps captures, gates, limits and severity mappings byte-identical across levels', () => {
  const [s, st, e] = enforcedFor(['simple','standard','expanded'])
  expect(JSON.stringify(s)).toBe(JSON.stringify(st)); expect(JSON.stringify(st)).toBe(JSON.stringify(e))
})
```
- [ ] **Step 3: Failing test — the six-cell strip names the gap**
```ts
it('renders six cells and names the specific gap on each red one', () => {
  render(<DifficultyCoverage {...sixCellFixtureWithOneGap} />)
  expect(screen.getAllByRole('gridcell')).toHaveLength(6)
  expect(screen.getByText(/Spanish expanded: not reviewed/i)).toBeInTheDocument()
})
```
- [ ] **Step 4:** A Drafted-but-not-Reviewed level **blocks publication** — register with Task 5 as part of check #6's element set, and assert the blocking element names the level **and** the locale.
- [ ] **Step 5:** The unset profile field renders the **standard level as a defined default**, and the copy says "default", never showing an empty state.
- [ ] **Step 6:** Row 7 renders as a **cross-surface statement**, never a control. Assert no Studio route offers a profile-field control.
- [ ] **Step 7: GREEN, typecheck, lint. Report the frozen props signature you shipped, verbatim, for Task 15.**

---

## Task 13 — `MOD-STU-10` Parts-Registry Authoring Seam (no route; mounts in `SCR-STU-04` §1)

**Files:** `src/studio/modules/stu-10/**` · `src/studio/seams/parts/**` · `tests/unit/stu-parts-seam.test.ts`
**Screen:** `SCR-STU-PARTADD` (L31088, catalogue A only — **catalogue B has no row**), rendered as an **inline panel** of `SCR-STU-04` per D1. Storyboard `SB-STU-13` (L33178). **Section §5.10, card L33090–L33231.**

**C9 — this task owns the panel COMPONENT; Task 15 owns the one-line MOUNT.** Freeze the props here and state them in both briefs.

**Purpose (L33105):** *"Let an author reference a part that does not yet exist without leaving the authoring context or stalling on master data."*
**Owning surface (L33104):** *"Standards and Operations Studio (`SURF-STU`), **writing a skeletal record into Delivery Operations Hub master data**"* — **the only module on the surface whose owning-surface row names a write into another surface.**

**The rule (L33096):** *"The Studio provides **one deliberate seam** so authoring never stalls on missing master data: while authoring a work-instruction step, the author may inline-add a part through a **name-only mini-form**. The platform mints the part identifier; the skeletal record lands in the Delivery Operations Hub registry for completion there. Parts are referenced from the work-instruction step, and **a part reference is optional per part — a step is never forced to carry one**."*

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L33113–L33119 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L33113–L33119, **seven** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|---|
| 1 | Reference an existing part from a work-instruction step | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 2 | Inline-add a part through the name-only mini-form | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 3 | Mint the part identifier | Explicitly prohibited — the platform mints it | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 4 | Complete a skeletal part record | Not applicable — completion happens in the Delivery Operations Hub parts registry | Not applicable — same reason | Not applicable — same reason | Allowed — in the Delivery Operations Hub, subject to its own permissions | Read-only | Explicitly prohibited |
| 5 | Edit registry fields from the Studio beyond the name | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 6 | Delete a part from the Studio | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 7 | Force a step to carry a part reference | Explicitly prohibited — a part reference is optional per part | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**Row 4 is the seam made visible in the matrix**, and the second row on the surface where the Auditor gets `Read-only` rather than `Client Decision Required` — again because the act is a Hub act. **It is a cross-surface statement, never a control.**

### The three refusals that are not negotiable

- **Confirmation before attachment** (`FUNC-STU-10-02-B-1` L33143; `AC-STU-096` L33220): *"if the hand-off cannot be confirmed, the reference is not created, because a reference to a part that does not exist in the registry would break genealogy."*
- **Suspension is not a technical fault** (`FUNC-STU-10-02-C-1` L33145; `AC-STU-095` L33219): *"the author is told the tenant's suspension state is blocking master-data writes, not that the registry is down, because **presenting a commercial state as a technical fault would be dishonest.**"* Inherits slice 4's soft-suspension write-class table directly (L33121): *"under soft suspension, master-data writes are blocked, including new parts."*
- **Unresolvable references block submission** (L33211): *"a reference whose record cannot be found is flagged by step and part name and blocks submission, because a package carrying an unresolvable part reference would break the consumption record."* Register publish-check #7's part-reference element.

### The unregistered dependency — declared, never guessed

**`MOD-DOH-19` Parts Registry is registered as `not-represented`, was explicitly EXCLUDED from slice 4, and is named in NO later slice's stated scope.** `MOD-STU-10` depends on it entirely. **R21: a stub that returns a minted identifier without a confirmed hand-off is invisible until a package carries an unresolvable part reference.** The seam's fixture therefore returns a **confirmed** or **unconfirmed** outcome, and **the unconfirmed path is the one the gate exercises.** `StudioSeamNotice` states the owner **with no slice assigned** — it does not invent one.

**`DEC-PARTSTUB-001` (L33203):** the review interval for an incomplete skeletal record is **not specified**. Recommendation: a tenant-configurable interval defaulting to seven days, because *"an accumulation of name-only stubs degrades the registry's usefulness for genealogy and reporting."* Render as an "unspecified in source" entry.

**Security (L33207):** *"The seam is a single, narrow write path with **exactly one writable field**. It cannot be used to edit or delete an existing registry record."*

### Steps

- [ ] **Step 1:** Read L33113–L33119. Report the row count (expected 7).
- [ ] **Step 2: Failing test — the unconfirmed path is the default the gate exercises**
```ts
it('creates NO reference when the hand-off is unconfirmed', () => {
  const r = inlineAddPart({ name: 'Bolt M12', registry: unconfirmedRegistry })
  expect(r.ok).toBe(false)
  expect(stepReferences('STEP-1')).toEqual([])      // observable, and empty
  expect(r.reason).toMatch(/could not be confirmed/i)
})
it('creates a Skeletal reference only on a confirmed hand-off', () => {
  const r = inlineAddPart({ name: 'Bolt M12', registry: confirmedRegistry })
  expect(stepReferences('STEP-1')[0]).toMatchObject({ state: 'Skeletal' })
})
```
- [ ] **Step 3: Failing test — a commercial state is never presented as a technical fault**
```ts
it('names the suspension state, not a registry outage', () => {
  const r = inlineAddPart({ name: 'Bolt', tenantState: 'soft-suspended' })
  expect(r.reason).toMatch(/suspend/i)
  expect(r.reason).not.toMatch(/unavailable|down|outage|error/i)
})
```
- [ ] **Step 4: Failing test — exactly one writable field**
```ts
it('exposes exactly one writable field and no edit or delete path', () => {
  expect(PART_SEAM_WRITABLE_FIELDS).toEqual(['name'])
  expect(partsSeam).not.toHaveProperty('editPart')
  expect(partsSeam).not.toHaveProperty('deletePart')
})
```
- [ ] **Step 5:** A step is **never forced** to carry a part reference — assert submission succeeds with zero references.
- [ ] **Step 6:** An unresolvable reference **blocks submission**, flagged **by step and part name**. The test fails when either the step or the part name is dropped.
- [ ] **Step 7:** The audit path on the inline add. **The covering test writes the reference before the audit fails and asserts the step has no reference afterwards.**
- [ ] **Step 8: GREEN, typecheck, lint. Report the frozen props signature you shipped, verbatim, for Task 15.**

---

# WAVE 4 — THE AUTHORING SURFACE (Tasks 14–16, fully parallel)

---

## Task 14 — `MOD-STU-04` The Workflow Builder — **THE EXEMPLAR**

**Files:** `src/studio/modules/stu-04/**` · `app/studio/builder/**` · `tests/unit/stu-builder.test.ts`
**Screen:** `SCR-STU-03` (L48261); catalogue A `SCR-STU-CANVAS` (L31071); `SCR-STU-BUILDER` (`SB-011-01`, L68164) is uncatalogued and becomes no route. Storyboard `SB-STU-07` (L32144). **Section §5.4, card L32032–L32193.**

**Purpose (L32053):** *"Set Workflow-level settings and defaults, and assemble the screen sequence and branch targets that are simultaneously the worker's path and the sequence-detection reference."*
**User benefit (L32054):** *"One drawing produces the worker's route, the skip detector's reference, and the deviation router's default path."*

**Why this task is not split further: see §5.2.** Both candidate internal seams share `app/studio/builder/page.tsx` or invent a second route for one catalogued screen. Its size is instead managed by Task 5 owning the eleven checks, Task 4 owning the registry, and Task 4 owning the chrome.

### The four settings and the **exactly two** inheritable defaults — L32040, quoted whole because the word "exactly" is load-bearing

> *"Each Workflow carries four settings set before screen authoring begins — **name, Job Type, the optional Service Type tag, and locale coverage** (English and Spanish at launch) — and **exactly two** workflow-level defaults that every screen inherits unless overridden: **the default escalation routing template and the default coaching trigger percentage**. Deviation severity is never a workflow default; it is always mapped explicitly per screen. The word 'exactly' is the source's own and is load-bearing: an implementation that adds a third inheritable default, however convenient, departs from the specification and must be raised as a change request."*

### The dual role of the canvas — L32042, the single most load-bearing sentence in the module

> *"The canvas presents the Workflow as a sequence of screen nodes connected by navigation arrows, and supports conditional branching — a measurement screen may route to the next standard screen when in tolerance and to a deviation-capture screen when out of tolerance. **The screen order and branch targets drawn on this canvas are also the reference the sequence-detection mechanism compares against at run time: an out-of-order or skipped screen is a deterministic sequence deviation.** This dual role is the single most important thing an author must understand about the canvas. The drawing is not documentation. It is the rule."*

**R4 — ONE STRUCTURE.** L32098: *"no role may author a sequence reference that differs from the drawn order, because two references would make skip detection unfalsifiable."* A build that stores the drawn order and the detection reference separately **creates exactly the second reference**. `AC-STU-056` (L32181): *"The published sequence-detection reference is identical to the drawn screen order and branch targets, with no separate authoring path."*

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L32059–L32070 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L32059–L32070, **ten** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker | Implementation team grant |
|---|---|---|---|---|---|---|---|---|
| 1 | Open the canvas for a Draft Workflow | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions — onboarding only |
| 2 | Open the canvas read-only for a Published version | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions |
| 3 | Set the four Workflow settings | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 4 | Set the default escalation routing template | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 5 | Set the default coaching trigger percentage | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 6 | Set a workflow-level default severity | Explicitly prohibited — severity is never a workflow default | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 7 | Add, remove, and reorder screen nodes | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 8 | Draw a conditional branch | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 9 | Override the platform-standard gate-failure target on a screen | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| 10 | Preview the sequence | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions |

**ROWS 1 AND 2 ARE THE LOAD-BEARING PAIR, AND R15 IS THE HIGHEST-PROBABILITY DEFECT ON THIS SURFACE.** The Supervisor-without-the-grant and the Tenant Admin are `Explicitly prohibited` on the **draft** canvas and `Read-only` on the **published** canvas. **A build that renders one canvas component with a read-only flag gets row 2 right and row 1 wrong: the draft canvas must not be REACHABLE, not merely non-editable.** `AC-STU-048` (L32013) and `AC-STU-151` (L34668) both test **the read, not the render**. **Two routes, two reads.**

**Row 6 is the prohibition the whole module is shaped around.** `FUNC-STU-04-01-C-1` (L32094) makes the refusal a functionality with fallback `FB-STU-10`, and `AC-STU-055` (L32180) closes the API route as well as the control: *"No user interface control or application programming interface route sets a workflow-level default severity."*

### The rest of the build obligations

- **Gate-failure branching (L32044).** *"When a worker fails a gate, the branch target defaults to a platform-standard deviation-capture screen — the author does not have to draw a failure path on every gated screen. A per-screen override is available for non-standard flows. The platform deviation-capture forms are part of the offline package, so the default path works without connectivity."* `AC-STU-057` (L32182).
- **Fork strategy (L32046).** *"Where the work differs significantly… author separate Workflows and link the right one per Run at assignment in the Delivery Operations Hub. Where the fork is light… use branches within one Workflow. **The canvas is for in-run routing, not for variant management.**"*
- **Alternate paths (L32120), each a build obligation.** *"Where a branch target is deleted, the branch is flagged as dangling and the Workflow becomes **structurally invalid** until the author supplies a target; **the platform does not silently reroute.** Where the author has drawn a variant tree that exceeds a reasonable branch depth, the fork guidance surfaces a recommendation to split into separate Workflows; **the recommendation never blocks**. Where no escalation routing template exists, the workflow default cannot be set and, where the containment response capability is enabled, publication is blocked with the missing default named."*
- **States (L32080).** *"Inherits the Workflow lifecycle. Within Draft, a Workflow structure is additionally either **structurally valid** (every node reachable, every branch target resolvable, exactly one entry point) or **structurally invalid**, and a structurally invalid Workflow cannot be submitted."* `AC-STU-058` (L32183).
- **Reconnect (L32152), and why it is not optional.** *"Structural validation re-runs **in full** on reconnection before submission is re-enabled, because a validation result computed before a dependency changed is stale data… an example is a branch target that validated successfully before another author deleted the target screen."*
- **Security (L32171), the scope rule in its surface-specific form.** *"Read-only roles receive a rendered view with no editing affordances **rather than a disabled editor**, so a read-only user cannot construct an edit request from the client."*
- **`SB-STU-07` (L32144).** Left panel: the four settings and the two defaults, *"each labelled with whether it is inherited by screens."* Centre: the node graph with drag-to-reorder and click-to-configure. Right: structural validation **as a live list** — unreachable nodes, dangling branch targets, screens with no severity mapping, screens missing a curated coaching default in a declared locale — *"Each validation item names the specific screen and is clickable."* A Preview Sequence control walks the graph in worker order. **The panel's heading states plainly: 'This drawing is also the sequence-detection reference used at run time.'**
- **C4 — the right panel READS Task 5's check registry. It implements only check #1** (structural validity). Checks #2 and #5 belong to Task 15, #6 to Task 16. **Implementing a sibling's check is a defect.**
- **C7 — no routing-pointer stub.** Task 11 landed in Wave 3; import its picker.
- **Accessibility (L48332):** *"the canvas is operable without a pointing device, with branch targets selectable from a list as well as by drag."*
- **Objects:** `OBJ-STU-WORKFLOW`, `OBJ-STU-SCREEN` (L32078).

### Steps

- [ ] **Step 1:** Read L32059–L32070. Report the row count (expected 10).
- [ ] **Step 2: Failing test — R15, two routes, two reads**
```ts
it('does not let the draft canvas be READ by a Supervisor without the grant', () => {
  // Row 1 is Explicitly prohibited — the route must not resolve, not merely disable.
  expect(draftCanvasFor({ role: 'SUPERVISOR', grants: [] })).toEqual({ ok: false, outcome: 'explicitlyProhibited' })
  expect(draftCanvasFor({ role: 'TENANT_ADMIN', grants: [] })).toEqual({ ok: false, outcome: 'explicitlyProhibited' })
})
it('gives those same roles the PUBLISHED canvas read-only with the cause named', () => {
  const r = publishedCanvasFor({ role: 'TENANT_ADMIN', grants: [] })
  expect(r.outcome).toBe('readOnly'); expect(r.cause).toBeTruthy()
})
it('renders no editing affordance at all for a read-only role', () => {
  render(<PublishedCanvas role="SUPERVISOR" />)
  expect(screen.queryByRole('button', { name: /add screen|draw branch|reorder/i })).toBeNull()
})
```
- [ ] **Step 3: Failing test — R4, one structure**
```ts
it('derives the sequence-detection reference FROM the drawn graph, with no second store', () => {
  const wf = buildWorkflow(); reorderNodes(wf, ['S2', 'S1', 'S3'])
  expect(sequenceDetectionReference(wf)).toEqual(drawnOrder(wf))
  // The defect this pins: a second, separately-authored reference.
  expect(Object.keys(wf)).not.toContain('sequenceReference')
  expect(Object.keys(wf)).not.toContain('detectionOrder')
})
```
- [ ] **Step 4: Failing test — the counts that must never be minted**
```ts
it('carries exactly four settings and exactly two inheritable defaults', () => {   // AC-STU-054
  expect(Object.keys(workflowSettings(wf))).toHaveLength(4)
  expect(Object.keys(inheritableDefaults(wf))).toHaveLength(2)
})
it('offers no route and no control that sets a workflow-level default severity', () => {  // AC-STU-055
  expect(builderService).not.toHaveProperty('setDefaultSeverity')
  render(<Builder role="QUALITY_MANAGER" />)
  expect(screen.queryByLabelText(/default severity/i)).toBeNull()
})
```
- [ ] **Step 5: Failing test — dangling branch, no silent reroute, no submission**
```ts
it('flags a dangling branch and refuses submission rather than rerouting', () => {
  deleteScreen(wf, 'S3')
  expect(validate(wf).blockers.map(b => b.element)).toContain('branch S2 -> S3')
  expect(branchTarget(wf, 'S2')).toBe('S3')       // NOT silently rerouted
  expect(submit(wf).ok).toBe(false)
})
it('recommends a split on deep variant trees WITHOUT blocking', () => {
  expect(validate(deepTree).recommendations.length).toBeGreaterThan(0)
  expect(submit(deepTree).ok).toBe(true)
})
```
- [ ] **Step 6: Reconnect re-runs structural validation IN FULL** before submission re-enables. The test invalidates a dependency **during** the disconnection and asserts the stale pass is discarded.
- [ ] **Step 7: The gate-failure default** routes to the platform-standard deviation-capture screen, and that form is asserted **present in the package definition** (`AC-STU-057`). Cross-check with Task 19's manifest through the registry, not a duplicated list.
- [ ] **Step 8: The audit path** on every settings write and every graph mutation. **The covering test reorders the nodes before the audit fails and asserts the drawn order is unchanged.**
- [ ] **Step 9: axe, including keyboard-only branch-target selection from a list. GREEN, typecheck, lint. Report.**

---

## Task 15 — `MOD-STU-05` Screen Authoring and the Nine Configuration Sections

**Files:** `src/studio/modules/stu-05/**` · `app/studio/screen-configuration/**` · `tests/unit/stu-screen-config.test.ts`
**Screen:** `SCR-STU-04` (L48262); catalogue A `SCR-STU-PANEL` (L31072). Storyboards `SB-STU-08` (L32379), `SB-25-02` (L48298–L48315, a fifteen-field panel spec for the same screen), `SB-011-01` (L68164). **Section §5.5, card L32195–L32433.**

**Purpose (L32210):** *"Configure every screen the worker meets, supplying each agent capability with the information it requires."*
**User benefit (L32211):** *"One panel produces the worker's instruction, the proof requirement, the tolerance, the coach's trigger, and the deviation response together, so they cannot drift apart."*

**The atomic-unit rule (L32201):** *"A screen is the atomic unit of authoring and execution: one screen in the Builder corresponds exactly to one screen on the worker's device and one unit of execution telemetry… **There is no intermediate sub-screen construct.**"* And: *"Instruction content is embedded per screen; there is no separate work-instruction document at launch, and the difficulty levels of `MOD-STU-09` are renderings of this embedded content, not separate documents."*

**Section visibility (L32203):** *"Sections not relevant to the selected input type are not displayed — Section 5 appears only on measurement screens — Sections 8 and 9 are optional, and, per the capability principle, **each section exists because an agent capability requires the information it captures.**"*

### The nine sections — L32216–L32226, **nine** data rows, quoted whole

| # | Section | What it configures | Which capability it serves |
|---|---|---|---|
| 1 | Screen content | Instruction text and optional reference image; a Shared Instruction Block's content appears first if applied | Worker display; basis for coaching context |
| 2 | Input type | What the worker provides: one of seven capture types, or none | Determines proof; basis for evidence-gap detection |
| 3 | Timing | Maximum and minimum duration and the coaching trigger percentage | Prevention Agent trigger; deviation time mechanism |
| 4 | Gate and proof | Whether the worker can advance without valid proof — hard gate or soft gate | Release enforcement; evidence-gap detection |
| 5 | Specification limits | Lower and upper specification limit, unit, drawing reference. Measurement screens only | Deviation specification mechanism |
| 6 | Coaching content | The curated default coaching cards; live assets are retrieved from the approved corpus | Prevention Agent selection |
| 7 | Deviation rules and severity mapping | The severity mapping into the global catalog, banded on measurement screens, the containment checklist, and the escalation routing | Deviation and Containment |
| 8 | Tool and equipment | Required tool, optional barcode scan to unlock the screen, optional calibration confirmation. Optional | Proof capture; equipment context |
| 9 | Qualification override | An additional certification required for this specific screen, above the workflow baseline. Optional | Qualification check |

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L32257–L32267 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L32257–L32267, **nine** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|---|
| 1 | Open the configuration panel on a Draft screen | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 2 | Author Sections 1 through 9 | Allowed — full authoring across all nine sections | Allowed — author all nine sections | Read-only on published content only | Read-only on published content only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 3 | Choose the input type | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 4 | Set a hard or soft proof gate | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 5 | Soften the platform specification gate | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 6 | Define a new severity level | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 7 | Map a band to a catalog level | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 8 | Edit a tenant action bundle | Explicitly prohibited — the tenant administration area owns it | Explicitly prohibited | Explicitly prohibited | Allowed — in the tenant administration area, above the floor only | Explicitly prohibited | Explicitly prohibited |
| 9 | Add a screen-level qualification override | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |

**Row 8 is the second inversion on the surface** — the Tenant Admin holds what the Quality Manager does not, and the Quality Manager's cell **names the owner** rather than leaving a bare prohibition. **The Auditor cell here is `Explicitly prohibited`, NOT `Client Decision Required`, because the act is outside the Studio entirely.** It is also a cross-surface statement (R22): **no Studio route offers an action-bundle editor.**

### The five publication-blocking validations this task registers (Task 5 checks #2, #3, #4, #5, #10)

From L32287, L32291, L32301, L32304, L32308, L32313, L32321:
- An unresolvable image reference blocks publication *"rather than publishing a screen with a broken image."*
- A capture type outside the adopted seven is blocked *"with the offending type named, because publishing a type the device cannot render would strand a worker mid-Run."*
- A measurement screen with no limits *"cannot be published, because the specification gate would have nothing to check against."*
- A missing coaching default *"in a declared locale blocks publication in that locale."*
- At minimum one severity mapping *"is mandatory and its absence blocks publication."*
- If the Severity 1 arming confirmation *"cannot be recorded, the mapping is not saved."*
- An override *"naming a certification the tenant does not maintain blocks publication with the certification named."*

### The rules that cannot be softened

- **Section 4's boundary (L32236):** *"A hard gate blocks advance until the required proof is captured and valid; a soft gate permits advance while recording the missing proof as an evidence gap for follow-up. This authored choice governs proof capture only. It is distinct from the platform's specification gate, which is hard platform-wide: an out-of-tolerance measurement always registers as a deviation and always classifies a severity, and no author or tenant setting can configure that away. **A soft proof gate never softens the specification gate.**"*
- **Section 7's no-assumption rule (L32244):** *"the platform never assumes a value — **severity must be set explicitly on every screen that can deviate**"*, split two ways: **non-measurement screens** map to a single catalog level; **measurement screens** carry bands tied to the degree of departure, *"At minimum one mapping is required, covering any out-of-tolerance reading."*
- **D19 / `DEC-CAP-001` (L32232)** — the adopted §5.5.3 seven from Task 3's closed set. `TEST-WF-AUT-002-04` (L53401) makes divergence a **build failure**.
- **Alternate paths (L32337), each a build obligation:** *"Where the input type changes after configuration, values belonging to sections that are no longer relevant are **retained and marked inactive rather than deleted**, so that reverting the input type restores them; this prevents an accidental type change from destroying a specification limit. Where a capability is disabled while a screen is configured against it, the section freezes read-only and publication is blocked with the screen named. Where a chosen capture type falls outside the adopted `DEC-CAP-001` set of seven, publication is blocked with the offending type named."*
- **States (L32277):** Incomplete → Configured → Published within a version. *"Publication is blocked while any screen in the Workflow is Incomplete."*

### C10 / D23 — the Severity 1 arming confirmation lives HERE

**`SB-STU-05` (L31814), verbatim in substance:** *"When an author maps a band to Severity 1, the Studio interrupts with an inline confirmation panel headed 'This band arms an automatic lot hold.' The panel states in plain words: what will be held (the Lot where a lot exists, the Unit where work is serialized, otherwise the Run), that release is Quality Manager only with no supervisor exception, that the hold is placed on the device immediately including offline, and that escalation delivery follows at sync. The author confirms explicitly. **The confirmation is recorded with the authored band.**"*

**R7 — the panel is a RECORDED ACT, not a warning.** `FUNC-STU-05-08-C-1` (L32313): *"if the confirmation cannot be recorded, the mapping is not saved."* A build that shows the panel and saves regardless satisfies a naive reading and fails `AC-STU-043` and `AC-STU-063`.

**D23 / `DEC-STUXREF-001` (L31869):** §5.2.2 cites §5.5.9 for this behaviour; §5.5.1's table and §5.11's numbering place Deviation Rules and Severity Mapping at **§5.5.8**, with §5.5.9 being Tool and Equipment. **Build against §5.5.8 — Section 7 — and record the off-by-one**, because *"downstream requirement traceability keyed on the cited section number would point at the wrong configuration section."*

### The two mounts this task owns

- **Task 12's `DifficultyCoverage`** in Section 1. One import, one mount. **Do not re-implement the strip.**
- **Task 13's part-add inline panel** in the work-instruction step editor of Section 1. One import, one mount. **Do not re-implement the seam.**

Also mounts Task 8's `SB-STU-04` not-available line for any section whose capability is not enabled, and Task 11's pickers for Sections 6 and 7.

### Steps

- [ ] **Step 1:** Read L32257–L32267 and L32216–L32226. Report both row counts (expected 9 and 9).
- [ ] **Step 2: Failing test — the arming confirmation is a recorded act**
```ts
it('does not save the mapping when the arming confirmation cannot be recorded', () => {
  const before = severityMapping('SCR-A')
  const r = mapBand('SCR-A', { band: '>10%', level: 'Severity 1' }, { recordConfirmation: 'fails' })
  expect(r.ok).toBe(false)
  expect(severityMapping('SCR-A')).toEqual(before)   // observable, and unchanged
})
it('records the confirmation WITH the authored band', () => {
  const r = mapBand('SCR-A', { band: '>10%', level: 'Severity 1' }, { confirm: true })
  expect(r.band.armingConfirmation).toMatchObject({ confirmed: true })
})
```
- [ ] **Step 3: Failing test — a type change marks values inactive, never deletes them**
```ts
it('retains and marks inactive rather than deleting on an input-type change', () => {
  setLimits('SCR-A', { lower: 44, upper: 47, unit: 'Nm', drawingRef: 'DWG-A441' })
  setInputType('SCR-A', 'photo-capture')
  expect(limits('SCR-A')).toMatchObject({ active: false, lower: 44, upper: 47 })
  setInputType('SCR-A', 'measurement-entry')
  expect(limits('SCR-A')).toMatchObject({ active: true, lower: 44, upper: 47 })
})
```
- [ ] **Step 4: Failing test — the soft proof gate never softens the specification gate**
```ts
it('classifies an out-of-tolerance reading as a deviation under a soft proof gate', () => {
  setGate('SCR-A', 'soft')
  expect(evaluateMeasurement('SCR-A', 50).deviation).toBe(true)
  expect(evaluateMeasurement('SCR-A', 50).severity).toBeTruthy()
})
it('offers no control that softens the specification gate', () => {
  expect(screenService).not.toHaveProperty('setSpecificationGate')
})
```
- [ ] **Step 5:** Register checks #2, #3, #4, #5, #10 into Task 5's registry. Each blocking element **names the specific screen** and, for #5, the specific locale. Assert the message fails when the name is dropped.
- [ ] **Step 6:** Row 8 is a cross-surface statement — assert **no** action-bundle editor exists on any Studio route, and that Section 7's consequence preview **reads** the bundle through the declared seam (unregistered owner, no slice — see Task 4's seam registry).
- [ ] **Step 7:** Section 5 is **absent** unless measurement entry is selected, and its **appearance is announced** (`aria-live`), not silent. Sections 8 and 9 collapsed by default and labelled optional.
- [ ] **Step 8:** `STATE-10`/`STATE-11` render on this screen: with the drafting aid degraded, *"the author writes all three difficulty levels manually and the panel says so."*
- [ ] **Step 9:** Mount Task 12's and Task 13's components using their reported frozen signatures. **If either signature differs from what this brief states, that is a FINDING — report it, do not adapt silently.**
- [ ] **Step 10:** The audit path on every section write. **The covering test writes a specification limit before the audit fails and asserts the limit did not persist.**
- [ ] **Step 11: axe — nine landmark regions, programmatic validation association, section-order keyboard traversal. GREEN, typecheck, lint. Report.**

---

## Task 16 — `MOD-STU-17` Localisation

**Files:** `src/studio/modules/stu-17/**` · `app/studio/localisation/**` · `tests/unit/stu-localisation.test.ts`
**Screen:** `SCR-STU-14` (L48272); catalogue A `SCR-STU-LOCALE` (L31087 — **the only catalogue-A row not marked "Named in the source: Yes"**). Storyboard `SB-STU-20` (L34447). **Section §5.17, card L34351–L34498.**

**Purpose (L34368):** *"Hold per-locale authored variants inside one Workflow and block publication in any locale whose worker-facing content is incomplete."*

**The rule (L34357):** *"The platform is multilingual by locale files — English and Spanish at launch — and **nothing is translated at run time, anywhere**. Worker-facing Workflow content is held as per-locale authored variants within one Workflow: screen content lives in a single Workflow with multiple language renderings, **never as parallel per-language Workflow versions**. Instruction text at each difficulty level, screen-specific notes, Shared Instruction Blocks, deviation-capture forms, coaching assets, and Training Library content are all authored or uploaded per language."*

**The completeness check (L34359):** *"Before publication, a locale-completeness check verifies that every worker-facing element of the Workflow — **including the designated coaching defaults** — exists in every locale the Workflow declares; an incomplete locale blocks publication in that locale."*

**Per-locale, not per-Workflow — and this is a `Derived Clarification` (L34361):** *"A Workflow declaring English and Spanish whose Spanish coaching default is missing publishes in English and is blocked in Spanish, with the specific missing element named. This is a deliberate reading of 'blocks publication in that locale' and is `Derived Clarification`; the alternative reading, that any incompleteness blocks the whole publication, would make a partially localised improvement impossible to ship and is rejected for that reason."* **Render both readings.**

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L34376–L34383 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L34376–L34383, **eight** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|---|
| 1 | Declare a Workflow's locale coverage | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 2 | Author a locale variant | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 3 | Request artificial-intelligence drafting of a locale variant | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 4 | Publish into an incomplete locale | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 5 | Enable run-time machine translation | Explicitly prohibited — nothing is translated at run time, anywhere | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 6 | Add a locale beyond English and Spanish | Explicitly prohibited — two languages at V1 | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 7 | Manage locale-pack versioning and governance | Not applicable — locale-pack versioning sits platform-side | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason |
| 8 | View the coverage report | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |

**ROW 7 IS THE ONLY MATRIX ROW ON THE ENTIRE SURFACE WHERE ALL SIX CELLS ARE IDENTICAL AND ALL SIX ARE `Not applicable`. NOTHING RENDERS. A build that shows a locale-pack management section on any Studio screen invents a surface.** A gate asserts its absence.

### What this task must build

- **The fail-closed rule** (`FUNC-STU-17-03-A-1` L34409; `AC-STU-149` L34487): *"where the check itself cannot run, publication is blocked, failing closed, because publishing an unverified locale is the exact failure the check exists to prevent."* Register publish-check #6.
- **`SB-STU-20` (L34447):** *"A grid with one row per worker-facing element and one column per declared locale, each cell showing Complete, Drafted awaiting review, or Missing with the element named. A per-locale summary line reads either 'Ready to publish' or 'Blocked, with a count of missing elements'. **Each Missing cell links straight to the editor for that element in that locale.** A permanent line reads: 'Nothing is translated at run time. Every locale variant is authored and reviewed.'"*
- **States (L34393):** per element per locale — Authored, Drafted by artificial intelligence, Reviewed, Complete, Incomplete. Per locale on a Workflow — Complete and publishable, or Incomplete and blocked.
- **Objects (L34391):** `OBJ-STU-LOCALE`, `OBJ-STU-SCREEN`, `OBJ-STU-BLOCK`, `OBJ-STU-ASSET`, `OBJ-STU-TRAINING`, `OBJ-STU-VERSION`. **D11: `OBJ-STU-LOCALE` has NO numeric counterpart** — `OBJ-051` Locale pack (L8875) is the platform-side pack, not the per-locale authored variant. **Register it as a GAP, never mint an `OBJ-1xx`.** Hand the gap to Task 25.

### Steps

- [ ] **Step 1:** Read L34376–L34383. Report the row count (expected 8).
- [ ] **Step 2: Failing test — per-locale blocking, not whole-publication blocking**
```ts
it('publishes English and blocks Spanish when a Spanish coaching default is missing', () => {
  const r = evaluateLocaleCompleteness(wfMissingSpanishCoachingDefault)
  expect(r.publishable).toEqual(['en'])
  expect(r.blocked).toEqual(['es'])
  expect(r.blockers[0].element).toMatch(/coaching default/i)
})
```
- [ ] **Step 3: Failing test — fail closed when the check cannot run**
```ts
it('blocks publication in every declared locale when the check cannot run', () => {
  const r = evaluateLocaleCompleteness(wf, { checkStatus: 'unrunnable' })
  expect(r.publishable).toEqual([])
  expect(r.reason).toMatch(/could not be verified/i)
})
```
- [ ] **Step 4: Failing test — row 7 renders nothing**
```ts
it('offers no locale-pack management anywhere on the Studio', () => {
  const html = readAllBuiltStudioRoutes()
  expect(html.length).toBeGreaterThan(0)
  expect(html.join('')).not.toMatch(/locale pack (management|versioning)|manage locale pack/i)
})
```
- [ ] **Step 5:** Every Missing cell **links to the editor for that element in that locale**. R13: the test **fails when the target element is removed**, not one that iterates the grid.
- [ ] **Step 6:** No run-time translation control exists (categorical → ABSENT). No third locale can be added.
- [ ] **Step 7:** Register publish-check #6. Report `OBJ-STU-LOCALE` as a registered gap for Task 25.
- [ ] **Step 8: axe. GREEN, typecheck, lint. Report.**

---

# WAVE 5 — BLOCKS, QUALIFICATION, PACKAGE, TRAINING (Tasks 17–20, fully parallel)

---

## Task 17 — `MOD-STU-06` Shared Instruction Blocks

**Files:** `src/studio/modules/stu-06/**` · `app/studio/instruction-blocks/**` · `tests/unit/stu-blocks.test.ts`
**Screen:** `SCR-STU-05` (L48263); catalogue A `SCR-STU-BLOCK` (L31073). Storyboard `SB-STU-09` (L32523). **Section §5.6, card L32435–L32572.**

**Purpose (L32450):** *"Author instruction context once at Workflow level and apply it to any number of screens within that Workflow."*

**THE DEFINING CONSTRAINT, AND THE SOURCE SAYS IT IS EASY TO GET WRONG (L32443):** *"That scoping rule is the module's defining constraint and is easy to get wrong in implementation. **A block is not a library item. It has no cross-Workflow reuse, no independent version number, and no separate governance: it lives inside its Workflow and is published, diffed, and archived with it.**"* L32441: *"Blocks are scoped to a single Workflow and do not appear in the Content Libraries."*

**R11 — the natural data model for *write once, apply to eight screens* IS a library, and that is the defect.** The block record is **keyed by Workflow**, and the **service-layer** refusal (L32486) is exercised by a gate attempting a cross-Workflow reference.

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L32456–L32463 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L32456–L32463, **six** data rows. The narrowest matrix on the surface.

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|---|
| 1 | Create a block within a Workflow | Allowed | Allowed — create and apply Shared Instruction Blocks | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 2 | Apply a block to a screen | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 3 | Edit a block, propagating to every applying screen | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 4 | Remove a block from a screen | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 5 | Reuse a block in another Workflow | Explicitly prohibited — blocks are scoped to a single Workflow | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 6 | Read a block on published content | Read-only | Read-only | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited — workers meet the rendered result on the device, not the block |

**Note the last cell.** It is the **only Worker cell on the surface that carries an explanation rather than a bare prohibition**, and the explanation is a cross-surface statement: the worker meets the rendered composition, never the block.

### What this task must build

- **The propagation honesty rule (L32480, `AC-STU-070` L32562).** *"because a block edit changes worker-facing instruction content, it is a content change requiring republication, which means propagation is not instantaneous on the floor and **no view may suggest otherwise**."* L32500: *"Where a block is edited after the Workflow is published, the change lands in a new draft and reaches the floor only through a new published version and its adoption; **no propagation occurs to a pinned package.**"*
- **The audit shape a reviewer must see (L32548):** *"Block creation, edits, applications, and removals are captured in the draft revision history and surface in the screen-level diff **for every affected screen, so that a reviewer sees eight changed screens rather than one changed block.**"*
- **States (L32473):** Draft, Applied to one or more screens, Published within a version. *"A block with no applying screens is Draft and orphaned, and is **reported as an unused block at submission rather than blocking it**."*
- **`SB-STU-09` (L32523):** the panel lists every block in this Workflow with title, applying-screen count, and locale/difficulty coverage state. *"A prominent line states: 'Blocks belong to this Workflow only. They are not Content Library items and cannot be used in another Workflow.' **A delete control is disabled while applying screens exist, with those screens named.**"*
- **Objects:** `OBJ-STU-BLOCK`, `OBJ-STU-SCREEN` (L32471) = `OBJ-039` (L8646).

### Steps

- [ ] **Step 1:** Read L32456–L32463. Report the row count (expected 6).
- [ ] **Step 2: Failing test — the cross-Workflow refusal is at the SERVICE layer**
```ts
it('refuses a cross-Workflow block reference at the service layer', () => {
  const b = createBlock({ workflowId: 'WF-1', title: 'Torque safety' })
  expect(blockService.applyToScreen({ blockId: b.id, screenId: 'WF-2:S1' }).ok).toBe(false)
  expect(blocksVisibleIn('WF-2')).toEqual([])         // not merely hidden in the picker
})
it('keys the block record by Workflow', () => {
  expect(Object.keys(createBlock({ workflowId: 'WF-1' }))).toContain('workflowId')
})
```
- [ ] **Step 3: Failing test — the diff shows N changed screens, not one changed block**
```ts
it('surfaces a block edit as one diff entry per affected screen', () => {
  applyBlockTo(['S1','S2','S3','S4','S5','S6','S7','S8'])
  const entries = screenLevelDiff(editBlock({ text: 'new' }))
  expect(entries).toHaveLength(8)
  expect(entries.map(e => e.screenId).sort()).toEqual(['S1','S2','S3','S4','S5','S6','S7','S8'])
})
```
- [ ] **Step 4: Failing test — no view suggests live propagation to a pinned package**
```ts
it('says a block edit reaches the floor only through a new published version', () => {
  render(<BlockEditor block={publishedBlock} />)
  expect(screen.getByText(/new published version and its adoption/i)).toBeInTheDocument()
  expect(screen.queryByText(/takes effect (immediately|now) on the floor/i)).toBeNull()
})
```
- [ ] **Step 5:** An orphaned block is **reported at submission, never blocking it.** The delete control is **disabled with the applying screens NAMED**; the test fails when a screen name is dropped.
- [ ] **Step 6:** Register the block-reference element of publish-check #7.
- [ ] **Step 7:** The audit path on create/apply/edit/remove. **The covering test edits the block before the audit fails and asserts every applying screen is unchanged.**
- [ ] **Step 8: axe. GREEN, typecheck, lint. Report.**

---

## Task 18 — `MOD-STU-13` Qualification Requirements

**Files:** `src/studio/modules/stu-13/**` · `app/studio/qualification-requirements/**` · `tests/unit/stu-qualifications.test.ts`
**Screen:** `SCR-STU-10` (L48268); catalogue A `SCR-STU-QUAL` (L31078). Storyboard `SB-STU-16` (L33725). **Section §5.13, card L33604–L33781.**

**Purpose (L33627):** *"State authoritatively which certifications a Workflow and its individual screens require, at two levels, validated at three points."*

**Two levels (L33610):** *"a baseline stated authoritatively on the Workflow — and therefore on any Job or Run linked to it — and screen-level overrides requiring additional certifications above that baseline."*
**Three validation points (L33614):** *"at assignment in the Delivery Operations Hub, again at Run start, and once more when a worker reaches a screen carrying an override."*
**The tag never decides (L33612):** *"the tenant's tag-to-qualification-set mapping pre-populates the baseline as a starting convenience; **the tag never decides the requirement** — what is stated on the Workflow is authoritative, and the author edits freely over the pre-population."*
**The only configurable gate on the platform (L33616):** *"The Tenant Admin sets hard-block versus notify, and clearance duration… The specification and evaluation gates, by contrast, are hard and non-configurable."*
**Grandfathering-but-flagged (L33618):** *"A certification-requirement change applies to Runs scheduled after the version carrying it is published; **active assignments are grandfathered but flagged, with the supervisor confirming continuation and a recorded reason.**"*

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L33635–L33645 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L33635–L33645, **eleven** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|---|
| 1 | State the Workflow qualification baseline | Allowed — manages Qualification Requirements | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 2 | Add a screen-level override | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 3 | Edit over a tag-driven pre-population | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 4 | Maintain the tag-to-qualification-set mapping | Not applicable — the mapping is tenant administration area master data | Not applicable — same reason | Not applicable — same reason | Allowed — in the tenant administration area | Read-only | Explicitly prohibited |
| 5 | Set hard-block versus notify posture | Explicitly prohibited — the posture is a tenant setting | Explicitly prohibited | Explicitly prohibited | Allowed — in the tenant administration area | Read-only | Explicitly prohibited |
| 6 | Set clearance duration | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed — uniform at tenant level, deliberately not per user | Read-only | Explicitly prohibited |
| 7 | Grant a qualification clearance | Not applicable — clearance is Client Command Center action ten | Allowed — Supervisor and above, in the Client Command Center | Allowed — same | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 8 | Confirm continuation of a grandfathered assignment | Allowed | Allowed — the supervisor confirms with a recorded reason | Allowed — same | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 9 | Enter or amend a worker's certification record | Explicitly prohibited from the Studio — certifications are Delivery Operations Hub master data, supervisor-entered, no self-attestation | Explicitly prohibited from the Studio | Explicitly prohibited from the Studio | Explicitly prohibited from the Studio | Explicitly prohibited | Explicitly prohibited |
| 10 | View the cross-Workflow requirement view | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 11 | Make the qualification gate looser than the platform floor | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**Rows 4, 5 and 6 are the third, fourth and fifth inversions**: the Tenant Admin holds three things the Quality Manager does not, and **every Quality Manager cell names the owner**. Row 6's Tenant Admin cell carries a design fact inside the token: `uniform at tenant level, deliberately not per user`.
**Row 7 is the surface's clearest cross-surface grant** — Quality Manager `Not applicable`, both Supervisor columns `Allowed`, because the act happens in the Client Command Center under the `Supervisor and above` reading of `DEC-PLUS-001`. **This aligns exactly with slice 4's D23 and D10: the Hub renders the clearance register read-only and grants nothing; the Studio renders the requirement and grants nothing.**
**Row 9 is the only row where the token is prefixed with a surface qualifier on four separate cells:** `Explicitly prohibited from the Studio`. **That qualifier is load-bearing** — the same act is permitted for a Supervisor **in the Hub** (slice 4's D9). Rendering it as a flat prohibition contradicts slice 4.

### What this task must build

- **The strictness defaults, both of which must be built (L33674, L33671):** *"where the posture cannot be read, the device applies the stricter posture, hard-block, because the configurability principle permits stricter and never looser."* And *"a gate block encountered offline parks the run, the worker continues other assigned runs, and the parked run resumes when the clearance arrives."*
- **`AC-STU-118` (L33769), inherited from slice 4's R7:** *"No surface shows a clearance as effective before its command reaches applied on the device."* Render through Task 2's `renderAdoption`.
- **`AC-STU-119` (L33770):** the Studio cannot create, edit or delete a certification record. An override naming an **unmaintained** certification **blocks publication with the certification named** — publish-check #8. **Seam to `MOD-DOH-04`, slice 4** — it reads slice 4's D22 certification-type fixture, which has **no CRUD**.
- **The tag-to-qualification-set mapping is an UNREGISTERED dependency** — *"no module owns it in any card read."* It ships as a **named read interface** with the *"convenience rather than a requirement"* fallback (L33662): unreadable → the author states the baseline manually and publication is **NOT** blocked. `StudioSeamNotice` states **owner named, no slice assigned.**
- **`SB-STU-16` (L33725):** two panels — baseline certifications with a source badge reading either **'Pre-populated from tag'** or **'Authored'**, and screens carrying overrides. A cross-Workflow tab groups every requirement by certification with the count of Workflows and screens requiring it. **A banner states the tenant's current posture and clearance duration, read from the tenant administration area and marked read-only here.**
- **States (L33655):** Drafted or Published within a version; against an assignment it evaluates to Satisfied, Unsatisfied-blocked, Unsatisfied-notified, Cleared by a granted clearance, or Grandfathered-and-flagged.
- **Objects:** `OBJ-STU-QUALREQ`, `OBJ-STU-SCREEN`, `OBJ-STU-WORKFLOW`, `OBJ-STU-PACKAGE` (L33653). **`OBJ-STU-QUALREQ` has NO numeric counterpart — register it as a GAP (D11), never mint an `OBJ-1xx`.** Hand it to Task 25.

### Steps

- [ ] **Step 1:** Read L33635–L33645. Report the row count (expected 11).
- [ ] **Step 2: Failing test — the stricter default when the posture cannot be read**
```ts
it('applies hard-block when the posture cannot be read', () => {
  expect(effectivePosture({ read: 'fails' })).toBe('hard-block')
})
it('never derives a looser posture than the platform floor', () => {
  expect(() => setPosture('looser-than-floor')).toThrow()
})
```
- [ ] **Step 3: Failing test — the tag never decides**
```ts
it('lets the author edit freely over a tag pre-population and keeps the authored value', () => {
  const b = baselineFor(wfWithTag)
  expect(b.source).toBe('Pre-populated from tag')
  const edited = editBaseline(wfWithTag, ['Torque Wrench Operator Certification'])
  expect(edited.source).toBe('Authored')
  expect(reapplyTag(wfWithTag).certifications).toEqual(['Torque Wrench Operator Certification'])
})
```
- [ ] **Step 4: Failing test — the unmaintained certification blocks with the name**
```ts
it('blocks publication naming the specific certification', () => {
  const r = evaluatePublish(wfWithOverride('Retired Cert X'))
  expect(r.blocked).toBe(true)
  expect(r.blockers.find(b => b.checkId === 'certification-maintained')!.blockingElement)
    .toContain('Retired Cert X')
})
```
- [ ] **Step 5: Failing test — the mapping seam does NOT block publication when unreadable** (it is a convenience, not a requirement).
- [ ] **Step 6:** Rows 4–7 render as **cross-surface statements**. Assert **no Studio route** offers a posture control, a clearance-duration control, a clearance grant, or a certification-record editor.
- [ ] **Step 7:** No clearance renders as effective before `applied`. Register publish-check #8.
- [ ] **Step 8:** Report `OBJ-STU-QUALREQ` as a registered gap for Task 25. **axe. GREEN, typecheck, lint.**

---

## Task 19 — `MOD-STU-14` The Offline Package

**Files:** `src/studio/modules/stu-14/**` · `app/studio/work-package/**` · `tests/unit/stu-package.test.ts`
**Screen:** **no catalogue screen** — the manifest is storyboard `SB-STU-17` (L33905), rendered on an **uncatalogued route** annotated as such. **Section §5.14, card L33783–L33959.**

**Purpose (L33814):** *"Define, build, deliver, and pin the complete self-sufficient bundle a device needs to render, evaluate, and enforce a Run alone."*
**Owning surface (L33813):** *"Standards and Operations Studio (`SURF-STU`), **instantiated per Run at assignment**."*

### The package contents — L33793–L33797, **five numbered classes**, quoted whole

> *"**The package contains everything the device must render, evaluate, and enforce alone**:
> 1. all screen content, including instruction text at the difficulty levels — all levels pending the packaging decision of `DEC-WIDIFF-001` — in the Run's locale;
> 2. specification limits and gate rules;
> 3. the screen severity mappings together with the severity-catalog definitions and tenant action bundles needed to classify and act at capture;
> 4. the platform deviation-capture forms, so the default gate-failure path works offline;
> 5. the designated coaching defaults and short-form coaching assets, included subject to available device storage."*

L33799: *"**Training Library content is excluded. Escalation delivery is server-side and is not packaged.**"*

**D8 — FIVE AGAINST SIX, an unregistered count conflict.** `AC-STU-120` (L33941) asserts *"all five stated content classes"*. `AC-WF-AUT-009-01` (L53647) asserts six — *"specification limits, gate rules, severity mappings, catalog definitions, tenant action bundles, and deviation-capture forms"* — and `TEST-WF-AUT-009-01` (L53648) is *"Manifest assertion for the **six** mandatory content classes."* The six-way list splits class 3 into three and class 2 into two, and **drops screen content and coaching entirely.** Both are test-strength assertions about one manifest and **no `DEC-*` identifier exists for this.**

**Build:** the manifest is **one data structure quoting L33793–L33797's five numbered classes verbatim**, with the six-way split recorded as a **second grouping of the same contents**. **R17: THE GATE ASSERTS CONTENTS, NOT CARDINALITY.** Both criteria are satisfied and **neither count is asserted as *the* count.**

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L33822–L33829 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L33822–L33829, **eight** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|---|
| 1 | Define package contents | Explicitly prohibited — the package definition is platform-fixed from the published version | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 2 | Trigger a package build | Not applicable — the build fires at run assignment in the Delivery Operations Hub | Allowed with conditions — through run assignment in the Delivery Operations Hub | Allowed with conditions — same | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 3 | Perform an on-demand re-pull to a device | Not applicable — re-pull is a supervisor action | Allowed — on-demand re-pull by the supervisor | Allowed — same | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 4 | Swap the package of an in-flight Run | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 5 | Include Training Library content in a package | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 6 | Exclude a severity mapping from a package | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 7 | View which package version a Run is pinned to | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Allowed with conditions — the worker sees the version on their own Run |
| 8 | Execute a package | Not applicable — execution is a Frontline action | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Allowed — on the assigned device |

**Row 1 is the only row on the surface where the Quality Manager — the surface's most privileged tenant role — is categorically prohibited from something with NO alternative holder anywhere.** The package definition is platform-fixed. It is the Studio's equivalent of slice 4's D10.
**ROWS 2 AND 3 ARE R22'S NAMED TRAP.** *"Trigger a package build | Not applicable — the build fires at run assignment in the Delivery Operations Hub"*, with **both Supervisor columns `Allowed with conditions`**. **An implementer reading only the Allowed cells will put a Build button on a Studio screen.** These are **cross-surface statements**. Slice 5 builds the definition, manifest and pinning contract, **and never fires a build**.

### What this task must build

- **Offline severity handling, stated correctly (L33801):** *"Severity classification is on-device, at the moment of capture — always, including fully offline… **a Severity 1 classification places the lot hold at once, on the device, without waiting for connectivity.** What waits for reconnection is delivery."*
- **R10 — the superseded description is a DEFECT if it reappears (L33803):** *"The discovery-stage description of offline deviations being **'processed at sync, with severity-band evaluation running on the captured value at that point'** is explicitly superseded by Part V… **Any delivered artefact repeating the superseded description is a defect.**"* `AC-STU-030`, `AC-STU-126`. It is *a plausible sentence an implementer might write from first principles* — a **string gate over the built artefact** (Task 24 gate 10) catches it.
- **`Quarantined` as a FLAG (D21).** States L33839: Defined, Built, Delivered, Pinned, Superseded. *"A package that fails integrity verification is **Quarantined** and is never Delivered."* Quarantined is in the prose and **not** in the enumeration. Quarantine's own definition (L31322): *"the suspect item is set aside where it cannot be used but is not destroyed, so it can be inspected; it matters because silently discarding a bad package would hide a distribution fault."*
- **The package-integrity consequence (L32918, `AC-STU-080` L32922):** *"On restoration, package definitions are re-verified to confirm no training item was included; any inclusion is treated as a package integrity failure and the package is **quarantined rather than delivered**."*
- **The separate completeness act (`SEQ-013` step 3, L68396):** *"The platform, checking the package before it is publishable, verifies that the specification limits, the severity mappings, the gate rules and the deviation-capture forms are all present. If any were missing the package could not be built and the version could not be distributed."* And L68465: *"`Versioned` and `Distributable` are different states, so a version can exist in history without ever having been safe to run."*
- **`SB-STU-17` (L33905):** a **read-only** manifest per Run — pinned Workflow version, locale, difficulty levels carried, screen count, presence of limits and gate rules, severity mappings with catalog levels and tenant action bundles, deviation-capture forms, and coaching assets **with any storage-driven omission listed explicitly by asset name**. *"A line reads: 'This Run executes this package. A newer published version does not change it.'"*
- **D15 pinning semantics.** A library edit propagates in the Studio at once and reaches the floor **at the next package build**. The counter-argument renders: pinning *"delays a safety-motivated checklist improvement by up to one Run."*
- **D16:** all three difficulty levels ship in the manifest (the interim rule), with the recommendation rendered as the alternative and its storage trade-off stated.
- **Two further open decisions render here:** `DEC-PKGFIELD-001` (L33807) — *"§6.7.4 states that the authoritative field-by-field assignment is carried in the package contract of Part VII; **Part VII does not enumerate it**"* — and `DEC-STORE-001` (L33850), storage-full behaviour *"explicitly deferred to the Frontline functional specification; **no behaviour is invented here.**"*
- **The pin (step 19) is rendered, never fired.** `WF-AUT-010`'s surface is the Hub, `MOD-DOH-06`, slice 6. `StudioSeamNotice`.
- **Objects:** `OBJ-STU-PACKAGE` (L33837) = `OBJ-045` Work package + `OBJ-046` Package manifest (L8760, L8779).

### Steps

- [ ] **Step 1:** Read L33822–L33829 and L33793–L33797. Report both counts (expected 8 rows, 5 classes).
- [ ] **Step 2: Failing test — contents, never cardinality**
```ts
it('carries every content element both criteria name, asserting no count', () => {
  const m = manifestFor(run)
  for (const el of ['screen-content','specification-limits','gate-rules','severity-mappings',
                    'catalog-definitions','tenant-action-bundles','deviation-capture-forms',
                    'coaching-defaults'])
    expect(manifestContains(m, el)).toBe(true)
  // Deliberately no assertion on m.classes.length — see D8 / R17.
})
it('renders both groupings with their locators and neither as THE count', () => {
  render(<PackageManifest run={run} />)
  expect(screen.getByText(/L33793/)).toBeInTheDocument()
  expect(screen.getByText(/AC-WF-AUT-009-01/)).toBeInTheDocument()
})
```
- [ ] **Step 3: Failing test — no Build button anywhere on the Studio (R22)**
```ts
it('offers no package build, no re-pull and no swap control on any Studio route', () => {
  const html = readAllBuiltStudioRoutes()
  expect(html.length).toBeGreaterThan(0)
  expect(html.join('')).not.toMatch(/build package|trigger (a )?build|re-?pull|swap package/i)
})
```
- [ ] **Step 4: Failing test — training content quarantines the package**
```ts
it('quarantines rather than delivers a package containing a training item', () => {
  const p = verifyIntegrity(packageWith({ trainingItem: 'TRN-1' }))
  expect(p.state).toBe('Quarantined')
  expect(p.delivered).toBe(false)
  expect(p.destroyed).toBe(false)     // set aside, not destroyed (L31322)
})
```
- [ ] **Step 5: Failing test — the superseded description is absent**
```ts
it('never repeats the superseded offline-severity description', () => {
  const html = readAllBuiltStudioRoutes().join('')
  expect(html).not.toMatch(/processed at sync/i)
  expect(html).not.toMatch(/severity-band evaluation running on the captured value at that point/i)
})
```
- [ ] **Step 6:** Storage-driven omissions are listed **explicitly by asset name**; the test fails when a name is dropped. `DEC-STORE-001` renders as *deferred, no behaviour invented*.
- [ ] **Step 7:** The pinning line renders and **no view suggests a newer published version changes a pinned package.**
- [ ] **Step 8: axe. GREEN, typecheck, lint. Report.**

---

## Task 20 — `MOD-STU-08` Training Library

**Files:** `src/studio/modules/stu-08/**` · `app/studio/training-library/**` · `tests/unit/stu-training.test.ts`
**Screen:** `SCR-STU-09` (L48267); catalogue A `SCR-STU-TRAINING` (L31077). Storyboard `SB-STU-11` (L32887). **Section §5.8, card L32786–L32937.**

**Purpose (L32809):** *"Author, version, and publish long-form instructional content delivered online-only and excluded from the offline work package."*

**Its five rules, stated exactly (L32796–L32800):**
1. *"Content is **versioned and audited exactly like work instructions**, passing the same approval chain and carrying the same permanent history."*
2. *"Content is **authored and uploaded per language** (English and Spanish), with no run-time translation."*
3. *"Delivery is **online-only**: Training Library content is viewed over a connection, is excluded from the offline work package, and never competes with run-critical content for device storage. Storage, entitlement, and package-exclusion controls sit platform-side."*
4. *"Consuming training content **produces no production record**: viewing is not execution, generates no run telemetry, and never substitutes for a qualification."*
5. *"**Practice mode** — rehearsing a Workflow without producing a production record — **is cut from scope.** If it resurfaces, it is handled as a change request, not an assumed feature."*

**L32802 binds the build:** *"Rule five is a scope boundary rather than a behaviour, and this blueprint honours it: **no practice-mode behaviour is designed, proposed, or implied anywhere in this chapter.**" **Do not add one, do not hint at one, do not render a disabled one.**

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L32815–L32825 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L32815–L32825, **nine** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|---|
| 1 | Author and upload Training Library content | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 2 | Submit content into the approval chain | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 3 | Review a submission | Allowed with conditions — not on own submission | Allowed with conditions — not on own submission | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 4 | Release and publish | Allowed with conditions — Release Authority by tenant default, not on own submission | Explicitly prohibited — cannot approve or release | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 5 | Archive content | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 6 | Read published training content in the Studio | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited — workers view it through the Frontline Training Library Viewer |
| 7 | View published content on the device | Not applicable — the Studio is the authoring surface | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Allowed with conditions — online only, through the Frontline Training Library Viewer |
| 8 | View published content on the device while offline | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Unavailable — delivery is online-only and content is excluded from the offline work package |
| 9 | Have viewing count as execution or as a qualification | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**ROWS 7 AND 8 ARE THE ONLY ROWS ON THE ENTIRE SURFACE WHERE THE WORKER COLUMN IS THE ONLY NON-`Not applicable` CELL**, and **row 8 is one of exactly two places on the surface where `Unavailable` is used in the withheld-in-this-condition sense** (sense A) rather than the never-held sense. **Both rows describe a FRONTLINE consequence and neither is a Studio control** — exactly the case L31515's convention exists to cover: *"Because the Studio is web-only and requires an active connection, the statuses `Cached read-only while offline` and `Queued while offline` almost never apply to a Studio actor. Where they appear, they describe the Frontline consequence of a Studio configuration, not a Studio user's own experience, and the row says so."* **A build that renders either as a Studio control invents a screen.**

### What this task must build

- **`SB-STU-11` (L32887):** a list with title, language coverage, version, status, last published date; an upload control **stating the entitlement and remaining storage**; and *"A prominent banner reads: 'Training content is delivered online only. It is excluded from offline work packages, generates no production record, and never substitutes for a qualification.'"* Each item shows its approval log.
- **States (L32835):** Draft, In Review, Published, Archived — *"mirroring the Workflow lifecycle because the source requires the same chain and the same permanent history."*
- **Reuse consumer of Task 7's chain** (L32846). This is one of the four consumers the chain's covering test must exercise.
- **The exclusion guarantee** feeds Task 19's integrity check (`AC-STU-080`, L32922). Assert the exclusion **from this side too**, not only from the package side.
- **Seam to `MOD-FL-B12`, slice 7** — the Frontline Training Library Viewer, named three times in the matrix as the Worker's route (L32822–L32824). `StudioSeamNotice`.
- **Objects:** `OBJ-STU-TRAINING` (L32833) = `OBJ-044` (L8741).

### Steps

- [ ] **Step 1:** Read L32815–L32825. Report the row count (expected 9).
- [ ] **Step 2: Failing test — rows 7 and 8 render no Studio control**
```ts
it('renders the device-view rows as cross-surface statements, not controls', () => {
  render(<TrainingLibrary role="QUALITY_MANAGER" />)
  expect(screen.queryByRole('button', { name: /view on device/i })).toBeNull()
  expect(screen.getByText(/Frontline Training Library Viewer/i)).toBeInTheDocument()
})
it('renders row 8 Unavailable as sense A — the condition named, not a Studio state', () => {
  expect(cellRendering(TRAINING_MATRIX[7].cells.WORKER))
    .toMatchObject({ render: 'cross-surface-statement', condition: /online-only/i })
})
```
- [ ] **Step 3: Failing test — no practice mode anywhere**
```ts
it('designs, proposes and implies no practice mode', () => {
  const html = readAllBuiltStudioRoutes().join('')
  expect(html.length).toBeGreaterThan(0)
  expect(html).not.toMatch(/practice mode|rehearse|dry run/i)
})
```
- [ ] **Step 4: Failing test — the exclusion holds from this side**
```ts
it('excludes every training item from every package definition', () => {
  const items = allTrainingItems(); expect(items.length).toBeGreaterThan(0)
  for (const i of items) expect(packageDefinitionContains(i.id)).toBe(false)
})
```
- [ ] **Step 5:** Viewing counts as neither execution nor a qualification — assert no telemetry record and no qualification effect.
- [ ] **Step 6:** Route content through Task 7's chain; assert release is refused on own submission.
- [ ] **Step 7:** The audit path on publish/archive. **The covering test publishes before the audit fails and asserts the item stayed In Review.**
- [ ] **Step 8: axe. GREEN, typecheck, lint. Report.**

---

# WAVE 6 — AGENTS, LEARNING, AND THE JOURNEY (Tasks 21–23, fully parallel)

---

## Task 21 — `MOD-STU-02` Agent Configuration + `MOD-STU-15` The Agent Builder

**Files:** `src/studio/modules/stu-02/**` · `src/studio/modules/stu-15/**` · `app/studio/agents/**` · `tests/unit/stu-agents.test.ts`
**Screen:** `SCR-STU-13` "Agent configuration and Agent Builder" (L48271) — catalogue B **merges** what catalogue A splits into `SCR-STU-CAPS` and `SCR-STU-AGENT` (L31084–L31085). Storyboards `SB-STU-05` (L31814, **read-only cross-reference only — see C10**), `SB-STU-18` (L34096), `SB-010-01` (L68013). **Sections §5.2 (card L31680–L31869) and §5.15 (card L33961–L34152).**

**Why the two ride together:** `MOD-STU-02` *"owns nothing; composes 05, 07 and 13"* and both render on one catalogued screen. Splitting them would split one screen across two tasks — the conflict shape C8 and C9 exist to prevent. **The internal seam:** `stu-02` holds the **configuration read** over the nine-section panel's data; `stu-15` holds the **composition** object and its three gates. They share the route file and nothing else.

**`MOD-STU-02`'s core principle, stated exactly (L31688):** *"An agent does not contain its own rules… The timing threshold that decides when coaching appears, the specification limits that define a tolerance breach, the severity mapping that determines how serious a deviation is, the containment checklist that launches in response — none of these live in the agent. They live in the Workflow. **The agent is the engine; the Studio is where the engine is tuned.**"*

**`MOD-STU-15`'s registry boundary (L33971):** *"**The Agent Builder composes from the registry; it never adds to it.** Authoring a new atomic capability is a platform engineering task… **A tenant enables and composes; a tenant never authors an atom.**"* And L33990: *"The launch builder composes **reasoning agents only** — agents that produce an artifact. **Action agents… ship as platform-provided templates the tenant configures rather than composes, because their blast radius requires platform-authored evaluations.**"*

> **BOTH MATRICES BELOW ARE A CONVENIENCE. The frozen source at L31729–L31739 and L34007–L34020 is the authority. Read them before you build; report any disagreement as a finding.**

### `MOD-STU-02` permission matrix — L31729–L31739, **nine** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|---|
| 1 | Set a screen's timing expectation and coaching trigger | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 2 | Designate a screen's curated coaching defaults | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 3 | Map a band to a severity level, arming its consequence | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 4 | Select the containment checklist for a band | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 5 | Select or override the escalation routing template | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 6 | Set the repeated-coaching alert threshold per Workflow | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 7 | Change the Shift Handoff Agent's run time before shift end | Allowed with conditions — a tenant-level setting administered in the tenant administration area, read here | Read-only | Read-only | Allowed — the tenant administration area is the Tenant Admin's screen group | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 8 | Change an agent's own reasoning logic | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 9 | Release a Severity 1 hold from the Studio | Explicitly prohibited — release is a Client Command Center action, Quality Manager only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**NOTE THE SHAPE OF ROW 7.** It is the **only row on the surface where the Tenant Admin holds something the Quality Manager does not**, and the Quality Manager's cell explains why: the setting lives in the tenant administration area and is **read** here. **A build that renders it as a Studio control on the Quality Manager's screen inverts the ownership.** Seam to `MOD-DOH-03`, slice 4 — default 30 minutes before shift end, computed against the Shift's end time (L67942).

### `MOD-STU-15` permission matrix — L34007–L34020, **twelve** data rows

**The only module matrix whose second column is a GRANT HOLDER rather than a role, and the only one carrying a platform-role column.**

| # | Action | Quality Manager | Delegated administrator with Agent Author | Supervisor with authoring grant | Tenant Admin | Read-only Auditor | Worker | Platform Engineer |
|---|---|---|---|---|---|---|---|---|
| 1 | Enable or disable a capability within entitlement | Client Decision Required — `DEC-CAPAUTH-001` | Client Decision Required — `DEC-CAPAUTH-001` | Client Decision Required — `DEC-CAPAUTH-001` | Client Decision Required — `DEC-CAPAUTH-001` | Explicitly prohibited | Explicitly prohibited | Not applicable — the console sets entitlement, not enablement |
| 2 | Author an atomic capability | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — engineering change, evaluations written, evaluation gate, Admin approval |
| 3 | Compose a reasoning agent | Allowed with conditions — holds or delegates the Agent Author capability; Growth or Enterprise tier | Allowed with conditions — delegated Agent Author; Growth or Enterprise tier | Explicitly prohibited | Explicitly prohibited unless holding the delegated Agent Author capability | Explicitly prohibited | Explicitly prohibited | Not applicable — composition is a tenant act |
| 4 | Compose an action agent | Explicitly prohibited — action agents are configured, not composed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — action agents ship as platform templates |
| 5 | Configure a standard action agent through the nine-section panel | Allowed | Allowed with conditions — where they also hold the authoring grant | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — configuration is tenant authoring |
| 6 | Submit a composed agent to the evaluation gate | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — submission is a tenant act |
| 7 | Bypass the evaluation gate | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited — the gate binds every operator including the root account |
| 8 | Route a composed agent through the approval chain | Allowed with conditions — subject to separation of duties | Allowed with conditions — same | Allowed with conditions — may act as Reviewer on a composition they did not author | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable |
| 9 | Perform the platform-level review | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — in the Super Admin platform console |
| 10 | Map a composed agent to Workflows, screens, and triggers | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable |
| 11 | Assign or revoke the Agent Author delegation | Explicitly prohibited — administration of Studio capacities sits with the Tenant Admin | Explicitly prohibited | Explicitly prohibited | Allowed — per the tenant administration area | Explicitly prohibited | Explicitly prohibited | Not applicable |
| 12 | View composed-agent status and mappings | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions — through a named access class only |

**ROW 1 IS THE SURFACE'S SINGLE MOST CONSEQUENTIAL OPEN CELL.** All four tenant columns read `Client Decision Required — DEC-CAPAUTH-001`, so **nobody holds capability enablement** — and enablement is what decides which of the nine configuration sections exist across **every** Workflow. Row 15 of the consolidated matrix (L34555) repeats it. **The whole "configuration follows capability" mechanism has no authorised operator until the client rules.** **C11: Task 8 owns the enablement view; this task holds NO enablement control and reads the seeded state.**
**Row 7 is the only row on the surface where the Platform Engineer cell is `Explicitly prohibited`** rather than `Not applicable` or `Allowed with conditions`, and its reason names the root account: *"the gate binds every operator including the root account."*
**D13 — `DEC-DELEG-001` bites column two, and it is NOT in chapter 20's open-decisions table.** §4.8.4: *"Delegation is deferred beyond V1; cover is handled by manually adding a role or grant"*, while §5.18 and §5.15.4 describe Agent Author as held **or delegated**. **This matrix's entire second column presumes delegation exists.** Build `[Y21]`'s interim position (L22052): *"Until decided, the build denies Supervisor access to the Agent Builder and names the decision"*, and **render the delegated column as `Client Decision Required` with `DEC-DELEG-001`.** Building it as `Allowed with conditions` would contradict §4.8.4 at the level of a stated fact.

### The three supporting tables, quoted because they are the maps

**What each agent needs from the Studio — L31705–L31709, three data rows**

| Agent | Type | What the Studio must supply | Where it is configured |
|---|---|---|---|
| Prevention Agent | Action agent, governed by pre-authorised Studio-authored policy | A timing expectation: the maximum and minimum expected duration for the screen and the point, as a percentage of the maximum, at which coaching should appear. Coaching content to deliver: the tenant's approved per-language coaching corpus from which the agent retrieves, plus the screen's curated default for cold start. The qualification and proof context: what the worker must be qualified for and what proof the screen requires, so the agent can recognise the nature of the difficulty — a missing photo, a hesitation, a repeated gate block | Timing section; Coaching Corpus and Section 6 of the screen; Section 4 and Section 9 |
| Deviation and Containment Agent | Action agent, human-gated where it proposes beyond pre-authorised containment | Time bounds for the time-deviation mechanism; screen order and branch targets for the sequence mechanism; specification limits and gate-and-proof configuration for the specification and evidence mechanism; the severity mapping into the global catalog; the containment checklist; the escalation routing template | Timing section; the canvas; Specification Limits and Gate-and-Proof sections; Section 7 |
| Shift Handoff Agent | Reasoning agent, no governance gate | Mostly indirect: the deviations, coaching events, gate outcomes, and qualification requirements the Workflow configuration produced during the shift. The one direct authoring concern is qualification requirements, cross-referenced against the incoming shift plan to flag readiness gaps | `MOD-STU-13`, indirectly via all authored configuration |

**The three deterministic detection mechanisms — L31713–L31717, three data rows**

| Detection mechanism | What triggers it | Configured in |
|---|---|---|
| Time deviation | Screen duration exceeds the maximum, or completes below the minimum, which suggests a skip | Timing section: maximum and minimum duration |
| Sequence deviation | A screen is reached out of order, or a required predecessor screen was skipped | The canvas: screen order and branch targets |
| Specification or evidence deviation | A measurement falls outside the specification limits, or a screen is closed without the required proof | Specification Limits and Gate-and-Proof sections |

**Configuration follows capability — L33975–L33982, six data rows**

| If a tenant enables this capability | This configuration surface appears on the relevant screens |
|---|---|
| Real-time coaching, the Prevention Agent | Timing thresholds and the coaching-content section |
| Tolerance validation, part of deviation handling | Specification Limits: lower limit, upper limit, unit, drawing reference |
| Containment response, Deviation and Containment | Severity mapping, containment-checklist picker, escalation routing |
| Elevated qualification enforcement | Screen-level qualification override |
| Tool and equipment control | Tool barcode and calibration-confirmation requirements |
| A future capability, for example equipment-signal monitoring | A new configuration surface for that capability, appearing only where relevant |

### The rest of the build obligations

- **`DEC-GATE-001` and its practical consequence, verbatim (L31692):** *"the Studio must author the pre-authorised policy completely, because for the Prevention Agent that authoring approval is the whole of the human approval, and **must never present pre-authorised policy as though it were a runtime human gate.**"* The agent record's governance-binding field carries: Prevention Agent `authoring-time policy`; Deviation and Containment Agent `runtime human gate` for proposals beyond pre-authorised containment.
- **`SB-STU-18` (L34096), including the tier rendering:** *"**Compose controls are shown with the reason 'Requires the Growth or Enterprise tier' where the tier is below Growth, rather than hidden.** A permanent line reads: 'The Agent Builder composes reasoning agents only. Action agents are configured, not composed.'"* A Governance tab per agent shows the **three gates as a progress track** with each gate's outcome, timestamp and decider.
- **States (L34030):** Composed, Evaluation pending, Evaluation passed, In approval, Platform review, Deployed. *"Failure at the evaluation gate returns the composition to Composed with the failing scenarios named. **Deprecation, disablement, and rollback states are `DEC-AGENTLC-001`.**"* **There is no terminal state** — render that absence, do not invent one.
- **`DEC-AGENTLC-001` (L33994):** *"a composed reasoning agent that begins producing misleading briefs has no stated off switch short of the platform-wide emergency pause, which is a much blunter instrument."* Recommendation (a) tenant-side disable with an audited reason plus (c) a versioned composed-agent lifecycle. **Render as unspecified; do not invent the off switch.**
- **The disablement honesty rule** (`FUNC-STU-15-01-A-2` L34037; `AC-STU-130` L34135): *"disabling never alters a pinned package, so a disabled capability continues to execute on in-flight Runs until they finish, **which must be stated plainly rather than hidden.**"*
- **Evaluation harness seam, `MOD-SA-05`, slice 3:** unreachable → *"the composition holds at Evaluation pending and is never advanced on an assumption"* (L34050).
- **The composed-agent platform review queue is an UNREGISTERED dependency** — L67927 names it, **no `MOD-SA-*` identifier is attached.** Named interface, seeded outcome fixture, `StudioSeamNotice` with **no slice assigned**.
- **`TEST-STU-133` (L34148):** *"no composed reasoning agent appears in any work package or executes on a device."*
- **C10 / D23:** this task renders a **read-only cross-reference** to Task 15's Severity 1 arming confirmation plus the `DEC-STUXREF-001` off-by-one (§5.2.2 cites §5.5.9; the behaviour is at §5.5.8). **It does not implement the confirmation.**
- **Reuse consumer of Task 7's chain** (L34052) — composed agents plus two further gates.
- **`STATE-10`/`STATE-11`** apply on `SCR-STU-13`.
- **Objects:** `OBJ-STU-AGENTCFG`, `OBJ-STU-SCREEN`, `OBJ-STU-PACKAGE` (L31747); `OBJ-STU-CAPSTATE`, `OBJ-STU-COMPOSED` (L34028). **`OBJ-STU-CAPSTATE` has NO numeric counterpart — register it as a GAP (D11).** Hand it to Task 25.

### Steps

- [ ] **Step 1:** Read L31729–L31739 and L34007–L34020. Report both row counts (expected 9 and 12).
- [ ] **Step 2: Failing test — row 7's ownership is not inverted**
```ts
it('renders the Shift Handoff run time as READ-ONLY for the Quality Manager', () => {
  render(<AgentConfiguration role="QUALITY_MANAGER" />)
  const f = screen.getByLabelText(/lead time before shift end/i)
  expect(f).toHaveAttribute('readonly')
  expect(screen.getByText(/administered in the tenant administration area/i)).toBeInTheDocument()
})
```
- [ ] **Step 3: Failing test — nobody holds enablement, and the delegated column is open**
```ts
it('gives all four tenant columns clientDecisionRequired on enablement', () => {
  const row = AGENT_BUILDER_MATRIX[0]
  for (const c of ['QUALITY_MANAGER','DELEGATED_AGENT_AUTHOR','SUPERVISOR_WITH_GRANT','TENANT_ADMIN'] as const)
    expect(row.cells[c]).toMatchObject({ outcome: 'clientDecisionRequired', decision: 'DEC-CAPAUTH-001' })
})
it('denies Supervisor access to the Agent Builder and names DEC-DELEG-001', () => {
  const r = openAgentBuilder({ role: 'SUPERVISOR', grants: ['GRANT-STU-AUTHOR'] })
  expect(r.ok).toBe(false); expect(r.reason).toContain('DEC-DELEG-001')
})
```
- [ ] **Step 4: Failing test — the tier refusal is DISABLED with its reason, never hidden**
```ts
it("shows compose disabled with 'Requires the Growth or Enterprise tier' below Growth", () => {
  render(<AgentBuilder role="QUALITY_MANAGER" tier="Essential" />)
  const b = screen.getByRole('button', { name: /compose/i })
  expect(b).toBeDisabled()
  expect(b).toHaveAccessibleDescription(/Requires the Growth or Enterprise tier/)
})
```
- [ ] **Step 5: Failing test — no action-agent composer, no gate bypass, no device reach**
```ts
it('offers no action-agent composer and no evaluation-gate bypass', () => {
  expect(agentBuilderService).not.toHaveProperty('composeActionAgent')
  expect(agentBuilderService).not.toHaveProperty('bypassEvaluationGate')
})
it('puts no composed reasoning agent in any package', () => {            // TEST-STU-133
  for (const a of composedAgents()) expect(packageDefinitionContains(a.id)).toBe(false)
})
```
- [ ] **Step 6:** Evaluation harness unreachable → the composition **holds at Evaluation pending**; nothing advances on an assumption. The platform review queue seam names its **unregistered owner with no slice.**
- [ ] **Step 7:** The disablement honesty line renders: a disabled capability **continues to execute on in-flight Runs until they finish**, stated plainly.
- [ ] **Step 8:** Never present pre-authorised policy as a runtime human gate — assert the governance-binding field renders its true value on both action agents.
- [ ] **Step 9:** Audit path on compose/submit/map/deploy. **The covering test maps an agent to a screen before the audit fails and asserts the mapping did not persist.**
- [ ] **Step 10:** Report `OBJ-STU-CAPSTATE` as a registered gap for Task 25. **axe. GREEN, typecheck, lint.**

---

## Task 22 — `MOD-STU-16` Memory and the Two-Lane Learning Loop

**Files:** `src/studio/modules/stu-16/**` · `app/studio/learning/**` · `tests/unit/stu-learning.test.ts`
**Screen:** `SCR-STU-LEARN` (L31086, catalogue A only) — **rendered on its own route, annotated `SCR-STU-13`, minting no new screen id** (D1 / C12). Storyboard `SB-STU-19` (L34293). **Section §5.16, card L34154–L34349.**

**Purpose (L34186):** *"Write the Studio's authored content into memory, refine selection automatically inside authored boundaries, and route any proposed change to a configured value through a single human decision."*
**Owning surface (L34185):** *"…for the procedural and semantic writes and the learning read view; **the Client Command Center owns the Lane-B decision**."*

**Five typed stores (L34162):** working · episodic · semantic · procedural · profile. *"**The Studio writes the procedural and semantic layers**… The memory architecture itself is platform-owned; a tenant may set retention within the allowed bounds and the personal-information policy on profile memory, never the architecture."*

**The single test that divides the whole system (L34164, L34171).** Lane A is everything that does **not** alter a configured operating value; it *"changes no configured value by definition, so these refinements are applied automatically, logged, and reversible."* Lane B is *"Any refinement that would change a configured operating value — a trigger percentage, a routing target, checklist content"*, surfaced as a proposal: *"**A proposal is never auto-approved — the decision is always human, made exactly once.**"*

**The package test (L34171):** *"A package-borne value — anything that lives inside a published Workflow version — **auto-publishes as a patch version**… **A server-only value applies immediately.** The publication is automatic and fully audited; no second approval, no ceremony."* And: *"Undecided proposals age visibly with a 30-day stale flag and never expire silently. **In-flight runs stay pinned regardless.**"*

> **THE MATRIX BELOW IS A CONVENIENCE. The frozen source at L34194–L34202 is the authority. Read it before you build; report any disagreement as a finding.**

### Permission matrix — L34194–L34202, **nine** data rows

| # | Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|---|
| 1 | Read the learning view | Allowed — learning read view | Allowed — the Quality Engineer read view | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| 2 | Decide a Lane-B proposal | Allowed — in the Client Command Center | Client Decision Required — `DEC-LANEBAUTH-001` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited — no Client Command Center access at all | Explicitly prohibited |
| 3 | Reverse a Lane-A refinement | Allowed — Lane A is reversible | Allowed with conditions — where they hold the learning read view | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 4 | Turn learning off | Explicitly prohibited — there is no separate on/off switch | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 5 | Set retention within allowed bounds on memory | Explicitly prohibited from the Studio | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — in the tenant administration area, within platform bounds | Read-only | Explicitly prohibited |
| 6 | Set the personal-information policy on profile memory | Explicitly prohibited from the Studio | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — in the tenant administration area | Read-only | Explicitly prohibited |
| 7 | Change the memory architecture | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 8 | Export learned content outside the tenant | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| 9 | Flag or retire a low-performing coaching asset | Allowed | Explicitly prohibited — may propose | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**Row 2's Auditor cell is the only `Explicitly prohibited` on the surface carrying a positive statement of a DIFFERENT surface's rule:** *"no Client Command Center access at all"*. It is a **settled fact** and therefore **NOT** `Client Decision Required` — a useful contrast with row 1's Auditor cell four columns away, where the same role's Studio read **is** open. **Getting these two rows the same way round is a defect either direction.**
**ROW 4'S QUALITY MANAGER CELL STATES AN ARCHITECTURAL ABSENCE, NOT A PERMISSION:** *"there is no separate on/off switch"* (L34177: *"Learning is on by default, and the approval queue is the control"*). **Rendering it as a disabled toggle invents the control the source says does not exist.**

### What this task must build

- **`SB-STU-19` (L34293), three panels.** Coaching effectiveness lists **assets** with resolution rate, sample size, screens where used, and a flag badge for low performers with Review and Retire controls. Proposed threshold changes lists open Lane-B proposals with current value, proposed value, scope of impact, evidence summary, age, and a stale badge past 30 days, **each linking to the Client Command Center where the decision is made — "the Studio displays, it does not decide."** Prior-case relevance shows the feedback given and how similarity has shifted. *"A footer states: 'Nothing here changes a configured value without a person approving it. Lane A changes no configured value at all.'"*
- **S11 — support-not-surveillance, and here the hazard is INDIRECT but real.** L34322: *"Profile memory holds aggregates only under the personal-information redaction policy."* L34179: *"**Everything learned stays strictly inside the tenant's own manufacturing memory: nothing is shared across tenants, and nothing is exported as external training data.**"* **The coaching-effectiveness panel groups by ASSET, never by worker**, and the Lane-A signal is *"this asset, in this language, worked for this failure pattern on this screen"* (L34166) — **asset, language, pattern, screen. Never worker.**
- **The one irreversible act (L34322):** *"Worker personal data anonymises at 24 months for standard commercial tenants and never in Regulated-Industry mode; measurement, result, and evidence survive and the identity becomes an opaque worker identifier. **Anonymisation is the platform's one irreversible act.**"*
- **States (L34212):** a Lane-B proposal is Proposed, Stale-flagged at 30 days, Approved, Rejected, Published as a patch, or Applied immediately for a server-only value. **Lane-A refinements have no proposal state.**
- **D18 / `DEC-LANEBAUTH-001` (L34175), the persona-versus-role pivot.** *"A quality engineer is a **persona**, not a role… a quality engineer holding only the Supervisor role would be able to decide a Lane-B proposal under §5.16.3 but not under §6.14.2."* Recommendation (a), Quality Manager and above only, *"because the Client Command Center's action set is explicitly closed at ten and adding decision authority to a role is a scope decision rather than a drift."* **The Supervisor-with-grant cell renders `Client Decision Required`.**
- **§2.1 — `DEC-LANEB-001` mirror.** Render **the same disclosure component with the same locator set** Task 7 built: `AC-STU-097`/L33397 and `AC-STU-138`/L34332, `AC-STU-104`/`AC-STU-143`, `DEC-PKGFIELD-001` open. **Do not write a second disclosure.** The gate fixture pins both locator sets.
- **Seam to `MOD-CC-06`/`MOD-CC-13` action 3, slice 9** — the decision itself. `StudioSeamNotice`.
- **Objects (L34210):** the five typed memory stores; `OBJ-STU-VERSION` on a Lane-B patch; `OBJ-STU-ASSET` on flagging and retirement.

### Steps

- [ ] **Step 1:** Read L34194–L34202. Report the row count (expected 9).
- [ ] **Step 2: Failing test — no worker identifier is a grouping key**
```ts
it('groups coaching effectiveness by asset, never by worker', () => {
  const rows = coachingEffectiveness(); expect(rows.length).toBeGreaterThan(0)
  for (const r of rows) expect(namesPersonBehaviouralMeasure(Object.keys(r))).toBe(false)
  expect(Object.keys(rows[0]!)).toContain('assetId')
})
it('keys the Lane-A signal on asset, language, pattern and screen only', () => {
  expect(Object.keys(laneASignal())).toEqual(['assetId', 'locale', 'failurePattern', 'screenId'])
})
```
- [ ] **Step 3: Failing test — row 4 invents no control**
```ts
it('renders the absence of an off switch as a statement, not a disabled toggle', () => {
  render(<LearningView role="QUALITY_MANAGER" />)
  expect(screen.queryByRole('switch', { name: /learning/i })).toBeNull()
  expect(screen.getByText(/there is no separate on\/off switch/i)).toBeInTheDocument()
})
```
- [ ] **Step 4: Failing test — the Studio displays, it does not decide**
```ts
it('offers no Lane-B decide control on any Studio route', () => {
  render(<LearningView role="QUALITY_MANAGER" />)
  expect(screen.queryByRole('button', { name: /approve|reject/i })).toBeNull()
  expect(screen.getByRole('link', { name: /Client Command Center/i })).toBeInTheDocument()
})
it('never auto-approves a proposal and flags it stale at 30 days without expiring it', () => {
  const p = advanceProposalAge(proposal, 31)
  expect(p.state).toBe('Stale-flagged'); expect(p.expired).toBe(false)
})
```
- [ ] **Step 5:** Rows 1 and 2's Auditor cells differ — assert `clientDecisionRequired` on row 1 and `explicitlyProhibited` on row 2, **with the different-surface reason text**.
- [ ] **Step 6:** Render the `DEC-LANEB-001` disclosure by **importing Task 7's component**. Assert both locators render. **A second disclosure implementation is a defect.**
- [ ] **Step 7:** Lane A is reversible; reversing one restores the prior selection and is logged. A Lane-B package-borne approval auto-publishes as a **patch**; **in-flight runs stay pinned regardless.**
- [ ] **Step 8:** Audit path on flag/retire and on the memory writes. **The covering test retires an asset before the audit fails and asserts the asset is still Approved.**
- [ ] **Step 9: axe. GREEN, typecheck, lint. Report.**

---

## Task 23 — The Workflow Builder journey, end to end

**Files:** `app/studio/journey/**` · `tests/component/stu-journey.test.tsx`

**This is the master prompt's *real interactive authoring journey rather than a picture*.** It composes the real module routes over Task 5's `SEQ-011` fixture; it re-implements nothing. **Where a step's act belongs to another surface it renders a cross-surface statement, never a control.**

**The twenty-two steps, their owning module and their `WF-AUT` locator** (census §4, quoted; **A wins on five-surface effects, B on state names and ordering, C on control-level detail** — L53338–L53730, L67873–L68478):

| # | step | `WF-AUT` | module | task |
|---|---|---|---|---|
| 1 | Open or create | `WF-AUT-002` L53386 | `MOD-STU-03` | 9 |
| 2 | Choose taxonomy | `WF-AUT-002` | `MOD-STU-03` | 9 |
| 3 | Name, scope, version — four settings, **exactly two** defaults | `WF-AUT-002` | `MOD-STU-04` | 14 |
| 4 | Add, reorder, remove screens | `WF-AUT-002` | `MOD-STU-04` | 14 |
| 5 | Draw branches; accept or override the gate-failure default | `WF-AUT-002` | `MOD-STU-04` | 14 |
| 6 | Configure the nine sections | `WF-AUT-002` L53397 | `MOD-STU-05` | 15 |
| 7 | Author one difficulty level; draft the other two | `WF-AUT-001` L53365 | `MOD-STU-09` | 12 |
| 8 | Validate | `WF-AUT-002` | `MOD-STU-04` + S3 | 14 + 5 |
| 9 | Save draft | — | `FB-STU-01` | 2 + 14 |
| 10 | Compare versions (diff) | `WF-AUT-003` L53435 | `MOD-STU-12` | 10 |
| 11 | Preview | `WF-AUT-004` L53468 | `MOD-STU-11` | 7 |
| 12 | Submit | `WF-AUT-002` → `WF-AUT-004` | `MOD-STU-11` | 7 |
| 13 | Return with comments | `WF-AUT-006` L53540 | `MOD-STU-11` | 7 |
| 14 | Revise and resubmit | `WF-AUT-007` L53572 | `MOD-STU-11` | 7 |
| 15 | Evaluate — **composed agents only, not Workflows** | — | `MOD-STU-15` | 21 |
| 16 | Maker-checker approve | `WF-AUT-004`+`005` L53505 | `MOD-STU-11` | 7 |
| 17 | Publish | `WF-AUT-008` L53607 | `MOD-STU-12` | 10 |
| 18 | Generate the package | `WF-AUT-009` L53644 | `MOD-STU-14` | 19 |
| 19 | **Pin — a Delivery Operations Hub act, `MOD-DOH-06`** | `WF-AUT-010` L53679 | seam, slice 6 | 19 |
| 20 | Supersede | implicit in `WF-AUT-008` | `MOD-STU-12` | 10 |
| 21 | Roll back | `WF-AUT-011` L53711 | `MOD-STU-12` | 10 |
| 22 | Archive | implicit in `WF-AUT-011` | `MOD-STU-12` | 10 |

**The four steps whose REFUSALS are the point** (census §4.1) must each be reachable and demonstrated: rollback is a **forward** act (L53703, L53706); a revision **cannot skip the Reviewer** (L53567); **rejection requires comments** (L53535, *"the comment is the instruction to the Author"*); **publication cannot re-base an in-flight run** (L53602).

### Steps

- [ ] **Step 1: Failing test — every step renders all five surfaces, none blank**
```ts
it('renders five surface effects on every one of the 22 steps', () => {
  expect(JOURNEY_STEPS).toHaveLength(22)
  for (const s of JOURNEY_STEPS) {
    render(<FiveSurfaceEffects step={s} />)
    for (const surf of ['DOH','STU','CC','FL','SA'])
      expect(screen.getByTestId(`effect-${surf}`)).not.toHaveTextContent(/^\s*$/)
  }
})
```
- [ ] **Step 2:** The journey drives the **real module routes**; assert it imports no module internals and re-implements no control. A duplicated control is a defect.
- [ ] **Step 3:** The four sequence states advance in order: `STATE-STU-PREPARED` → `STATE-WF-DRAFT-SUBMITTED` → `STATE-WF-RELEASE-APPROVED` → `STATE-WF-PUBLISHED-V210`.
- [ ] **Step 4:** Step 19 renders the pin **as a cross-surface statement** with `StudioSeamNotice` to `MOD-DOH-06`, slice 6. **No build fires.**
- [ ] **Step 5:** Each of the four refusals is demonstrated and each names its reason.
- [ ] **Step 6:** `FB-SEQ-012`'s one-person-quality-team branch is reachable from the journey and reaches its terminal safe state.
- [ ] **Step 7: axe on every journey step. GREEN, typecheck, lint. Report.**

---

# WAVE 7 — GATES AND REGISTRY CLOSURE (Tasks 24–25, parallel; both strictly after Wave 6)

---

## Task 24 — The sixteen slice-5 gates

**Files:** `tests/coverage/slice-05-gates.test.ts` (one file; **no glob**)

**THE STANDARD.** Every gate **plants a violation on the axis the gate is for, watches it go red, and restores it.** A gate that cannot fail is worse than no gate — slice 4 shipped four of them, plus one guard whose baseline was chosen so the failure could not appear. **Both families are rejected here.**

**Two structural rules, both non-negotiable:**
- **Gates read the BUILT ARTEFACT wherever the claim is about what renders.** `readAllBuiltStudioRoutes()` must assert a **non-empty** file set before any `not.toMatch`. A scan of zero files passes every negative assertion.
- **Per-module gates enumerate their files FROM THE DIRECTORY**, never a hardcoded list — **and assert the enumeration is complete against `src/studio/modules.ts`'s eighteen rows.** An enumeration that finds nothing must be **red**, not green. This is C17.

| # | gate | proves | plants |
|---|---|---|---|
| 1 | No bare Studio module count anywhere in the built tree without its `Derived Clarification` qualifier and `DEC-STUDIO-001` | S12, `AC-STU-014`, R18 | a bare "18 modules" string |
| 2 | The closed vocabularies are exhaustive — capture types exactly seven plus none, Workflow settings exactly four, inheritable defaults exactly two, sections exactly nine | D19, R3, R5 | an eighth capture type and a third default; proves the **type-check** red |
| 3 | **No Read-only Auditor cell on `SURF-STU` resolves to a permission status** | D3, `AC-STU-157`, R2 | a `Read-only` Auditor cell copied from §25.3 |
| 4 | `STATE-07` renders nowhere on `SURF-STU`; **no write control is ever queued** | D22, D4, R20 | a `STATE-07` rendering and a queued write |
| 5 | The sequence-detection reference **is** the drawn order — one structure, no second authoring path | `AC-STU-056`, R4 | a second `sequenceReference` field |
| 6 | **Publication is blocked by each of the eleven S3 checks, individually**, each naming its blocking element | S3, R6, R13 | one violation **per check**, eleven plants |
| 7 | Separation of duties is evaluated by identity — a fixture persona holding both Supervisor and Quality Manager is refused the second stage | `AC-STU-100`, `TEST-STU-152`, R8 | a role-based distinctness check |
| 8 | **Every write goes through the audit path, after its own domain refusals and before its mutation**, and the covering test **mutates something observable before the audit fails** | S6, R7 | an audit call moved after the mutation, per handler |
| 9 | No Studio view claims a device state, a delivered escalation, or an effective clearance | S10, R1, R9 | a *"live on the floor"* string |
| 10 | The superseded offline-severity description appears nowhere in the built tree | `AC-STU-030`, `AC-STU-126`, R10 | the *"processed at sync"* sentence |
| 11 | **Draft visibility is enforced in the read, not the render** — the selector is asserted, and the draft and published canvas routes are separate reads | `AC-STU-048`, `AC-STU-151`, R14, R15 | an unfiltered selector with a hiding component |
| 12 | A block cannot be referenced from another Workflow **at the service layer** | `AC-STU-066`, R11 | a cross-Workflow block reference |
| 13 | The Studio holds one audit store, and it is the Hub's | L31481, R12 | a second Studio-local log |
| 14 | **Every cross-surface statement is not a control** — no Studio route offers the package build, the clearance grant, the profile field, the rebase, or the action bundle | R22 | one control per each of the five |
| 15 | Every cross-slice seam is a named interface with a fixture, and `MOD-STU-10`'s fixture exercises the **unconfirmed** hand-off | R21 | a silently-succeeding parts stub |
| 16 | **No persisted table or fixture has a worker identifier as a grouping key for a behavioural measure** — carried forward from slice 4 unchanged | S11 | a `workerId` grouping key |

**Plus two fixtures that pin, rather than settle, the two contradictions (§2):**
- **`LANEB_CONTRADICTION_FIXTURE`** holds `AC-STU-097`/L33397 **and** `AC-STU-138`/L34332, and asserts **both** render on screen with `DEC-LANEB-001` named. Removing either locator turns the gate red. **Neither is asserted as the source's answer.**
- **`ROLLBACK_ALIAS_FIXTURE`** holds `DEC-WFROLL-001`/L53350 **and** `DEC-VERROLL-001`/L8623, and asserts both render. Removing either turns the gate red.

**Plus the gate-file sequence guard** (gates 1..N gapless) carried from slice 3.

- [ ] **Step 1:** Write all sixteen with their plants.
- [ ] **Step 2:** For each gate, run the planted defect and **record the red output in your report**. Sixteen recorded failures, restored.
- [ ] **Step 3:** Assert `readAllBuiltStudioRoutes()` is non-empty before any negative match, and assert the per-module enumeration equals the eighteen-row registry.
- [ ] **Step 4:** GREEN with all plants removed. Report.

---

## Task 25 — Registry closure

**Files:** `scripts/build-registries.mjs` · `tests/unit/registry-build.test.ts`

**C14 — `registries/generated/**` IS BUILD OUTPUT.** `scripts/build-registries.mjs` rewrites it on every `pnpm build`; a hand-edited row is erased at the next build and stays invisible until slice 10 tries to reconcile. **All work happens in the generator.** Follow the pattern already there — the 63-source-defined + 18-derived module assertion at lines 388–392 is the shape to copy: **derive, then assert the count you derived.**

- [ ] **R19 — register the forty-one Studio notifications as derived rows with their card locators.** Forty-one trigger rows across the eighteen module cards, **none carrying a `NOTIF-*` identifier**, while `notifications.json` holds **zero** Studio rows against 205 total. A slice-10 reconciliation would otherwise find forty-one behaviours with no register entry. Slice 4 hit the mirror shape as its R9 — identifiers with no content; **this is content with no identifiers.** Each row carries its card locator and `sourceClass: "derived"`. **Do not mint a `NOTIF-*` identifier the source does not have** — the row's id is derived and labelled as such.
  **Count discipline:** report the number you actually found in the cards; if it is not forty-one, that is a finding, and the generator asserts the number you derived, not the number this brief states.
  **Explicitly excluded:** `MOD-STU-01`'s deliberately-absent row (L31664, *"a refusal is audited, not notified"*). Do not register it.
- [ ] **D11 — register the three object gaps, do not mint objects.** `OBJ-STU-QUALREQ` (Task 18), `OBJ-STU-CAPSTATE` (Task 21), `OBJ-STU-LOCALE` (Task 16) have **no numeric counterpart** in the closed `OBJ-001…099` register. **Minting three `OBJ-1xx` rows would inflate a closed ninety-nine** (R23). Register them as a **gap list**, with the mnemonic, the card locator, and the reason no numeric row exists.
- [ ] **D10 — map both feature schemes ONCE, in one table.** Chapter 20's `FEAT-STU-01-01`/`SUB-STU-01-01-A`/`FUNC-STU-01-01-A-1` against the four-digit traceability catalogue at L47378–L47431 (`FEAT-STU-0101`, exactly three features per module, all eighteen modules in one table). `features.json` already registers **both** — 123 `*-STU-*` rows for 54 four-digit features. **The four-digit catalogue is the traceability key** (same ruling and reason as slice 4's D20). **The two are never mixed in a ticket.**
- [ ] **Prove the generator's assertions can fail:** plant a wrong derived count, confirm the generator exits non-zero, restore. Record the output.
- [ ] **Do not touch `scripts/build-stu-module-reach.mjs`** (Task 4 owns it) or `scripts/build-doh-module-reach.mjs`.
- [ ] GREEN, typecheck, lint. Report.

---

# WAVE 8 — VERIFICATION (Task 26, last and alone)

## Task 26 — Slice verification

- [ ] Clean rebuild: `rm -rf out .next && pnpm verify`, exit 0. **All four suites plus lint and build.**
- [ ] Every Studio route present in the static export, **one `<h1>` each**.
- [ ] axe clean on every new route **and every state**, including `STATE-08`, `STATE-12`, `STATE-13`, `STATE-10`/`STATE-11` on `SCR-STU-04` and `SCR-STU-13`, and the editor's disconnected state.
- [ ] `out/` carries no blueprint filename and no absolute author path.
- [ ] **Coverage delta MEASURED from the regenerated registries, never quoted.** Run `pnpm build:registries` and read the numbers; put the before and after in the report. The eighteen Studio modules move to `demonstrated-in-storyboard` because the generator computes status **from the built route tree under `app/`** — verify that, do not assume it.
- [ ] Re-hash the frozen source and confirm no drift.
- [ ] **Whole-branch review and cross-module review BEFORE merge**, not after.
- [ ] Confirm the two contradictions of §2 are still **disclosed and unsettled** in the merged tree, and that no gate asserts 239, 187 or 164.

---

## Path-list discipline — keep this table current (RESUME §6a)

**Do not dispatch until the new path list has been diffed against every row.** Not against the other dispatch in the same message — against **every running agent**. This was recorded as a lesson twice and violated three times in slice 4.

| agent | path list | status |
|---|---|---|
| *(external)* hub defect fixes | `app/hub/**`, `tests/**` | **RUNNING — blocks every slice-5 path under `tests/`** |
| *(update at each dispatch; clear on report)* | | |

**Standing rules for this slice:**
- No slice-5 task declares `tests/**`, `scripts/**` or `registries/generated/**` as a glob.
- No slice-5 task touches `app/hub/**`.
- Wave 1 tasks 1, 2, 3 and 5 each carry one exact new file under `tests/unit/`; hold those files (not the whole tasks) until the hub-fix agent reports.
- Task 6 additionally holds `tests/unit/routes.test.ts` behind the same report.

## Reporting obligations, every task

1. The **row count you found** at your matrix's line span, against the count this plan states.
2. Any **disagreement** between the frozen source and this plan's quotation — as a finding, resolved toward the source.
3. **Call-site counts before and after** for any shared helper you touched.
4. The **red output** of every planted defect, and confirmation it was restored.
5. For Tasks 12 and 13: the **frozen component signature** you shipped, verbatim, for Task 15.

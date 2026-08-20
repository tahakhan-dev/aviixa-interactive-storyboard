# Slice 5 — Studio Authoring through Publication and Package (`SURF-STU`): Design Specification

**Status:** APPROVED (APP-012 standing autonomous authority to census closure; APP-013 no inter-slice stop; 2026-08-17 *"pick by yourself what suited for the business"*)
**Builds on:** Slice 4, `SURF-DOH` setup half, and slice 3's platform bootstrap
**Census:** `docs/census/2026-08-20-surf-stu-slice05-build-map.md` — 18 modules, 26 matrices, 239 rows, 24 decisions, 23 risks
**Frozen source:** sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines — re-hashed at slice entry, **no drift across six slices**

---

## 1. Scope — eighteen modules, and why the count itself is a deliverable

The Studio is the **only** surface whose module count the source does not state. That is not a footnote; it is the first thing this slice must render honestly.

> **The Statement of Work provides no canonical module count for the Standards and Operations Studio** (L30897). The eighteen-module model is `Derived Clarification` under `DEC-STUDIO-001`, derived by one rule — *"One module per numbered section of Part V, in section order, with the section's own heading as the module name"* (L30899) — with three alternatives rejected on the record (L30905‑L30907). **`AC-STU-014` (L30992) binds this build's own documents and screens, not only the blueprint's:** no document, screen, or interface may present a Studio module count as a Statement-of-Work fact.

| module | what it brings to the slice |
|---|---|
| `MOD-STU-01` Charter and Position | The Tier-2 refusal classification every other module inherits. No persisted object; its output is *"which configuration surfaces exist, which controls are absent, and which actions are refused"* (L31585). |
| `MOD-STU-02` Agent Configuration | The three standard agents' operating parameters, carried inside Workflow content. Owns nothing; composes 05, 07 and 13. |
| `MOD-STU-03` Workflow Library and Tenant Workspace | Owns `OBJ-STU-WORKFLOW`. **The landing view** (`AC-STU-017`). Every journey starts here. |
| `MOD-STU-04` Workflow Builder | **The exemplar.** Four settings, exactly two inheritable defaults, and a canvas that is simultaneously the worker's path and the sequence-detection rule. |
| `MOD-STU-05` Screen Authoring | The nine configuration sections. The largest module and the one carrying five publication-blocking validations. |
| `MOD-STU-06` Shared Instruction Blocks | Workflow-scoped, never a library item — *"easy to get wrong in implementation"* (L32443). |
| `MOD-STU-07` Content Libraries | Three libraries, one pointer model, three open decisions. |
| `MOD-STU-08` Training Library | Five rules, four of which are exclusions. Its substance is what it does not do. |
| `MOD-STU-09` Difficulty Levels | Three levels × two locales = six reviewed renderings per screen. |
| `MOD-STU-10` Parts-Registry Authoring Seam | One writable field. The slice's only write into another surface. |
| `MOD-STU-11` Approval Workflow | The three-stage chain, reused by four other modules. |
| `MOD-STU-12` Versioning and Publication | The version number as the audit receipt. |
| `MOD-STU-13` Qualification Requirements | Two levels, three validation points, the only configurable gate on the platform. |
| `MOD-STU-14` The Offline Package | The manifest and the pinning contract. Not the delivery. |
| `MOD-STU-15` The Agent Builder | Capability enablement and reasoning-agent composition. Three open decisions gate it. |
| `MOD-STU-16` Memory and Two-Lane Learning | The Studio's memory write, the learning read view, the Lane-B proposal record. Not the decision. |
| `MOD-STU-17` Localisation | Per-locale authored variants and the publication-blocking completeness check. |
| `MOD-STU-18` Permissions and Roles | Gates all seventeen others. Built first. |

**Nothing on this surface is excluded.** What is bounded is how far each module reaches across a seam — §5.

---

## 2. The spine — twelve things built before any module screen

**S1 — `evaluateStudioAccess` is the only access entry point**, layered on slice 3's `evaluateAccess`. Its inputs are **role + grant + tier + object state + separation of duties**, and separation of duties is evaluated **by identity, never by role** (L33389, L34592): *"A user holding both the Supervisor and Quality Manager roles is still one person and still cannot occupy two stages."* The grant is a first-class input, not a role: *"authoring is a capability, not a sixth role"* (L34584). **Fail closed** (L34605): where the identity layer is unreachable the Studio *"permits nothing beyond published read"*; where a grant is revoked mid-session *"the session is not silently degraded"*.

**S2 — The three-stage chain is a service, not a screen.** `MOD-STU-11` owns it; `MOD-STU-07`, `MOD-STU-08`, `MOD-STU-09` and `MOD-STU-15` reuse it. *"one governance floor for everything that reaches the floor"* (L33320). One implementation, four consumers, and the covering test exercises it through **all four**, not one.

**S3 — Publish-time validation is a fail-closed gate set, not a warning set** (L48330). Eleven checks, each naming its blocking element: structural validity · a severity mapping on every screen that can deviate · a capture type inside the adopted seven · complete specification limits on every measurement screen · a curated coaching default per declared locale · locale completeness across every worker-facing element · every library pointer resolvable · every named certification still maintained · every capability dependency satisfiable · a recorded Severity 1 arming confirmation · a staffable chain. **Where a check cannot run, publication is blocked** (`FB-STU-09`, `AC-STU-149`).

**S4 — Screen states, with this surface's four departures.** The thirteen-state contract (L48007‑L48014) applies with L48330's departures. Two differ from slice 4: **`STATE-07` renders nowhere** (D22), and **`STATE-10`/`STATE-11` do apply** — on `SCR-STU-04` and `SCR-STU-13` — because this surface has three live artificial-intelligence touchpoints in the authoring path. Every matrix cell carries exactly one status token; a blank, ellipsis, dash or "same as above" is a build-blocking defect.

**S5 — The connectivity ruling (D4).** Content already loaded → `STATE-08` with a freshness marker. A read that fails outright → `STATE-12` naming what failed and whether anything was written. **Every write control → DISABLED with a named reason, never queued.** The editor additionally holds an explicit disconnected state with the local draft buffer and the plain statement that **no save has been recorded** (`AC-STU-009`). Reconnection → `STATE-13`, and **structural validation re-runs in full** before submission is re-enabled (L32152). **Nothing on this surface ever queues a write.**

**S6 — Audit in the same transaction, or the action did not happen.** `FB-STU-10` is *"the strictest contract in this chapter"* (L31220): *"an action that cannot be audited does not happen… **There is no first fallback that permits the action to proceed unaudited.**"* Terminal safe state: *"no version number is minted"*, and *"a version number is never re-used"*. The retry is bounded and idempotent, re-using the submission identifier. **The Studio keeps no log of its own** (L31481).

**S7 — The Tier-2 boundary is a refusal classification, not a hidden button.** *"Refused at the application programming interface layer, not merely hidden in the user interface"* (L31599), and *"if the audit write fails, the refusal is still enforced because refusing is the safe direction."*

**S8 — Configuration follows capability.** Enabling switches a surface on; disabling removes it and blocks publication with the dependent screens named. Two anti-data-loss rules: an unresolvable capability state **freezes sections read-only rather than hiding them** (L31597), and a changed input type marks now-irrelevant values **inactive rather than deleting them** (L32337).

**S9 — The pointer model and the propagation honesty rule.** Screens hold pointers, never copies (`AC-STU-071`). A failed picker never clears an existing pointer (`AC-STU-018`). An item cannot be archived while screens reference it, and they are named (`AC-STU-077`). And: *"a block edit reaches the floor only through a new published version and its adoption, and **no view suggests live propagation to a pinned package**"* (`AC-STU-070`).

**S10 — Never claim a device state.** The fifteen command states are the only adoption vocabulary. Four criteria: `AC-STU-023`, `AC-STU-112`, `AC-STU-118`, `AC-STU-028`. A device whose command state cannot be determined renders **unknown with its last known state and timestamp, never as adopted** (L33579).

**S11 — Support-not-surveillance, indirect but real.** The Studio holds no worker record, but `MOD-STU-16` writes **profile memory** and renders the **learning view**. *"Profile memory holds aggregates only under the personal-information redaction policy"* (L34322). Slice 4's standing data-model assertion carries forward unchanged: **no persisted table has a worker identifier as a grouping key for a behavioural measure.** The coaching-effectiveness panel groups by **asset**; the Lane-A signal is *"this asset, in this language, worked for this failure pattern on this screen"* (L34166) — asset, language, pattern, screen. Never worker.

**S12 — The derived count renders with its qualifier, everywhere.** Wherever the Studio's module count appears it carries *"derived count, not stated in the Statement of Work"* and links `DEC-STUDIO-001` (L14442, `TEST-ROLE-1023`).

---

## 3. The twenty-four decisions

Each was a conflict or a silence. None is resolved silently in code; each renders with its decision reference where a reviewer can see it. **Every one below is a client-delegated choice under APP-012, and every one keeps its alternative on screen.**

| # | Decision |
|---|---|
| **D1** | **Screen catalogue B (`SCR-STU-01`…`15`, L48259) is the route key.** Unlike slice 4's collision, the two catalogues share no token — there is no three-digit form — so they collide on **coverage**, not identity. B carries roles-that-can-open, module-and-feature and navigation entry point, has the Sign-in and permissions screens the surface needs, and `AC-SCR-STU-001` asserts all fifteen exist. A's three orphans become sub-views: `SCR-STU-LEARN` → a view of `SCR-STU-13`; `SCR-STU-PARTADD` → an inline panel of `SCR-STU-04`; `SCR-STU-DRAFTAI` → a state of `SCR-STU-11`. The nineteen one-off literals are recorded as uncatalogued storyboard names; **none becomes a route.** |
| **D2** | **The chapter-20 module matrices govern every cell, without exception.** Three coarser tables disagree with them — `MTX-TEN-02b`, §25.3, and the `SEQ-0xx` role-authority tables. The source's own reason decides it: the module template is *"identical for all eighteen so that a reader can compare modules directly and so that an omission is visible rather than invisible"* (L31513), and *"Every cell carries an explicit status"* (L34537). **§25.3's eight-row table is recorded as attributed-but-disputed** and is the single most dangerous restatement on the surface. |
| **D3** | **The Read-only Auditor renders `Client Decision Required` in every affected cell, and option (b) is staged behind the decision.** `DEC-AUDSTU-001` is open; L34524 is binding — *"Until decided, every Read-only Auditor cell in this chapter reads `Client Decision Required` rather than being guessed."* 47 cells across 15 matrices. **This is the slice's headline disclosure**, and the cost is stated on screen: an auditor cannot read an approval log or a diff without depending on the audited party to export one, which the source itself calls a weakening of the audit. |
| **D4** | **Connection loss splits four ways.** Loaded content → `STATE-08` with freshness. Failed read → `STATE-12` naming what failed and whether anything was written. Every write control → **DISABLED, named reason, never queued**. The editor → an explicit disconnected state with the local buffer and *"no save has been recorded"*. Reconnection → `STATE-13` with **full** structural re-validation before submission re-enables. This is the only reading that satisfies L48014, L48330 and L30842 together. |
| **D5** | **`Superseded` is the version state; `Outdated` is the per-Job adoption state.** `MOD-STU-12` uses both in one paragraph for two different things (L33479). `OBJ-037` (L8616) collapses them onto the version and is recorded as an **erratum**. Collapsing loses the distinction between *a newer version exists* and *this Job's update window lapsed* — which are separately notified (L33569). |
| **D6** | **A Workflow, as distinct from a version, has an Archived state.** Chapter 20 says yes and flags it as derived from §5.12.3; `OBJ-036` (L8598) omits it. Yes wins: `MOD-STU-03`'s own state machine draws it, and a Library with no archived filter cannot express *not linkable*. |
| **D7** | **`DEC-WFROLL-001` is canonical for the rollback question; `DEC-VERROLL-001` is its alias.** Two identifiers, one question, no cross-reference. The chapter-28 card is the one with options, a recommendation, a trade-off and an owner. **Both identifiers render**, so a client search on either finds the same card. |
| **D8** | **The package manifest asserts contents, not cardinality.** `AC-STU-120` says five classes; `AC-WF-AUT-009-01` and its test say six. One data structure quotes L33793‑L33797's five numbered classes verbatim; the six-way split is recorded as a second grouping of the same contents. The gate asserts what is present, so both criteria are satisfied and neither count is asserted as *the* count. |
| **D9** | **`Unavailable` on the connectivity axis is sense A → DISABLED with the condition named; on the role axis it is sense B → ABSENT.** `MOD-STU-18` row 23 settles the connectivity axis in a single row: seven columns `Unavailable — the Studio requires an active connection`, one column `Explicitly prohibited — no access at all`. Under D2 the role-axis `Unavailable` cells never render at all, because chapter 20 states them as `Explicitly prohibited`. **The slice-4 adjudication is inherited, not re-litigated.** |
| **D10** | **The four-digit `FEAT-STU-0101` catalogue (L47378) is the traceability key.** The only scheme covering all eighteen modules in one uniform table. The chapter scheme maps to it once, in one table, and the two are never mixed in a ticket. Same ruling and same reason as slice 4's D20. |
| **D11** | **The numeric `OBJ-036`…`OBJ-051`, `OBJ-066` register is canonical; the `OBJ-STU-*` mnemonics are labels.** `business-objects.json` carries the ninety-nine and zero mnemonics. **Three mnemonics have no numeric counterpart — `OBJ-STU-QUALREQ`, `OBJ-STU-CAPSTATE`, `OBJ-STU-LOCALE` — and are registered as a gap, not minted as new rows.** Minting three `OBJ-1xx` would inflate a closed ninety-nine. |
| **D12** | **The Atomic Capabilities view is built read-only with enablement DISABLED and `DEC-CAPAUTH-001` named.** All four tenant columns of the enablement row read `Client Decision Required`, so **nobody holds it** — and enablement decides which of the nine sections exist. Seeding the enablement state lets the nine sections render; building an operator would pre-empt the decision; omitting the view would hide the mechanism `AC-STU-006` and `AC-STU-008` require to be visible. |
| **D13** | **Agent Author delegation follows `MTX-TEN-02b`'s interim position: denied and named.** `DEC-DELEG-001` is **not in chapter 20's open-decisions table**, yet chapter 20 gives `MOD-STU-15` a whole column presuming delegation exists. §4.8.4 states plainly that *"Delegation is deferred beyond V1"*. `[Y21]`: *"Until decided, the build denies Supervisor access to the Agent Builder and names the decision."* |
| **D14** | **Lane-B follows the source's hybrid: the single decision suffices EXCEPT for a specification limit, a severity mapping or a gate rule, which route through the full chain.** `AC-STU-097` and `AC-STU-138` cannot both hold; this is the only reading under which both hold on disjoint value sets. **The classifier depends on `DEC-PKGFIELD-001`, which is open**, so it ships as a named interface over a seeded field map whose provenance renders. `AC-STU-104`/`AC-STU-143` bind both sides: **surface it, never implement it silently.** |
| **D15** | **Pinning semantics govern anything that ships in the package.** A library edit propagates in the Studio at once and reaches the floor at the next package build. The counter-argument is recorded and is not trivial: pinning *"delays a safety-motivated checklist improvement by up to one Run"*. |
| **D16** | **The package carries all three difficulty levels — the source's interim rule, not its recommendation.** They differ, and the interim rule wins because `AC-STU-090` requires it to be applied. The recommendation (assigned level plus standard as substitution fallback) renders as the alternative with its storage trade-off stated. |
| **D17** | **"Lightweight review" means the full three-stage chain with a scoped preview limited to the changed item.** The source's own recommendation and its own interim treatment. One separation-of-duties floor across all content that reaches the floor is the point of §5.18's non-widening rule. |
| **D18** | **A Lane-B proposal is decided by the Quality Manager and above only.** The Command Center's action set is closed at ten and slice 4 already built that closed set's authority column. The Supervisor-with-grant cell renders `Client Decision Required` under `DEC-LANEBAUTH-001`. |
| **D19** | **The capture types are the adopted `DEC-CAP-001` seven of §5.5.3.** Not open — adopted. The closed set is built from `AC-STU-065`'s own words and `TEST-WF-AUT-002-04` makes divergence a **build failure**. Both source readings render in the disclosure. |
| **D20** | **The seeded taxonomy catalogue ships empty; tenants create their own.** `DEC-TAX-002`'s adopted position. **The sixteen names are not invented and no fixture names one as canonical.** `DEC-TAXROLE-001` stays open; the custom-type control renders `Client Decision Required` with the Tenant Admin reading recommended. |
| **D21** | **Module identity cards govern object state vocabularies — but three lost states are modelled as flags, not discarded.** Same ruling and same reason as slice 4's D21: state names are `Derived Clarification`, behaviours are `SoW Fact`. The three that are operationally distinct: **`Quarantined`** on a package (the state that stops a bad package reaching a device), **`Stalled`** on a submission (the only state that makes `DEC-RELAUTH-001`'s deadlock visible), **`Distributable`** on a version (the state that separates *a version exists* from *a version is safe to run*). |
| **D22** | **`STATE-07` renders nowhere on `SURF-STU`, and a gate asserts its absence.** L48330 is decisive; no source disagrees on this specific point. D4 supplies what replaces it. |
| **D23** | **Build the Severity 1 arming disclosure against §5.5.8, Section 7, and record the off-by-one.** `DEC-STUXREF-001`: §5.2.2 cites §5.5.9, which is Tool and Equipment. *"downstream requirement traceability keyed on the cited section number would point at the wrong configuration section."* |
| **D24** | **`Expired` applies to `GRANT-STU-IMPL` because §5.11.4 requires revocation at onboarding's end; the other two grants render `Client Decision Required` under `DEC-TENGRANT-001`.** Raised outside chapter 20 and absent from its table. |

---

## 4. Vocabularies — closed sets, each with a real exhaustiveness check

Every one below ships as `as const satisfies readonly T[]` with a compile-time exhaustive switch that fails to type-check when a member is added or removed. **A closed set with no exhaustiveness check is a list.**

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
| Command states | the fifteen, shared from slice 3 | L31181 |
| Permission tokens | the nine, shared from slice 2a | slice-4 D8 |

**Two counts that must never be minted.** There is no eighth capture type and no third inheritable default. Both are guarded by a gate that plants one.

---

## 5. Cross-slice seams — named, never inline

Each ships as a named interface with a seeded fixture and a handover entry. **Where the counterpart is unscheduled, the absence is declared.**

| seam | consumer | owner | status |
|---|---|---|---|
| Grant assignment and revocation | `MOD-STU-18` | `MOD-DOH-09`, tenant administration area | **built, slice 4** — consumption |
| Worker certification list | `MOD-STU-13` | `MOD-DOH-04` | **built, slice 4** — and lands on slice 4's D22 certification-type fixture |
| Worker-profile difficulty field | `MOD-STU-09` | `MOD-DOH-04` | **built, slice 4** — an additive fixture field, not a new module |
| Gate posture and clearance duration | `MOD-STU-13` | slice 4 floor register | **built, slice 4** |
| Shift timing for the handoff schedule | `MOD-STU-02` | `MOD-DOH-03` | **built, slice 4** |
| Tenant suspension state | `MOD-STU-10` | `MOD-DOH-01` | **built, slice 4** |
| Capability registry, entitlement, tier | `MOD-STU-01`, `MOD-STU-15` | `MOD-SA-02`/`MOD-SA-11` | **built, slice 3** |
| Global severity catalog | `MOD-STU-05`, `MOD-STU-14` | `MOD-SA-07` | **built, slice 3** |
| Evaluation harness | `MOD-STU-15` | `MOD-SA-05` | **built, slice 3** |
| Job and Run linkage counts | `MOD-STU-03`, `MOD-STU-12` | `MOD-DOH-05`/`06` | slice 6 |
| Job Owner and the adoption decision | `MOD-STU-12` | `MOD-DOH-05` | slice 6 |
| Package build trigger and the pin | `MOD-STU-14` | `MOD-DOH-06` | slice 6 |
| Qualification validation at assignment | `MOD-STU-13` | `MOD-DOH-07` | slice 6 |
| Frontline Training Library Viewer | `MOD-STU-08` | `MOD-FL-B12` | slice 7 |
| Package delivery and on-device evaluation | `MOD-STU-14` | Frontline | slices 7, 8 |
| Qualification clearance, action ten | `MOD-STU-13` | `MOD-CC-13` | slice 9 — **aligns with slice 4's D23** |
| Lane-B decision | `MOD-STU-16` | `MOD-CC-06`/`13` | slice 9 |
| Escalation delivery and role→person | `MOD-STU-07` | `MOD-DOH-10` | slice 10 |
| The tenant audit log | every write | `MOD-DOH-17`/`18` | slice 10 — **read-through over a seeded fixture, the same pattern as slice 4's D14** |
| Composed-agent platform review | `MOD-STU-15` | `SURF-SA` | slice 12 |

**Five unregistered dependencies, each declared rather than guessed:**

1. **`MOD-DOH-19` Parts Registry** — registered, **excluded from slice 4, named in no later slice's stated scope**. `MOD-STU-10` depends on it entirely. The seam's fixture returns a **confirmed** or **unconfirmed** outcome and **the unconfirmed path is the one the gate exercises**, because `AC-STU-096` forbids attaching a reference before the registry confirms creation.
2. **The severity action bundle editor** — owner stated only as *"the tenant administration area"*; `OBJ-049` exists with no owning module.
3. **The tag-to-qualification-set mapping** — no module owns it in any card read.
4. **The composed-agent platform review queue** — named at L67927; no `MOD-SA-*` identifier.
5. **The multimodal embedding service** — external. The index is a seeded fixture with an explicit **not indexed** state; `AC-STU-072` (*"indexing never changes approval state"*) is what makes the simulation honest.

**The Studio owns five seams for later slices:** the package manifest (7, 8), agent operating parameters (11), threshold context (9), escalation routing rules (10), procedural and semantic memory writes (11).

---

## 6. What this slice does NOT build

Package **delivery** to a device, on-device evaluation, offline execution, reconnect (7, 8). The **pin act** — `WF-AUT-010`'s surface is the Hub, `MOD-DOH-06` (6). The Lane-B **decision** (9). Clearance **granting** (9). Escalation **delivery** (10). The audit **store** (10). The parts registry itself. A severity-level definition anywhere. A practice mode — *"cut from scope… no practice-mode behaviour is designed, proposed, or implied"* (L32802). An action-agent composer. A capability author. A second audit log. A locale-pack manager. A worker-facing Studio screen of any kind.

---

## 7. Testing

Every decision in §3 is a test. Every gate proven able to fail **by planting a violation on the axis the gate is for**, then restoring it. **Gates read the built artefact wherever the claim is about what renders**, and **per-module gates enumerate their files from the directory, never from a hardcoded list.**

**Slice-5 gates:**

1. **No bare Studio module count** anywhere in the built tree without its `Derived Clarification` qualifier and `DEC-STUDIO-001` (S12, `AC-STU-014`, guards R18).
2. **The closed vocabularies are exhaustive** — capture types exactly seven plus none, Workflow settings exactly four, inheritable defaults exactly two, sections exactly nine. Each plants an extra member and proves the type-check red (D19, guards R3, R5).
3. **No Read-only Auditor cell on `SURF-STU` resolves to a permission status** (D3, `AC-STU-157`, guards R2).
4. **`STATE-07` renders nowhere on `SURF-STU`; no write control is ever queued** (D22, D4, guards R20).
5. **The sequence-detection reference is the drawn order** — one structure, no second authoring path (`AC-STU-056`, guards R4).
6. **Publication is blocked by each of the eleven S3 checks, individually**, each naming its blocking element; the gate plants one violation per check (S3, guards R6, R13).
7. **Separation of duties is evaluated by identity** — a fixture persona holding both Supervisor and Quality Manager is refused the second stage (`AC-STU-100`, guards R8).
8. **Every write goes through the audit path, after its own domain refusals and before its mutation**, and the covering test **mutates something observable before the audit fails** (S6, guards R7).
9. **No Studio view claims a device state, a delivered escalation, or an effective clearance** (S10, guards R1, R9).
10. **The superseded offline-severity description appears nowhere** in the built tree (`AC-STU-030`, `AC-STU-126`, guards R10).
11. **Draft visibility is enforced in the read, not the render** — the selector is asserted, and `SCR-STU-03`'s draft and published routes are separate reads (`AC-STU-048`, guards R14, R15).
12. **A block cannot be referenced from another Workflow** at the service layer (`AC-STU-066`, guards R11).
13. **The Studio holds one audit store, and it is the Hub's** (L31481, guards R12).
14. **Every cross-surface statement is not a control** — no Studio route offers the package build, the clearance grant, the profile field, the rebase, or the action bundle (guards R22).
15. **Every cross-slice seam is a named interface with a fixture**, and `MOD-STU-10`'s fixture exercises the **unconfirmed** hand-off (guards R21).
16. **No persisted table or fixture has a worker identifier as a grouping key for a behavioural measure** — carried forward from slice 4 unchanged (S11, guards the support-not-surveillance floor).

---

## 8. Task breakdown — nineteen tasks in six file-disjoint waves

**Wave boundaries are file boundaries.** No two tasks in a wave touch the same path. Each task's path list is diffed against every running agent before dispatch, per RESUME §6a.

### Wave 1 — the floor (3 tasks, fully parallel)

| task | scope | paths |
|---|---|---|
| **T1** | S1 `evaluateStudioAccess`, the grant model, identity-based distinctness, fail-closed. S7 refusal classification. | `src/studio/access/**`, `tests/unit/stu-access.test.ts` |
| **T2** | S4/S5/D4/D22 the Studio state model and connectivity ruling; S10 the adoption renderer over slice 3's command ladder. | `src/studio/state/**`, `tests/unit/stu-state.test.ts` |
| **T3** | All nineteen closed vocabularies with exhaustiveness checks (§4); the `DEC-*` disclosure component carrying both readings and a locator. | `src/studio/vocab/**`, `src/studio/disclosure/**`, `tests/unit/stu-vocab.test.ts` |

### Wave 2 — governance before content (3 tasks, fully parallel)

| task | scope | paths |
|---|---|---|
| **T4** | `MOD-STU-18` — the consolidated matrix, both grant types, `SCR-STU-15`, `SCR-STU-01`. D3, D13, D24. | `src/studio/modules/stu-18/**`, `app/studio/permissions/**`, `app/studio/sign-in/**` |
| **T5** | `MOD-STU-11` — the chain as a service, `SCR-STU-11`, the preview shell, the staffability check, `Stalled`. D17 reuse contract. Diff engine stubbed. | `src/studio/modules/stu-11/**`, `app/studio/approvals/**` |
| **T6** | `MOD-STU-01` — the Tier-2 boundary, the Atomic Capabilities view read-only, D12. S8 surface gating. | `src/studio/modules/stu-01/**`, `app/studio/capabilities/**` |

### Wave 3 — the record and its history (3 tasks, fully parallel)

| task | scope | paths |
|---|---|---|
| **T7** | `MOD-STU-03` — `OBJ-STU-WORKFLOW`, `SCR-STU-02` the landing view, the taxonomy, D6, D20, the never-zero linkage rule. | `src/studio/modules/stu-03/**`, `app/studio/library/**` |
| **T8** | `MOD-STU-12` — versioning, diff, linkage, archival, export, `SCR-STU-12`. D5, D7. Closes T5's diff stub. | `src/studio/modules/stu-12/**`, `app/studio/versions/**` |
| **T9** | `MOD-STU-07` — three libraries, the pointer model, `SCR-STU-06/07/08`. D15, D17, `DEC-EMBED-001`. | `src/studio/modules/stu-07/**`, `app/studio/libraries/**` |

### Wave 4 — the authoring surface (4 tasks, fully parallel)

| task | scope | paths |
|---|---|---|
| **T10** | **`MOD-STU-04` — the exemplar.** Four settings, two defaults, the canvas, branching, gate-failure default, structural validation, `SCR-STU-03`. | `src/studio/modules/stu-04/**`, `app/studio/builder/**` |
| **T11** | `MOD-STU-05` — the nine sections, `SCR-STU-04`, the arming confirmation (D23), five publication blockers. D19. | `src/studio/modules/stu-05/**`, `app/studio/screen-config/**` |
| **T12** | `MOD-STU-06` + `MOD-STU-09` — blocks and difficulty levels, `SCR-STU-05`, the six-rendering coverage strip. D16 interim rule. | `src/studio/modules/stu-06/**`, `src/studio/modules/stu-09/**`, `app/studio/blocks/**` |
| **T13** | `MOD-STU-17` — localisation, `SCR-STU-14`, the per-locale blocking check, fail-closed. | `src/studio/modules/stu-17/**`, `app/studio/localisation/**` |

**T10 and T11 are the two largest tasks in the slice and share no path.** T11 consumes T10's screen list through the module registry, not through a shared file.

### Wave 5 — qualification, package, training, parts (4 tasks, fully parallel)

| task | scope | paths |
|---|---|---|
| **T14** | `MOD-STU-13` — two levels, three validation points, `SCR-STU-10`, the stricter-posture default. | `src/studio/modules/stu-13/**`, `app/studio/qualifications/**` |
| **T15** | `MOD-STU-14` — the manifest (D8), the integrity check, `Quarantined`, the pinning contract, `SB-STU-17`. | `src/studio/modules/stu-14/**`, `app/studio/package/**` |
| **T16** | `MOD-STU-08` — the Training Library, `SCR-STU-09`, the exclusion guarantee. | `src/studio/modules/stu-08/**`, `app/studio/training/**` |
| **T17** | `MOD-STU-10` — the seam, `SCR-STU-PARTADD` as an inline panel, the unconfirmed path, the unregistered-owner declaration. | `src/studio/modules/stu-10/**`, `src/studio/seams/parts/**` |

### Wave 6 — agents, learning, gates, verification (5 tasks)

| task | scope | paths |
|---|---|---|
| **T18** | `MOD-STU-02` + `MOD-STU-15` — agent configuration and the Agent Builder, `SCR-STU-13`. D12, D13. | `src/studio/modules/stu-02/**`, `src/studio/modules/stu-15/**`, `app/studio/agents/**` |
| **T19** | `MOD-STU-16` — memory writes, the learning read view, the Lane-B proposal record. D14, D18, S11. | `src/studio/modules/stu-16/**`, `app/studio/learning/**` |
| **T20** | The sixteen slice-5 gates (§7), each planting its own defect and proving it red; per-module gates enumerate from the directory. | `tests/coverage/slice-05-*.test.ts` |
| **T21** | Registry closure — register the forty-one Studio notifications as derived rows with card locators (R19); register the three object gaps (D11); map both feature schemes once (D10). | `registries/generated/**`, `scripts/**` |
| **T22** | Verification — all four suites plus lint and build; the coverage delta measured from the regenerated registries, not quoted. | — |

**T18 and T19 run after T20's gate scaffolding exists** only if T20 lands first; otherwise all five are parallel except T22, which is last and alone.

---

## 9. What slice 4 learned, baked in here from the start

- Every screen sentence pointing at content elsewhere has a test that **fails when its target is removed** — not one that iterates an array (gate 6, R13).
- **Scope is enforced in what a screen reads, not what it draws** — and on this surface the scope dimension is draft visibility (gate 11, R14, R15).
- Every write goes through the audit path **after its own domain refusals and before its mutation**, and the covering test **mutates something observable before the audit fails** (gate 8, R7).
- Per-module gates **enumerate their files from the directory**, never a hardcoded list (T20).
- **A gate that cannot fail is worse than no gate**: every one of the sixteen plants its own defect and proves it red.
- Closed vocabularies use `as const satisfies readonly T[]` with a **real** exhaustiveness check (§4, gate 2).
- **Briefs are not the source.** Every dispatch states that the census's quotation is a convenience and the frozen source at the cited line is the authority. **This slice's matrices were transcribed cell by cell at named line spans for exactly that reason** — and §25.3's eight-row table is flagged in the census as the one an implementer will be most tempted to trust.
- **Fix once, where all callers route.** Count the call sites before and after; put both counts in the report.

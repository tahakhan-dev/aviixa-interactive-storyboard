# Slice 4 — Tenant Setup (SURF-DOH, the Hub's setup half): Design Specification

**Status:** APPROVED (client delegated the design decision, 2026-08-19: *"complete the slice 4 … production level implementation"*, and 2026-08-17: *"pick by yourself what suited for the business"*)
**Builds on:** Slice 3, Candidate `e109bc8d4f7c384e`, merged to `main`, 1936 tests, `pnpm verify` exit 0
**Census:** `docs/census/2026-08-19-surf-doh-slice04-build-map.md` — 9 agents, 27 decisions, 11 risks
**Frozen source:** sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27` (no drift across five slices)

---

## 1. Scope — eight modules, and the line drawn from the source

The Hub is nineteen modules split across three slices. Slice 4 takes the **setup half**:

| module | why it is in slice 4 |
|---|---|
| `MOD-DOH-01` Tenant Lifecycle and Tier Operations | "Gates the write classes of every other module" (L26877). Nothing else is testable without it. |
| `MOD-DOH-02` Location Configuration | Owns `OBJ-DOH-SITE/AREA/CELL`. Two slice-4 modules name it a hard dependency (L28503, L27451). |
| `MOD-DOH-03` Shift Management | Owns `OBJ-DOH-SHIFT`. `MOD-DOH-04` needs it for on-shift roster resolution (L27451). |
| `MOD-DOH-04` Worker Lifecycle and Qualifications | Owns `OBJ-DOH-WORKER/QUAL/CLEAR`. Workers and qualifications, both named in the boundary. |
| `MOD-DOH-09` Permissions, Roles and Access | Owns `OBJ-DOH-USER` — the **only** module that creates tenant user accounts, so "users" resolves here and nowhere else. |
| `MOD-DOH-12` Integration Surface | **Narrowly: `FEAT-DOH-1201` single sign-on only.** Slice 4 cannot sign a user in without the connection record (L28503, L48095). |
| `MOD-DOH-13` Tenant View of Platform Administration | Its three card features, plus the chrome. See D5 — its card and the workflow catalogue disagree by a factor of three. |
| `MOD-DOH-14` Qualification Calendar | A read-only 60-day projection over data slice 4 already owns. No edge outside the slice (L29326). |

**Explicitly excluded, with the reason recorded so name-matching cannot pull them back in:**
`05`, `06`, `07`, `08`, `15`, `16`, `18` → slice 6. `10`, `11` → slice 10. `17` — every enforcement
target is slice 6 or 10, so slice 4 has nothing to enforce (L29736). `19` Parts Registry — tenant
master data, but not tenant setup, users, Workers, qualifications or devices; nothing in slice 4
reads `OBJ-DOH-PART`.

Two rows that **look** like slice 4 and are not (R11): the `SCR-DOH-ONBOARD-MAP` worksheet
(L18024) is classified *Recommendation — Research and Development* while every sibling row is SoW
Fact; the L99408 row renames `MOD-DOH-03` a "digest module" with a purpose belonging to
`MOD-DOH-10`. Neither is built.

---

## 2. The spine — ten things built before any module screen

**S1 — `evaluateAccess` is the only access-control entry point.** The source models **nine
intersecting access conditions** (L14512), enumerated in this order:

1. role permission · 2. assigned scope · 3. tenant entitlement · 4. object state ·
5. qualification · 6. active grant · 7. device and connectivity state ·
8. segregation of duties · 9. safety controls

**Two precedence rules sit ABOVE the intersection and are not negotiable** (L14512):

- **Explicit deny wins.** Where any condition produces an explicit deny, the request is refused
  regardless of how many conditions produced an allow. This matters most for multi-role identities.
- **Safety controls win.** Where a safety control conflicts with any other condition — *including a
  root-level allow* — the safety control decides.

> **Corrected before implementation.** The census cited L14531 [cited-in-error: L14531] for a
> "safety-first evaluation order"; that line is the request-arrival step, and no such reordered
> list exists. Safety controls are condition NINE in the enumeration and win by PRECEDENCE, not
> by position. Encoding a safety-first array would have shipped a made-up ordering into eight
> modules, and `SCR-DOH-ROLE-04` would have rendered it to a reviewer as if the source said so.
>
> **This ruling is DISPUTED and is not settled here.** Reading the frozen source for the
> correction-quoting rule found that a safety-first evaluation ordering DOES exist: §"Numbered
> workflow — one access decision, end to end" (L14529) runs the request arriving at L14531 and
> then evaluates safety controls FIRST at L14532, role permission at L14533, assigned scope
> L14534, tenant entitlement L14535, object state L14536, qualification L14537, active grants
> L14538, device and connectivity L14539, segregation of duties L14540 — the census map's nine,
> in the census map's order. The DEFINITION order at L14514–L14522 does place safety ninth, so
> the source states both and this ruling followed only one of them. Only the LOCATOR the census
> map used was wrong. Whether eight modules built on this ruling change is a design decision and
> belongs to the controller; it is recorded here rather than reversed in a citation task.
>
> **SETTLED, 2026-08-21. The ruling above is amended, not withdrawn — the record shows what was
> believed and why it changed.** Both structures were read in full against the frozen source at
> `47bd18db…`. What each says:
>
> - **The definition enumeration, L14514–L14522** — nine conditions, role permission first
>   (L14514), safety controls ninth (L14522): *"The specification gates and the evaluation gate
>   admit no override from any surface or any role"*. The original correction is RIGHT about this
>   list, and it is not re-sorted. It is `ACCESS_CONDITIONS` and it is the screen's Order column.
> - **The numbered workflow, L14529–L14541** — *"Numbered workflow — one access decision, end to
>   end."* Step 1 (L14531) is the request arriving. Step 2 (L14532) is *"Safety controls are
>   evaluated first. A request that would override a specification gate or the evaluation gate,
>   or that would breach a platform invariant, is refused immediately and recorded as a safety
>   refusal."* Steps 3–10 run role permission, assigned scope, tenant entitlement, object state,
>   qualification, active grants, device and connectivity, segregation of duties. The diagram's
>   own reading at L14567 is *"Safety is evaluated first so that no other condition can be
>   arranged to bypass it."* The original correction is WRONG that no such list exists. It is
>   `EVALUATION_ORDER` and it is the screen's new Evaluated column.
>
> **Why it was not behaviourally inert.** Precedence and position give the same allow/deny answer.
> They do not give the same REFUSAL REASON, and L14532's last clause — *"recorded as a safety
> refusal"* — is a claim about the reason, as L14534's *"must not disclose the existence of the
> out-of-scope object"* is a claim about the message. Measured, not argued: MOD-DOH-09 encoded its
> one safety control as `deniedRoles: <every tenant role>`, so the "Removing the last Tenant
> Admin" refusal returned `EXPLICIT_DENY` at stage `BASE_ROLE`, and `SCR-DOH-ROLE-04` rendered
> *"An explicit denial applies to this role, and an explicit denial always wins"* under a heading
> that said Safety controls — the wrong one of the two precedence rules the source states
> separately at L14526 and L14527. The same request naming another tenant's record returned
> `TENANT_MISMATCH`, because the old encoding sat behind tenant isolation rather than in front of
> everything.
>
> **What changed.** `evaluateAccess` gained a `safetyControl` field and a `SAFETY_CONTROLS` stage
> evaluated immediately after the request-arrival check, with its own `SAFETY_CONTROL` reason
> code; MOD-DOH-09's fixture declares it instead of `deniedRoles`; `SCR-DOH-ROLE-04` renders both
> orders side by side and no longer tells a reader that no safety-first ordering exists. Gate 7 in
> `tests/coverage/slice-04-gates.test.ts` parses the workflow order out of the frozen source at run
> time and fails if a safety-breaching request comes back with any non-safety reason.
>
> **What did NOT change, deliberately.** Tenant isolation, entitlement, object state and the rest
> keep their existing relative order. The source's step 4 names *"the object's Site and Area"* and
> says nothing about re-ordering the cross-tenant guard, and encoding an order the source does not
> state is the error the original correction existed to prevent.

`SCR-DOH-ROLE-04` renders which of the nine conditions failed **and who can change that
condition**, and never reveals the existence of records outside the caller's scope (L14267).

Deny-by-default is a gate: *"an undefined permission is a refusal, never a grant"* (L14476);
`AC-DOH-09-9` adds that a rule which cannot be evaluated is treated as violated.

**S2 — The tenant state gate.** Read on every request and applied **before any write control
renders** (L27002). The write-class table is stated "exactly" and is **encoded as data, one table**
— not scattered conditionals (R4). Soft blocks new Jobs, Workers, locations, shifts, parts and all
configuration edits, while **recertification of existing workers stays open** (L26919). Hard is
read-only except the enumerated completion pipeline (L26920). Compliance blocks all logins
immediately (L26921). Where state cannot be determined, **the stricter interpretation applies**
(L26547).

**S3 — Hub chrome: a three-slot banner region and nothing more.** A closed set of three at V1
(L26047): suspension · support session with End-session · platform announcement. Plus the module
rail, which is shared and owned by no module (L48096).

**S4 — Screen states, with this surface's departures.** `STATE-10` and `STATE-11` never apply here.
`STATE-07` resolves per D7. `STATE-09` applies only where a device command exists. Every matrix
cell carries exactly one status token — a blank, ellipsis, dash or "same as above" is a
build-blocking defect (`AC-DOC-006` L856, `AC-RBAC-001` L20781).

**S5 — Scope: Tenant, Site, Area, and only those.** Three orthogonal dimensions held
simultaneously; a scope **narrows** a role and never widens it (L17470). Cell, Job and worker
scoping are deferred beyond V1 and render **ABSENT, not disabled** (L14515, L23918). Scopes do not
merge across grants (`AC-16-02`, L20046).

**S6 — Audit in the same transaction, or the action did not happen.** *"An action that cannot be
audited does not happen. A partial write is never visible. A write is never queued client-side"*
(L26547). Where the failure is an audit-write failure, the screen states **that the action did not
happen** (L48018).

**S7 — The tenant-configuration floor.** A tenant configures itself **stricter than a default and
never looser**, and the registry rejects a looser value **at the write, with the bound stated**
(L20841, `DNC-22`). Gate posture may never go below notify-only (L27425); the 14/7/1/0 warning
ladder may gain earlier stages, never later (L106864).

**S8 — Access resolution stages.** `Unauthenticated → SsoTrack | ManagedTrack → ScopeResolved →
TenantStateApplied → HubRendered` (L25667). This is the prototype's boot order.

**S9 — The fifteen device command states**, already shared from slice 3. An accepted action renders
in its true command state and **never as done** (L48015). Two places in slice 4: the clearance
record and the device retire/wipe request.

**S10 — Support-not-surveillance, and here the hazard is DIRECT.** The Worker record lives on this
surface. No worker-facing pace figure, timer against expectation, or comparison to others *"in any
module, any state, any release of this scope"* (L2002, `AC-GOAL-030`). Oversight is exception-led,
never a per-worker wall (L2004).

> Two register entries bite directly. **M-A4 qualification state**: individual-level measurement is
> *legitimately allowed* — qualification is a property of a person and a safety control — but using
> **expiry frequency as a performance measure** is the named prohibited use (`AC-SCHED-253`).
> **M-A5 clearance frequency**: individual-level is **Explicitly prohibited**; the data is cut **by
> role and by Area, never by worker** (`AC-SCHED-254`), because *"frequent clearances usually
> indicate a certification-planning failure, not a worker failure"* (L101536). The second-clearance
> escalation keys on **(Area, Shift), never (Worker)** (L27434).
>
> **The regression test is a data-model assertion, not a review habit: no persisted table has a
> worker identifier as a grouping key for a behavioural measure** (L101581).

---

## 3. The twenty-seven decisions

Each was a conflict or a silence. None is resolved silently in code; each renders with its decision
reference where a reviewer can see it.

| # | Decision |
|---|---|
| **D1** | **Screen catalogue B (`SCR-DOH-01`…`23`, L48095) is canonical.** Two catalogues collide: `SCR-DOH-23` is the tenant administration area, `SCR-DOH-023` is Platform Access History. B carries roles-that-can-open, module-and-feature and navigation entry point — three fields the prototype needs. **The three-digit form is forbidden anywhere in the codebase** (gated). |
| **D2** | **The tenant administration area is ownerless.** It is a screen *group*, not a surface (`AC-PROD-040`), and catalogue A's own answer is "and cross-module". Registered as `SCR-DOH-23`; each module owns its own section. No fictional ownership is minted. |
| **D3** | **Tenant device enrolment is built, behind one named feature flag defaulting to enabled.** `DEC-DEVOWN-001` is open. Three acceptance criteria and `MOD-SA-13`'s own role matrix (which prohibits all four platform roles from enrolling) say yes, against two storyboard strings. The flag is named in the plan; it is not a silent default. |
| **D4** | **The device screen keeps the literal `SCR-DOH-DEVICES`, marked uncatalogued.** It occurs exactly once in the frozen source (L67861) and appears in neither catalogue. Minting `SCR-DOH-24` would invent a catalogue row. |
| **D5** | **`MOD-DOH-13`'s card wins over the workflow catalogue.** The card is internally consistent with its own scope gate — *"the Hub shows the tenant its own position, read-only — nothing more"* (L29172) — and a read-only module cannot own device enrolment. The catalogue rows are recorded as attributed-but-disputed. |
| **D6** | **Shift-to-Area is many-to-many with no overlap on the same Area; cardinality otherwise deferred.** `DEC-SHIFT-001` is open and *blocking* — but `AC-51-13` already asserts this option's overlap refusal as a criterion with a verifying test, and §19.5 silently adopts many-Areas throughout. Ship the mitigation the source already wrote (L116590). |
| **D7** | **Connection loss splits three ways.** Content already loaded → `STATE-08` with the freshness marker and as-of time. A read that fails outright → `STATE-12`, naming what failed and whether anything was written. Every write control → **DISABLED with a named reason, never queued**. Reconnection → `STATE-13`, refetching tenant state *before* re-enabling any write. The never-queue half has the best sentence in the chapter behind it: *"a queued clearance would be a safety control with no audit entry"* (L27568). |
| **D8** | **Nine permission tokens, not six.** The six-token set cannot express `Client Decision Required`, which `AC-RBAC-602` requires to exist at runtime. Already the closed set shipped in slice 2a. |
| **D9** | **A Tenant Admin may enter a qualification and record a recertification.** The `MOD-DOH-04` matrix (L27466) gives all five columns and says `Allowed`. **One census reader claimed the matrix has no Tenant Admin row; that is false.** L33638 dissents alone and is recorded as an erratum. |
| **D10** | **A Tenant Admin may NOT grant a clearance** — `Explicitly prohibited` on all three rows (L27472). Rendered **DISABLED with the reason, not absent**, because the controls exist on the same screen for the Supervisor and Quality Manager, and `FB-QUAL-005` says the disabled control teaches the rule at the moment it binds. The most privileged tenant role sits deliberately outside the safety-exception path. |
| **D11** | **The Worker gets no Hub screen.** `DEC-WKRVIEW-001` is open; the source names the stake plainly — it *"changes the login model's surface area, the training burden, and the attack surface"* (L23067). Worker renders `Unavailable` throughout; workers meet their own certification alerts on the device. **The cost is stated on screen:** a worker without a device in hand cannot check their own expiry. |
| **D12** | **Any signed-in tenant web user may press End-session** — Tenant Admin `Allowed`, the other three `Allowed with conditions`, *"because the control belongs to the tenant"* (L29199; the matrix header is L29195). L21449, which grants the platform-side Support role the tenant's own control, is excluded. |
| **D13** | **Banner on all three access classes; End-session on the support session only.** *"An emergency access the tenant could terminate would not be an emergency access"* (L64810). The compliance-emergency class carries the automatic post-session report instead, and the control to suppress that report does not exist. |
| **D14** | **Platform Access History is a read-through view over a seeded audit fixture, with the slice-10 dependency declared.** `AC-SA-18-06` requires it to read *the same audit records* — one audit truth per tenant. Building a second store to make slice 4 self-contained is the defect, and it would stay invisible until slice 10 tried to reconcile. |
| **D15** | **A tier upgrade is BLOCKED under soft suspension**, banner naming the reason and routing to platform support. Soft's default trigger is 30 days of non-payment; letting a non-paying tenant self-service a higher ceiling is the riskier default, and L26547 instructs the stricter reading where tenant-state governance is ambiguous. **The counter-argument is recorded — this is a coin-flip the client should settle.** |
| **D16** | **Recertification is BLOCKED under hard suspension.** The hard list is stated "exactly" and does not name it. **Flagged to the client as the single most operationally dangerous silence in the slice:** a certification expiring during a 60-day hard suspension then has no renewal path at all, only substitution, which can strand a line. |
| **D17** | **The compliance-suspension worker message is the Part IV three-sentence form**: *"Operation suspended. Contact your supervisor. Your work has been saved."* The short form drops the only actionable instruction, and `AC-CMD-007` forbids rewording, so the two cannot be reconciled by paraphrase. |
| **D18** | **The support banner says "workspace", not "tenant"** — the form carried by the hard gate (L23801). Same no-reword constraint. |
| **D19** | **Five operating tenant states in the Hub; `pilot` is an orthogonal flag; `draft` and `awaiting_administrator` are SURF-SA's and never render here.** §4.2.5 says a pilot tenant is *"functionally identical to a paying tenant"* — that is a flag, not a state. In draft *"no user can authenticate"*, so no Hub screen can exist to render it. |
| **D20** | **The four-digit feature catalogue (`FEAT-DOH-0101`…, L47222) is the traceability key** — the only scheme covering all nineteen modules in one table. Mapped to the chapter scheme once, in one table, never mixed in a ticket. |
| **D21** | **Module identity cards govern object state vocabularies** — state names are classified *Derived Clarification* (renameable) while the behaviours are SoW Fact. **But three lost states are modelled as flags on `active`, not discarded:** `scope-pending` (excludes a Site from role-assignment pickers), `Unbound` (blocks Job creation), `Archiving` (holds the cascade). |
| **D22** | **Certification types are a seeded fixture list with no CRUD screen, raised as a client blocker.** Total silence: no line states who creates one, on which screen, under which module, or whether the platform seeds any. Inventing an admin screen would be the largest invented feature in the slice. |
| **D23** | **The Hub builds the clearance REGISTER, read-only, and no grant control.** Granting is Client Command Center action 10; catalogue A is decisive — *"read-only in the Hub; granting is a Client Command Center action"* (L26059). The three grant rows describe authority the Hub *renders* and the Command Center *exercises*. |
| **D24** | **Calendar roles come from the `MOD-DOH-14` matrix (L29343)**, over seven conflicting restatements — including ones omitting the Quality Manager entirely. QM `Allowed` tenant-wide; TA and Auditor read-only; Supervisor read-only filtered to own Area; Worker `Unavailable`. |
| **D25** | **Site is mandatory; a default Site is auto-created at provisioning and is renameable.** The adopted position of `DEC-SITE-001`, and `AC-51-12` requires the default Site to exist *before any Tenant Admin signs in*. The Site-optional path stays reachable **by configuration rather than by code change**, per L61533. |
| **D26** | **Slice 4 builds on-shift roster resolution and the marked-fallback flag, and builds no delivery** — delivery is `MOD-DOH-10`, slice 10. `DEC-NOSHIFT-001`'s hole — the fallback target is a *role* which may itself be empty, exactly where a Severity 1 needs a decider — is a client decision, not an engineering one. `RISK-019` is the one register entry where residual risk equals inherent. |
| **D27** | **`DEC-DEVLOST-001` is read as acceptance-blocking, not design-blocking.** Mark-lost ships as **a state plus a request record only**; L103830 already states the control *"wipes nothing itself"*, and nothing in the missing lost/stolen classification changes the shape of a request record. |

---

## 4. Dependency order

The source's own dependency rows contain a genuine cycle — `09` needs `02` for scope values, `02`
needs `01` for tenant state. **It breaks cleanly by shipping `MOD-DOH-09` in two passes.**

1. Spine S1, S4, S5, S8 — the floor; nothing renders first.
2. `MOD-DOH-01`, **state machine only**. Worker-Shift meter stubbed (its inputs are slice 6).
3. `MOD-DOH-09` **pass one — Tenant scope only**. Needs no location tree.
4. `MOD-DOH-12`, `FEAT-DOH-1201` only. Two-track sign-in needs the connection record.
5. `MOD-DOH-02`. The default Site fixture seeds *before* its own screen (`AC-51-12`).
6. `MOD-DOH-09` **pass two — enable Site and Area scope**. This is why the cycle is not real.
7. `MOD-DOH-03`. A Shift cannot inherit a timezone from a Site that does not exist.
8. `MOD-DOH-04`. Needs Area scope, on-shift roster resolution, and the user account link.
9. `MOD-DOH-14`. A pure projection over what step 8 owns; the cheapest module here.
10. `MOD-DOH-13`. Chrome only; parallelisable off the critical path.
11. **Device screen group, last.** Two open decisions gate it and nothing depends on it.

---

## 5. Cross-slice seams — named, never inline

Each ships as a named interface with a seeded fixture behind it and an entry in the handover list.
A silent stub is the defect (R10).

| seam | consumer | owner |
|---|---|---|
| Worker-Shift meter inputs | `MOD-DOH-01` | `MOD-DOH-07`, slice 6 |
| Archival cascade over Jobs | `MOD-DOH-02` | `MOD-DOH-05`, slice 6 |
| Per-shift digest delivery | `MOD-DOH-03` | `MOD-DOH-10`, slice 10 |
| Audit records behind Platform Access History | `MOD-DOH-13` | `MOD-DOH-11`, slice 10 |
| Qualification gate at assignment and run start | `MOD-DOH-04` | `MOD-DOH-07`/`06`, slice 6 |

`MOD-DOH-04` is the worst case: **slice 4 owns the record and the evaluator while slice 6 owns two
of its three enforcement points.**

---

## 6. What this slice does NOT build

Job, Run, assignment, execution summary (slice 6). Notifications and audit stores (slice 10).
Regulated-Industry Mode. The Parts Registry. A Worker Hub view (D11). A clearance **grant** control
(D23). A certification-type admin screen (D22). Digest delivery (D26). The Studio, Command Center
or Frontline surfaces.

---

## 7. Testing

Every decision in §3 is a test. Every gate proven able to fail **by planting a violation on the
axis the gate is for** — and, after slice 3, **gates read the built artefact wherever the claim is
about what renders.** A declaration in a file is not a disclosure on a screen.

Slice-4 gates:

1. No three-digit `SCR-DOH-NNN` literal anywhere (D1, guards R1).
2. The write-class table is one data structure, and its contents equal the source enumerations
   verbatim (S2, guards R4).
3. **No persisted table or fixture has a worker identifier as a grouping key for a behavioural
   measure** (S10, guards R3). The escalation keys on `(Area, Shift)`.
4. No Worker-role Hub screen exists; the role switcher renders Worker as not-a-Hub-user (D11,
   guards R2).
5. Every write control is disabled-with-a-reason and never queued under connection loss (D7).
6. Deferred scoping (Cell, Job, worker) renders ABSENT, never disabled (S5, guards R5).
7. No accepted action renders as done — it renders its true command state (S9, guards R7).
8. Every cross-slice seam is a named interface with a fixture, not an inline stub (R10).

Carried from slice 3, non-blocking: `stripComments` over-strips a JSX run *beginning* with `//`;
`source-reconciliation.json`'s `extracted: 36` is hand-maintained.

# Slice 11 pre-verification — module identity cards & Chapter 40 tables

Source: `/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md` (frozen, 122,241 lines). All lines measured by direct read. Rows counted, not inferred.

Note on method: `graphify query` was run first per the project hook. It returned `loc=L48386` for MOD-CC-05, MOD-CC-06 **and** MOD-CC-08 — three different modules sharing one wrong line. The graph was discarded as evidence; every figure below comes from the document.

---

## FINDINGS TABLE

| # | Claim | Measured | Verdict | Evidence line |
|---|---|---|---|---|
| **A1** | MOD-CC-08 card L37634–L37825 | starts L37634; content closes L37822 (`**Source status.**`); L37823 blank [cited-in-error: L37823], L37824 `---`, L37825 blank [cited-in-error: L37825] | **CORRECTED** — claimed end is a blank line | L37822 / L37824 |
| A1 | MOD-CC-08 identity block L37642 | `**Identity.**` is **L37640**; L37642 is `**Purpose.**` | **CORRECTED** | L37640 |
| A1 | MOD-CC-08 matrix L37664–L37674, 9 rows | header L37664, sep L37665, data L37666–L37674 = **9 rows** | **CONFIRMED** | L37664 |
| **A2** | MOD-CC-06 card L37251–L37470 | starts L37251; content closes L37467; L37469 `---`; L37470 blank [cited-in-error: L37470] | **CORRECTED** — claimed end is a blank line | L37467 / L37469 |
| A2 | MOD-CC-06 identity block | `**Identity.**` L37257 (not claimed) | measured | L37257 |
| A2 | MOD-CC-06 matrix L37292–L37301, 8 rows | header L37292, sep L37293, data L37294–L37301 = **8 rows** | **CONFIRMED** | L37292 |
| **A3** | MOD-CC-05 card L37027–L37250 | starts L37027; content closes L37247; L37249 `---`; L37250 blank [cited-in-error: L37250] | **CORRECTED** — claimed end is a blank line | L37247 / L37249 |
| A3 | MOD-CC-05 identity block | `**Identity.**` L37033 | measured | L37033 |
| A3 | MOD-CC-05 matrix L37076–L37085, 8 rows | header L37076, sep L37077, data L37078–L37085 = **8 rows** | **CONFIRMED** | L37076 |
| **A4** | MOD-CC-07 card L37471–L37633 | starts L37471; content closes L37630; L37632 `---`; L37633 blank [cited-in-error: L37633] | **CORRECTED** — claimed end is a blank line | L37630 / L37632 |
| A4 | MOD-CC-07 identity block | `**Identity.**` L37477 | measured | L37477 |
| A4 | MOD-CC-07 matrix L37503–L37511, 7 rows | header L37503, sep L37504, data L37505–L37511 = **7 rows** | **CONFIRMED** | L37503 |
| **A5** | MOD-FL-B8 card L41448–L41597 | starts L41448; content closes L41596 (`**Source status.**`); L41597 blank [cited-in-error: L41597]; next heading L41598. **No `---` rule** in this chapter | **CORRECTED** — claimed end is a blank line | L41596 |
| A5 | MOD-FL-B8 identity block | no `**Identity.**` label; ch. 22 uses `**Identifier.** \`MOD-FL-B8\`. **Name.** Coaching Rendering.` at **L41454** | measured | L41454 |
| A5 | MOD-FL-B8 matrix L41466–L41474, 7 rows | header L41466, sep L41467, data L41468–L41474 = **7 rows** | **CONFIRMED** | L41466 |
| **A6** | MOD-SA-07 card L43988–L44698 | §23.7 starts L43988; last content L44696; L44697–L44698 blank [cited-in-error: L44697] [cited-in-error: L44698]; next heading L44699 | **CORRECTED** — claimed end is a blank line; true content end L44696 | L44696 |
| A6 | MOD-SA-07 has **no** role-per-column permission matrix | Whole span 43988–44698 scanned. Exactly **three** tables: L44534 (`Floor or ceiling / Value / Behaviour`, 8 rows), L44614 (`Setting group / Class / Approver`, 8 rows), L44631 (`Field / Value` module card, 30 rows). Exactly **one** line in the whole span carries a permission token — L44650, a prose cell in the Field/Value card. No role axis anywhere. | **CONFIRMED (absence real)** | L44614 / L44631 |
| A6 | The 8-row Setting/Class/Approver table at L44614–L44623 | header L44614, sep L44615, data L44616–L44623 = **8 rows** | **CONFIRMED** | L44614 |
| **B** | Tenant Admin `Explicitly prohibited` on "See agent health flags" at L37668 | that row is at **L37669**; L37668 is "Follow an evidence link from a log entry" | **CORRECTED** | L37669 |
| **B** | Tenant Admin `Allowed with conditions` on "See the cross-Area agent health roll-up" at L37670 | exact | **CONFIRMED** | L37670 |
| **B** | The contradiction itself | Real. Same role, adjacent rows: barred from the flags, permitted the roll-up **of those flags**. | **CONFIRMED** | L37669–L37670 |
| **C** | MOD-CC-06 has no row for reversing a Lane A refinement | All 8 row labels listed below; none names reversal, Lane A, or an undo. Grep for `revers` across L37251–L37470 returns 4 hits (L37265, L37338, L37381, L37443) — **none inside the matrix**; L37443 `AC-CC-262` asserts reversibility with no matrix row backing it. | **CONFIRMED (absence real)** | L37294–L37301 |
| **C** | SB-AI-014 at L87729 | exact; quoted clause is verbatim | **CONFIRMED** | L87729 |
| **D** | MOD-FL-B8 cross-surface cells at L41472, L41473 | exact — three cross-surface cells total (2 in L41472, 1 in L41473) | **CONFIRMED** | L41472–L41473 |
| **E1** | L86136, §40.1 boundary matrix, 8 rows | §40.1 = L86076–L86172, so in range. header L86136, sep L86137, data L86138–L86145 = **8 rows** | **CONFIRMED** | L86136 |
| **E2** | L86931, atom registry, 6 rows | header L86931, sep L86932, data L86933–L86938 = **6 rows** | **CONFIRMED** | L86931 |
| E2 | Self-contradicting row at L86936 | The self-contradicting row is **L86937**, not L86936. L86936 is "Set per-tenant enablement" and is internally consistent. | **CORRECTED** | L86937 |
| E2 | Row content: 4 platform roles `Not applicable — this is a Studio operation…`, then `Allowed with conditions` for Tenant Admin and Quality Manager | exact | **CONFIRMED** | L86937 |
| **E3** | L87035, memory-store-by-agent, 6 rows | header L87035, sep L87036, data L87037–L87042 = **6 rows** | **CONFIRMED** | L87035 |
| **E4** | L87044, console memory operations, 6 rows | header L87044, sep L87045, data L87046–L87051 = **6 rows** | **CONFIRMED** | L87044 |
| **E5** | L87399, "Who may switch the evaluation gate off", 10 rows | header L87399, sep L87400, data L87401–L87410 = **10 rows** | **CONFIRMED** | L87399 |
| E5 | No permissive cell for any of the ten identities | All ten status cells read `Explicitly prohibited`. Zero `Allowed`, zero `Allowed with conditions`, zero `Read-only`. | **CONFIRMED** | L87401–L87410 |
| E5 | SB-AI-011 ENFORCED-badge instruction at L87376 | exact; quoted clause verbatim | **CONFIRMED** | L87376 |
| **E6** | L87950, prohibition table, 12 rows | header L87950, sep L87951, data L87952–L87963 = **12 rows** | **CONFIRMED** | L87950 |
| **F** | Authority diagram L87965–L87990 | fence opens **L87965**, closes **L87988**. L87990 is the caption paragraph, outside the fence. | **CORRECTED** — diagram is L87965–L87988 |
| **F** | Diagram draws 8 refusal edges | Counted: 8 edges terminate on `NO["Refused and audited"]` — L87977, 87978, 87979, 87980, 87981, 87982, 87983, 87984. | **CONFIRMED** | L87977–L87984 |
| **F** | Caption reads "they are one rule expressed eight ways" | exact | **CONFIRMED** | L87990 |
| **F** | Table above holds 12 rows | 12 | **CONFIRMED** | L87952–L87963 |
| **F** | Impersonating a role, offline-device-appears-controlled, and inventing content have no refusal edge | True, but **incomplete: four rows, not three**, have no refusal edge. Unmapped: #3 Impersonate a role, #10 Make an offline device appear remotely controlled, #11 Invent content rules or thresholds, **#12 Broaden permissions through model, provider or tool failover**. #12 is drawn only as three dotted `does not alter` non-effect edges (L87985–L87987), which is not a refusal edge. | **CORRECTED — 4 gaps, not 3** | L87985–L87987 |
| **G** | §40.15 rules "the Frontline Worker Application surface shows nothing at all about the pause", marked `Derived Clarification`, at L87854 | exact, inside `SB-AI-015`; the `Derived Clarification` marker immediately precedes the clause | **CONFIRMED** | L87854 |
| **G** | AIMODE-13 at L89289 | exact (definition paragraph) | **CONFIRMED** | L89289 |
| **G** | AIMODE-14 at L89291 | exact (definition paragraph) | **CONFIRMED** | L89291 |
| **G** | SB-42-301 at L89348 | exact | **CONFIRMED** | L89348 |
| **G** | Matrix rows at L89369–L89370 | AIMODE-13 row = **L89368**; AIMODE-14 row = **L89369**. L89370 is `AIMODE-15` Model rollback. | **CORRECTED** | L89368–L89369 |
| **G** | Which check is right — controller (L89289/L89291) vs independent (L89368/L89369) | **Both, about different objects.** The independent check measured the **mode matrix rows** (L89368, L89369) and is right for those. The controller measured the **definition paragraphs** (L89289, L89291) and is right for those. The controller's error is only in its *matrix* citation (L89369–L89370, off by one). | **BOTH CORRECT, DIFFERENT OBJECTS** | L89289/L89291 and L89368/L89369 |
| **G** | The §40.15-vs-§42.3 conflict is real | Real and direct. §40.15 L87854: worker surface shows **nothing**. §42.3 L89289: worker chip **must read** "Live coaching paused by the platform", and L89368/L89369 give it a `Worker-visible label` column entry. L89348 has Maya's tablet chip reading it during a pause. Marked `Derived Clarification` on both sides — two derived rulings in opposition. | **CONFIRMED** | L87854 vs L89289 |
| **G** | Caption "Six things stop and nine continue" at L87852 | exact wording, at L87852 | **CONFIRMED** | L87852 |
| **G** | Diagram has 6 STOP nodes, 9 KEEP nodes, plus a tenth continue-side node at L87848 | Counted from `PAUSE`: STOP1–STOP6 = **6** (L87833–L87838); KEEP1–KEEP9 = **9** (L87839–L87847); **plus `HONEST` at L87848**, a tenth `PAUSE -->` child. Diagram also carries a detached `RESUME --> RESTART` pair (L87849), not under PAUSE. | **CONFIRMED (prior measurement correct)** | L87833–L87849 |
| **G** | Whether the caption is wrong | Defensible, not wrong. `HONEST` is a rendered state ("Client Command Center shows agents paused by the platform"), not a thing that "continues". The caption's 6/9 matches the STOP/KEEP node names exactly. The tenth node is uncounted but is not miscounted. | **CONFIRMED as defensible** | L87848 / L87852 |

### Pattern across A1–A6
All six claimed card end-lines land on a blank line or a `---` rule, one to three lines past the last content line. Consistent with spans taken from a table of section starts (next-start minus one) rather than read to each section's close — the exact failure the brief warns about. Corrected content-end lines: **37822, 37467, 37247, 37630, 41596, 44696**.

---

## VERBATIM QUOTATIONS

### A — column headers (verbatim, full row)

MOD-CC-05 **L37076**, MOD-CC-06 **L37292**, MOD-CC-07 **L37503**, MOD-CC-08 **L37664** — all four identical:

```
| Capability on this module | Tenant Admin | Supervisor | Quality Manager | Read-only Auditor | Worker |
```

MOD-FL-B8 **L41466** — different axis order, Worker first, Tenant Admin fourth:

```
| Action | Worker | Supervisor | Quality Manager | Tenant Admin | Read-only Auditor |
```

MOD-SA-07 — none exists. Its only permission-shaped table, **L44614**:

```
| Setting group | Class | Approver |
```

### A6 — MOD-SA-07 measured absence, the decisive rows

**L44623** (the closing row of the Setting/Class/Approver table):

> `| The six enforced invariants | No class exists | Nobody — there is no approval path |`

**L44639–L44640** — where MOD-SA-07 states permissions instead, as prose cells in a `Field | Value` card, with no role axis:

> `| Permission — allowed | Read every category (all four roles); submit engineering-class changes (`ROLE-PLAT-ENG`); approve engineering-class (`ROLE-`…`

> `| Permission — denied | Changing any of the six enforced invariants, for every account including the root; applying any change without its class app`…

### B — the MOD-CC-08 contradiction, both rows verbatim

**L37669:**

> `| See agent health flags | Explicitly prohibited | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited |`

**L37670:**

> `| See the cross-Area agent health roll-up | Allowed with conditions — requires Tenant or Site read scope | Allowed with conditions — requires Tenant or Site read scope | Allowed with conditions — requires Tenant or Site read scope | Explicitly prohibited | Explicitly prohibited |`

Tenant Admin is column 2 in both. `Explicitly prohibited` on the flags; `Allowed with conditions` on the roll-up of those same flags.

### C — MOD-CC-06's eight matrix row labels, in document order

| Line | Row label (verbatim) |
|---|---|
| L37294 | `See the Lane B proposal queue` |
| L37295 | `Annotate a proposal` |
| L37296 | `Approve a proposal` |
| L37297 | `Decline a proposal with a categorised reason` |
| L37298 | `See the read-only learning view` |
| L37299 | `Turn learning off` |
| L37300 | `Edit a configured value directly` |
| L37301 | `Approve structural change such as instruction wording or checklist composition` |

No row governs reversing a Lane A refinement.

**SB-AI-014, L87729** — the requirement, verbatim (decisive clause):

> `Derived Clarification`: the Lane A log must render each refinement with a reverse control, because reversibility is a stated property and a property with no control is a claim rather than a feature. **The source does not state who may reverse a Lane A refinement.** `TBD — Client Decision Required (DEC-LANEA-001)`.

Compounding evidence — **L37443**, inside MOD-CC-06 itself, asserts the property the matrix gives no control for:

> `- `AC-CC-262` — Lane A changes no configured value; every Lane A refinement is logged and reversible.`

And **L87731** confirms the authority is undecided: `**\`DEC-LANEA-001\` — authority to reverse a Lane A refinement.**`

### D — MOD-FL-B8's three cross-surface cells

**L41472** (two cross-surface cells — Supervisor/QM point to the Command Center, Auditor to the Hub):

> `| See another worker's coaching history | `Explicitly prohibited` | `Allowed with conditions` — only the repeated-coaching pattern signal, in the Client Command Center | `Allowed with conditions` — same | `Explicitly prohibited` | `Read-only` — in the Delivery Operations Hub record |`

**L41473** (one cross-surface cell — Quality Manager to the Studio):

> `| Author or edit coaching content | `Explicitly prohibited` | `Explicitly prohibited` on this surface | `Allowed with conditions` — in the Standards and Operations Studio with an authoring grant, never here | `Explicitly prohibited` | `Explicitly prohibited` |`

Three cross-surface grants, three different surfaces: Client Command Center, Delivery Operations Hub, Standards and Operations Studio. Each is phrased as an elsewhere-permission with an on-this-surface denial.

### E — Chapter 40 header rows, verbatim

| True header line | Data rows | Header row (verbatim) |
|---|---|---|
| L86136 | 8 (L86138–L86145) | `| Component | May evaluate a specification rule | May set a severity band | May place a Severity 1 hold | May release a Severity 1 hold |` |
| L86931 | 6 (L86933–L86938) | `| Operation | Root Super Admin | Admin | Platform Engineer | Support | Tenant Admin | Quality Manager |` |
| L87035 | 6 (L87037–L87042) | `| Store | Prevention Agent | Deviation and Containment Agent | Shift Handoff Agent | Tenant-composed reasoning agent |` |
| L87044 | 6 (L87046–L87051) | `| Console memory operation | Root Super Admin | Admin | Platform Engineer | Support | Tenant Admin |` |
| L87399 | 10 (L87401–L87410) | `| Who may switch the evaluation gate off | Status |` |
| L87950 | 12 (L87952–L87963) | `| # | Prohibition | Test |` |

### E2 — the self-contradicting registry row, whole row verbatim at **L86937**

> `| Enable a capability inside the tenant's entitlement set | `Not applicable — this is a Studio operation inside the tenant workspace` | `Not applicable — this is a Studio operation inside the tenant workspace` | `Not applicable — this is a Studio operation inside the tenant workspace` | `Not applicable — this is a Studio operation inside the tenant workspace` | `Allowed with conditions` — within the entitlement set and tier | `Allowed with conditions` — with an authoring grant, within entitlements |`

Seven columns: Operation, Root Super Admin, Admin, Platform Engineer, Support, Tenant Admin, Quality Manager. The four platform roles declare the operation out of scope for this table; the same row then grants it to the two tenant roles. Under a strict reading `Not applicable` scopes the operation out of the table entirely, which the two populated cells then contradict.

### E5 — the ten-row gate table, all ten rows verbatim (L87401–L87410)

```
| Root Super Admin | `Explicitly prohibited` — the gate has no off position for any role including the root |
| Admin | `Explicitly prohibited` |
| Platform Engineer | `Explicitly prohibited` |
| Support | `Explicitly prohibited` |
| Tenant Admin | `Explicitly prohibited` |
| Quality Manager | `Explicitly prohibited` |
| Supervisor | `Explicitly prohibited` |
| Read-only Auditor | `Explicitly prohibited` |
| Worker | `Explicitly prohibited` |
| Any non-human identity, including an agent | `Explicitly prohibited` |
```

**SB-AI-011, L87376** — the rendering instruction, verbatim (decisive clause):

> In Platform Settings, screen `SCR-SA-SETTINGS` renders the evaluation gate with an ENFORCED badge, locked, with no approval path around it and no control to disable it for any account `[SoW Fact — §8.7.4]`. `Derived Clarification`: the ENFORCED badge must be rendered as an absence of control rather than a disabled control, because a greyed-out toggle invites the belief that a sufficiently privileged account could enable it.

### F — the eight refusal edges, verbatim (L87977–L87984)

```
87977    CHECK -->|"privilege elevation"| NO["Refused and audited"]
87978    CHECK -->|"cross-tenant access"| NO
87979    CHECK -->|"severity write"| NO
87980    CHECK -->|"Severity 1 hold release"| NO
87981    CHECK -->|"self-approval"| NO
87982    CHECK -->|"gate bypass"| NO
87983    CHECK -->|"evidence or audit deletion"| NO
87984    CHECK -->|"stale queued action"| NO
```

Caption, **L87990**, verbatim (decisive sentence):

> The eight refusal edges converge on one node because they are one rule expressed eight ways: an agent acts inside its record or it does not act.

#### Edge-to-row mapping — 8 edges against 12 rows

| Table row | Prohibition | Refusal edge |
|---|---|---|
| L87952 #1 | Elevate its permissions | L87977 `privilege elevation` |
| L87953 #2 | Change tenant scope | L87978 `cross-tenant access` |
| **L87954 #3** | **Impersonate a role** | **none** |
| L87955 #4 | Self-approve | L87981 `self-approval` |
| L87956 #5 | Release a Severity 1 hold | L87980 `Severity 1 hold release` |
| L87957 #6 | Bypass a specification, evaluation, qualification, approval, or publication gate | L87982 `gate bypass` |
| L87958 #7 | Classify deviations | L87979 `severity write` |
| L87959 #8 | Execute stale queued actions | L87984 `stale queued action` |
| L87960 #9 | Delete evidence or audit history | L87983 `evidence or audit deletion` |
| **L87961 #10** | **Make an offline device appear remotely controlled** | **none** |
| **L87962 #11** | **Invent content, rules, or thresholds** | **none** |
| **L87963 #12** | **Broaden permissions through model, provider or tool failover** | **none** — represented only as three dotted non-effects, L87985–L87987 |

The three unmapped rows named in the claim (#3, #10, #11) are correct. The claim misses **#12**. The three dotted edges do model #12, but as non-effects rather than refusals:

```
87985    FAIL["Model, provider or tool failover"] -.->|"does not alter"| CAP
87986    FAIL -.->|"does not alter"| MEM
87987    FAIL -.->|"does not alter"| SCOPE
```

Whether #12 counts as covered depends on whether a dotted non-effect satisfies "refusal edge". Under the caption's own arithmetic — eight edges, eight ways — it does not. **Four of twelve prohibitions have no refusal edge.**

### G — the §40.15 / §42.3 blast-radius conflict, both sides verbatim

**Side one — §40.15, `SB-AI-015`, L87854** (decisive clause):

> `Derived Clarification`: the Frontline Worker Application surface shows nothing at all about the pause, because a worker's experience is unchanged except that no coaching appears, and telling a worker that "agents are paused" would be noise about a system they do not operate.

**Side two — §42.3, `AIMODE-13`, L89289** (decisive clause):

> *Worker sees:* mode chip "Live coaching paused by the platform", not "offline", because the distinction matters to a worker deciding whether to walk to a better signal.

**`AIMODE-14`, L89291** — inherits it by reference:

> **`AIMODE-14` Platform artificial-intelligence suspension.** The platform-wide pause. Identical semantics to `AIMODE-13` with the scope widened, plus cross-tenant incident communication from the Super Admin platform console.

**`SB-42-301`, L89348** (decisive clause):

> During a platform-wide pause (`AIMODE-14`): Maya's tablet chip reads "Live coaching paused by the platform"; Sam's Client Command Center agent activity panel carries the banner "Agents paused by the platform — deterministic safety checks are unaffected"

**Matrix rows, corrected lines.** Header **L89354**:

> `| Mode | Worker-visible label | Agent invocation | Deterministic safety | Escalation delivery | Classification |`

**L89368:**

> `| `AIMODE-13` Tenant suspension | Live coaching paused by the platform | Explicitly prohibited | Allowed | Allowed | `SoW Fact — §8.7.5` |`

**L89369:**

> `| `AIMODE-14` Platform suspension | Live coaching paused by the platform | Explicitly prohibited | Allowed | Allowed | `SoW Fact — §8.7.5` |`

(L89370 is `AIMODE-15` Model rollback — the claimed range was off by one.)

**Assessment.** Direct contradiction, not a nuance. §40.15 forbids the worker surface from showing anything; §42.3 mandates a specific worker-visible string, gives it a matrix column, argues *why* the string must not be "offline", and stages it in a storyboard. Both sides carry `Derived Clarification`, so neither outranks the other on provenance. §42.3's reasoning is the stronger of the two — it names a concrete operational harm (a worker walking to find signal that is not the problem) — and it is corroborated in three places (L89289, L89348, L89368/L89369) against §40.15's single clause. **Escalate before building either.**

### G — §40.15 diagram node count

From `PAUSE` — **6 stop, 9 keep, plus a tenth child**:

```
87833  PAUSE --> STOP1  In-flight agent runs checkpoint at the next stage boundary and park
87834  PAUSE --> STOP2  No new agent activations
87835  PAUSE --> STOP3  No coaching delivered
87836  PAUSE --> STOP4  No deviation brief assembled
87837  PAUSE --> STOP5  No shift handoff brief produced
87838  PAUSE --> STOP6  No Lane B proposal generated
87839  PAUSE --> KEEP1  Raised gate items stay human-decidable
87840  PAUSE --> KEEP2  On-device specification gates continue
87841  PAUSE --> KEEP3  On-device severity classification continues
87842  PAUSE --> KEEP4  Automatic Severity 1 lot freeze continues
87843  PAUSE --> KEEP5  On-device containment checklist launch continues
87844  PAUSE --> KEEP6  Capture, queueing and synchronisation continue
87845  PAUSE --> KEEP7  Command channel continues: lot release, reassignment, clearance, suspension, version change
87846  PAUSE --> KEEP8  Escalation routing and notification delivery continue
87847  PAUSE --> KEEP9  Audit and evidence recording continue
87848  PAUSE --> HONEST Client Command Center shows agents paused by the platform
87849  RESUME --> RESTART  (detached pair, not a PAUSE child)
```

Caption, **L87852**, verbatim:

> **What the diagram shows — the blast radius, explicitly.** Six things stop and nine continue.

**16 nodes hang off `PAUSE`, not 15.** Prior measurement confirmed exactly. The caption is defensible: `HONEST` (L87848) is a rendered state rather than a behaviour that continues, and the 6/9 split matches the `STOP`/`KEEP` node naming precisely. Note for the build: L87848 is the Command Center side of the very conflict in G above — the diagram shows the pause on the Command Center and shows nothing for the worker surface, siding with §40.15 against §42.3.

---

## BUILD-BLOCKING ITEMS

1. **G — worker-surface pause state.** Unresolved contradiction between two `Derived Clarification` rulings. Cannot build MOD-FL-B8's pause behaviour or the AIMODE chip without a decision. §42.3 is corroborated three ways; §40.15 once.
2. **C — Lane A reverse control.** SB-AI-014 (L87729) requires it, MOD-CC-06's matrix has no row for it, AC-CC-262 (L37443) asserts the property, and `DEC-LANEA-001` (L87731) leaves the authority open. Building MOD-CC-06 from its matrix alone ships the gap.
3. **F — four prohibitions without a refusal edge.** #3, #10, #11, #12. If the diagram is a build artifact, it under-renders the table by four.
4. **E2 — L86937 is not decidable as written.** `Not applicable` for four roles and `Allowed with conditions` for two, in one row. A permission evaluator needs the row's intent resolved before it can be encoded.
5. **B — MOD-CC-08 roll-up leak.** L37669/L37670 give Tenant Admin the aggregate of data it is barred from at item level. Either intentional (and needs a note) or a defect.

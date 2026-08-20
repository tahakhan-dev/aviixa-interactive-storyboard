# SURF‑STU SLICE 5 — BUILD MAP

**Standards and Operations Studio, authoring through publication and package.** All eighteen derived modules are in scope: `MOD-STU-01` … `MOD-STU-18`. All line numbers are lines in `/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md`, sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines, re‑hashed at slice entry with no drift.

**Every permission matrix below was transcribed cell by cell from the frozen source at the line span stated on it.** None is abbreviated, none is paraphrased, and no row is folded into a "×4" shorthand. Slice 4 lost a review round to an abbreviated row and shipped two brief defects from truncated matrices; this document is the correction. Where a reader summary and the source disagreed, the source won and the disagreement is recorded.

**Count scope, once, for everything here.** Every number in this document counts *rows I read in a named table at a named line*. The one inventory figure — eighteen modules — is **`Derived Clarification` under `DEC-STUDIO-001` and is never presented as source‑backed** (`AC-STU-014`, L30992). No number here is an extraction tally.

---

## 0. THE DERIVATION, SHOWN

The Studio is the only surface whose module count the source does not state. The derivation is therefore part of the census, not an input to it.

| # | Step | Locator | The source's own words |
|---|---|---|---|
| 1 | The absence is stated | L1568 | *"**No canonical module count exists in the source for the Standards and Operations Studio**; this blueprint derives a logical model of **18** modules from §5.1 to §5.18 and labels it `Derived Clarification`, carried as `DEC-STUDIO-001`. Any claim of a source-backed Studio count would be false."* |
| 2 | Restated as the chapter's first and plainest sentence | L30897 | *"**The Statement of Work provides no canonical module count for the Standards and Operations Studio.** Part V describes the Studio's scope in eighteen numbered sections (§5.1 through §5.18) but nowhere presents a module inventory table equivalent to §4.1.3 for the Delivery Operations Hub, §6.1.6 for the Client Command Center, or §7.3 for the Frontline Worker Application. Any Studio module count is therefore **derived**, not sourced."* |
| 3 | The rule | L30899 | *"One module per numbered section of Part V, in section order, with the section's own heading as the module name. This yields exactly eighteen modules, `MOD-STU-01` through `MOD-STU-18`."* |
| 4 | Why this rule | L30901 | *"Part V's numbered sections are already scoped by function, each with a distinct owner, a distinct object type, and distinct governance… A model that respects the source's own section boundaries is the model least likely to invent a seam the source does not have."* |
| 5 | Three alternatives, rejected on the record | L30905‑L30907 | **A, six functional modules** — rejected because it "would place the Training Library (§5.8), whose delivery is online-only and produces no production record, in the same module as the Coaching Corpus (§5.7.2), whose assets ship inside the offline work package. Those two have opposite packaging rules; merging them would make the offline package specification ambiguous." **B, nine modules mirroring the nine screen sections** — rejected because "the nine sections are sections of one screen configuration panel, not modules of a surface. Eleven of the eighteen Part V sections … have no home in a nine-way screen-section split." **C, twenty‑two modules promoting the three agents and four library sub‑areas** — rejected because "the three agents are not Studio modules but platform-provided agents that the Studio configures, and treating them as Studio modules would blur the Tier-2 boundary of §5.1.2." |
| 6 | The inventory table | L30911‑L30930 | Eighteen rows: identifier, name, source section, primary object owned or governed. |
| 7 | The build's own register already agrees | `registries/generated/modules.json` | All eighteen present, `sourceLine: 2444`, `sourceClass: "derived"`, `status: "not-represented"`. The register has never presented the count as source‑backed. |

**The named failure mode is derived‑count leakage** (L4183): *"the derived eighteen-module Studio model being quoted elsewhere as a source-backed count. Detection: any claim of a Studio module count without the `Derived Clarification` label."* L14442 makes the rendering obligation concrete — a header line names the count and, for the Studio, renders the words *"derived count, not stated in the Statement of Work"* beside the number with `DEC-STUDIO-001` linked; `TEST-ROLE-1023` (L14497) asserts it.

**Nothing on this surface is excluded from slice 5.** Every one of the eighteen is reachable from the authoring‑to‑package spine, and the umbrella build order assigns the whole surface to one slice. What *is* bounded is how far each module reaches across a seam — set out in §5.

---

## 1. PER‑MODULE BUILD UNIT

### Conventions used in every unit below

**Screen identifiers — two catalogues, and this collision is not slice 4's collision.** Catalogue **A** is the mnemonic register at L31067‑L31089, twenty‑one rows, four columns, twenty of them marked *"Named in the source: Yes"* with a section. Catalogue **B** is the numbered register at L48259‑L48273, fifteen rows, six columns, carrying *roles that can open it*, *modules and features shown* and *navigation entry point*. Both are classified `Derived Clarification` (L31110, L48360). **They do not share a token**: no `SCR-STU-001` three‑digit form exists anywhere in the source, so a route table keyed on either literal cannot bind the wrong screen. What collides is **coverage**, and it collides in both directions:

- Catalogue A splits what B merges: `SCR-STU-CAPS` + `SCR-STU-AGENT` (L31084‑L31085) against B's single `SCR-STU-13` "Agent configuration and Agent Builder" covering `MOD-STU-02` *and* `MOD-STU-15` (L48271); `SCR-STU-VERSION` + `SCR-STU-DIFF` + `SCR-STU-LINKAGE` (L31081‑L31083) against B's single `SCR-STU-12` (L48270).
- Catalogue B carries two screens A has no row for at all: `SCR-STU-01` Sign‑in (L48259) and `SCR-STU-15` Studio permissions and grants (L48273).
- Catalogue A carries three screens B folds away: `SCR-STU-LEARN` (L31086), `SCR-STU-PARTADD` (L31088), `SCR-STU-DRAFTAI` (L31089).

**Nineteen further screen literals exist outside both catalogues**, each occurring in a storyboard or a degraded‑mode inventory: `SCR-STU-SCREENCFG` (L11251), `SCR-STU-AGENTBUILDER` (L12027), `SCR-STU-DEGRADE-01` (L15086), `SCR-STU-GRANT-01` (L16457), `SCR-STU-APPROVE` (L20338), `SCR-STU-SCREEN-CONFIG` (L61890), `SCR-STU-RELEASE` (L62023, L68317), `SCR-STU-AGENTCFG` / `SCR-STU-LIBRARIES` / `SCR-STU-CAPABILITY` (L68013), `SCR-STU-BUILDER` / `SCR-STU-DIFFICULTY` / `SCR-STU-QUALREQ` (L68164), `SCR-STU-QUEUE` / `SCR-STU-PREVIEW` (L68317), `SCR-STU-PUBLISH` / `SCR-STU-VERSIONS` (L68467), `SCR-STU-VERSION-01` (L93443), `SCR-STU-PUB-01` (L100558). `SCR-STU-PREVIEW` is the only one of the nineteen that also appears in catalogue A. **See D1.**

**Screen states.** The thirteen‑state contract is at L48007‑L48014. This surface's departures are stated once, at L48330, and are quoted here in full rather than restated per module:

> *"All fifteen screens render the contract defaults with four stated departures. `STATE-07` offline is not applicable anywhere on this surface, because authoring requires a connection; a lost connection renders `STATE-12` with unsaved-work protection. `STATE-09` queued applies only on `SCR-STU-04` and `SCR-STU-11` at publication, where the new version's distribution to devices renders in command state rather than as complete. `STATE-10` and `STATE-11` apply on `SCR-STU-04` and `SCR-STU-13`: when the drafting aid is degraded or unavailable, the author writes all three difficulty levels manually and the panel says so, because the platform's artificial intelligence accelerates authoring and never publishes. `STATE-04` validation on this surface carries a special weight: the locale completeness check and the missing-severity-mapping check are publication blockers, not warnings."*

**That paragraph contradicts chapter 20 and the global contract.** L48014 says the three web surfaces *"render a connection-lost banner and enter `STATE-08` or `STATE-13`"*; L48330 says `STATE-12`; chapter 20's own connectivity state machine (L30839‑L30851) names four states that are none of the thirteen — Connected, Degraded, ReadOnlyCache, Suspended — and `FB-STU-01` (L30863) describes *"an explicit disconnected state"* with a local draft buffer, submit disabled, and *"no save has been recorded"*. **See D7.**

**`STATE-10` and `STATE-11` DO apply on this surface**, which is a departure from slice 4 where both were inapplicable everywhere. The Studio has three live artificial‑intelligence touchpoints in the authoring path — the authoring aid (§5.11.3), difficulty‑level drafting (§5.9) and locale‑variant drafting (§5.17) — and `TEST-SCR-STU-005` (L48358) asserts the `STATE-11` rendering by name.

**Prohibition rendering.** Two rulings are inherited from slice 4 and are **not re‑litigated here**: `Explicitly prohibited` carries **no rendering** anywhere in the source, and `Unavailable` is overloaded across two senses that render oppositely. Both were established by adjudication and are in the ledger. What this census adds is the *evidence for this surface*, so the slice‑5 renderings are derived from the same adjudication rather than re‑argued:

| Source token | Occurrences on SURF‑STU | Rendering | Evidence |
|---|---|---|---|
| `Allowed` | pervasive | Renders, enabled | — |
| `Allowed with conditions` | pervasive | Renders; the condition is enforced **at the write**, and the condition text is the source's own | e.g. L34552 "never on own submission or one they reviewed" |
| `Read-only` | pervasive | `STATE-06` with the cause named; *"the cause is always named; 'read-only' alone is never shown"* (L48013) | — |
| `Explicitly prohibited` — categorical | the large majority | **ABSENT** | The role cannot hold it in any scope. L30780 `AC-STU-005`: *"No user interface control anywhere in the Studio creates, edits, or deletes an atomic capability."* L34667 `AC-STU-150`: *"A Worker cannot reach any Studio route by any means."* |
| `Explicitly prohibited` — routing | a minority, always where another role on the same screen holds it | **DISABLED, NAMED REASON** | L34595 `FUNC-STU-18-04-A-1`: *"Present every unavailable capability with a stated reason rather than hiding it. Purpose: a user should learn what they need, not that a feature does not exist."* `AC-STU-155` (L34672). L34096 makes it concrete: compose controls *"are shown with the reason 'Requires the Growth or Enterprise tier' where the tier is below Growth, rather than hidden."* L31976: the New Workflow button is *"visible to grant-holders and disabled with a stated reason for read-only roles rather than hidden, so a Supervisor understands they need the grant rather than assuming the feature is missing."* |
| `Not applicable — <reason>` | 34 cells | **ABSENT**, reason in help text | Nothing exists to enable on this surface; the act belongs elsewhere |
| `Client Decision Required` | 47 cells, 15 of the 26 matrices | **DISABLED with the decision identifier and both readings on screen** | `AC-RBAC-602` (slice‑4 D8) requires the token to exist at runtime and to name its decision identifier in the denial. `AC-STU-157` (L34674): *"every Read-only Auditor cell states `Client Decision Required` rather than being guessed."* |
| `Unavailable` — sense A, a capability that exists but is withheld in this condition | L32824, L34563 | **DISABLED with the condition named** | L34563: *"Unavailable — the Studio requires an active connection"*. L32824: *"Unavailable — delivery is online-only and content is excluded from the offline work package"* |
| `Unavailable` — sense B, the role cannot hold it in any scope | L22036, L22037, L22042, L48322, L48325, L48326, L67909, L68052‑L68054, L68060, L68204‑L68206, L68212, L68356‑L68358, L68364 | **ABSENT** | Slice‑4 adjudication. On this surface sense B is used where chapter 20 uses `Explicitly prohibited` for the same cell — see D9 |

**`Cached read-only while offline` and `Queued while offline` never appear as a Studio actor's own status**, and the source says why once, at L31515, so this document does not repeat it per module:

> *"Because the Studio is web-only and requires an active connection, the statuses `Cached read-only while offline` and `Queued while offline` almost never apply to a Studio actor. Where they appear, they describe the *Frontline* consequence of a Studio configuration, not a Studio user's own experience, and the row says so."*

**Feature identifiers.** Two schemes. Chapter 20 uses `FEAT-STU-01-01` / `SUB-STU-01-01-A` / `FUNC-STU-01-01-A-1`. The four‑digit traceability catalogue at L47378‑L47431 uses `FEAT-STU-0101` / `SUB-STU-0101` / `FUNC-STU-0101`, exactly three features per module, all eighteen modules in one table. `registries/generated/features.json` has registered **both** — 123 `*-STU-*` feature rows for 54 four‑digit features. **See D20.**

---

### MOD‑STU‑01 — Charter and Position

**Section §5.1. Card L31552‑L31678.**

**Purpose (L31565):** *"Establish and enforce the Studio's authority boundary: enable, configure, compose; never define."*
**User benefit (L31566):** *"A tenant can never accidentally create a safety-critical capability that has no evaluation scenarios behind it, and can always see why a control does not exist."*

**Why it is a module and not a preamble (L31558):** *"`MOD-STU-15` cannot specify the Agent Builder without it, `MOD-STU-05` cannot explain why exactly nine configuration sections exist without it, and `MOD-STU-07` cannot explain why a tenant may curate coaching content but not define a severity level without it."*

**Screens.** `SCR-STU-CAPS` Atomic Capabilities (L31084, catalogue A; folded into `SCR-STU-13` in catalogue B, L48271). Storyboard `SB-STU-02` (L30751): four columns — *"capability name in full words, enablement state, the configuration surfaces it switches on, and the Workflows currently relying on it"* — each row carrying *"an enable or disable control and a plain-language consequence line, for example 'Disabling tolerance validation removes the Specification Limits section from all measurement screens and blocks publication of any Workflow that depends on it.'"* Capabilities outside entitlement are *"shown greyed with the reason stated as 'Not included in this tenant's entitlement' rather than hidden"*. **"There is no control anywhere in this view that creates a capability, because none exists."** Storyboard `SB-STU-04` (L31640): in any configuration section whose capability is not enabled, *"the Studio renders a single line where the section would be: the section name, the words 'Not available', and the specific reason, for example 'Requires the containment response capability, which is not enabled for this tenant.' A link leads to the Atomic Capabilities view for users permitted to enable it, and states who to ask for users who are not."*

**States (L31589).** *"Not applicable — the charter is a standing constraint and has no lifecycle. Its only observable variation is the enablement state of individual capabilities, which belongs to `MOD-STU-15`."*

**Permission matrix — L31571‑L31579, seven data rows.** This is the **only** module matrix in actor‑per‑row shape; every other is action‑per‑row.

| Actor | See the charter statements | Change the boundary | Author an atom | Enable a capability within entitlement |
|---|---|---|---|---|
| Quality Manager (`ROLE-TEN-QM`) | Read-only | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — within entitlement, audited |
| Supervisor with authoring grant | Read-only | Explicitly prohibited | Explicitly prohibited | Client Decision Required — the Statement of Work names an authorised user without naming the role; see `DEC-CAPAUTH-001` in section 20.2.15 |
| Supervisor without the grant | Read-only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Tenant Admin (`ROLE-TEN-ADMIN`) | Read-only | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-CAPAUTH-001` |
| Read-only Auditor (`ROLE-TEN-AUD`) | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Worker (`ROLE-TEN-WKR`) | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Platform Engineer (`ROLE-PLAT-ENG`) | Not applicable — the charter is a tenant-surface boundary, expressed platform-side as registry and entitlement controls | Allowed with conditions — engineering change plus Admin approval | Allowed with conditions — handler engineered, evaluation scenarios written, evaluation gate passed | Allowed with conditions — sets the entitlement rather than the enablement |

**The tier authority matrix — L30757‑L30765, seven data rows.** Governs every module on the surface, quoted once here.

| Action | Tier 1: Super Admin platform console | Tier 2: Standards and Operations Studio | Tier 3: Client Command Center | Floor: Frontline Worker Application |
|---|---|---|---|---|
| Author an atomic capability | Allowed with conditions — engineering change, evaluation gate, maker-checker approval | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Register an atomic capability | Allowed with conditions — Platform Engineer submits, Admin approves | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Set a tenant's capability entitlement | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Enable a capability within entitlement | Allowed | Allowed with conditions — authorised Studio user, within entitlement | Explicitly prohibited | Explicitly prohibited |
| Configure a capability per screen | Not applicable — the console does not hold tenant Workflow content | Allowed with conditions — authoring grant required | Explicitly prohibited | Explicitly prohibited |
| Compose a reasoning agent from capabilities | Not applicable — composition is a tenant act performed in the Studio | Allowed with conditions — Agent Author capability, Growth or Enterprise tier | Explicitly prohibited | Explicitly prohibited |
| Execute a configured capability at run time | Not applicable — execution happens on the device and in the orchestrator | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — within the pinned work package |

**Controls and their prohibition renderings.** Every "Change the boundary" and "Author an atom" cell is categorical `Explicitly prohibited` → **ABSENT**. The `DEC-CAPAUTH-001` cells render **DISABLED with the decision identifier**, because the Quality Manager column on the same row is also `Client Decision Required` — nobody holds it, and the control's existence is exactly what the decision is about.

**Objects.** None persisted. *"The module's output is the set of enforcement decisions applied by other modules: which configuration surfaces exist, which controls are absent, and which actions are refused"* (L31585). Touches `OBJ-STU-CAPSTATE` indirectly through `MOD-STU-15` (L31587).

**Dependencies (L31654).** The atomic capability registry, the tenant entitlement set, and the tenant's commercial tier — all Super Admin console, built in slice 3.

**Interconnections (L31656).** Constrains `MOD-STU-05` (which sections appear), `MOD-STU-07` (what may be curated versus defined), `MOD-STU-12` (publication blocking on unmet capability dependencies), `MOD-STU-15` (composition scope).

**The one notification row that is deliberately absent (L31664):** *"A request to define a foundation object is refused | Not applicable — a refusal is audited, not notified; notifying every refusal would train users to ignore notifications."*

**Fallback.** `FB-STU-07` primary; `FB-STU-10` for the audit path (L31670). `FUNC-STU-01-01-C-1` (L31599) carries the one difference worth building against: *"if the audit write fails, the refusal is still enforced because refusing is the safe direction."*

**Acceptance criteria.** `AC-STU-005` … `AC-STU-008` (L30780‑L30783) apply in full, plus `AC-STU-041` (L31674) — *"a define-class request is refused at the service layer and audited, whether it originates from the user interface or from an application programming interface call."*

---

### MOD‑STU‑02 — Agent Configuration

**Section §5.2. Card L31680‑L31869.**

**Purpose (L31699):** *"Supply each standard agent with the operating parameters it requires, carried inside authored Workflow content."*

**The core principle, stated exactly (L31688):** *"An agent does not contain its own rules… The timing threshold that decides when coaching appears, the specification limits that define a tolerance breach, the severity mapping that determines how serious a deviation is, the containment checklist that launches in response — none of these live in the agent. They live in the Workflow. The agent is the engine; the Studio is where the engine is tuned."*

**Screens.** Configured through `MOD-STU-05`'s nine‑section panel plus `SCR-STU-13` (catalogue B, L48271) / `SCR-STU-AGENTCFG` (`SB-010-01`, L68013: *"agent name, type of reasoning or action, on or off state, trigger conditions, bounds for what it may show and when it may fire, mapped workflows and screens, evaluation status, and the Shift Handoff Agent's lead time before shift end"*). Storyboard `SB-STU-05` (L31814), the severity‑arming confirmation.

**States (L31749).** *"Agent configuration has no lifecycle of its own; it inherits the Workflow version lifecycle: Draft, In Review, Published, Superseded, Archived."*

**Permission matrix — L31729‑L31739, nine data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|
| Set a screen's timing expectation and coaching trigger | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Designate a screen's curated coaching defaults | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Map a band to a severity level, arming its consequence | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Select the containment checklist for a band | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Select or override the escalation routing template | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Set the repeated-coaching alert threshold per Workflow | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Change the Shift Handoff Agent's run time before shift end | Allowed with conditions — a tenant-level setting administered in the tenant administration area, read here | Read-only | Read-only | Allowed — the tenant administration area is the Tenant Admin's screen group | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Change an agent's own reasoning logic | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Release a Severity 1 hold from the Studio | Explicitly prohibited — release is a Client Command Center action, Quality Manager only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**Note the shape of row 7.** It is the only row on the surface where the **Tenant Admin holds something the Quality Manager does not**, and the Quality Manager's cell explains why: the setting lives in the tenant administration area and is *read* here. A build that renders it as a Studio control on the Quality Manager's screen inverts the ownership.

**What each agent needs from the Studio — L31705‑L31709, three data rows.** Quoted because it is the map from agent to configuration section:

| Agent | Type | What the Studio must supply | Where it is configured |
|---|---|---|---|
| Prevention Agent | Action agent, governed by pre-authorised Studio-authored policy | A timing expectation: the maximum and minimum expected duration for the screen and the point, as a percentage of the maximum, at which coaching should appear. Coaching content to deliver: the tenant's approved per-language coaching corpus from which the agent retrieves, plus the screen's curated default for cold start. The qualification and proof context: what the worker must be qualified for and what proof the screen requires, so the agent can recognise the nature of the difficulty — a missing photo, a hesitation, a repeated gate block | Timing section; Coaching Corpus and Section 6 of the screen; Section 4 and Section 9 |
| Deviation and Containment Agent | Action agent, human-gated where it proposes beyond pre-authorised containment | Time bounds for the time-deviation mechanism; screen order and branch targets for the sequence mechanism; specification limits and gate-and-proof configuration for the specification and evidence mechanism; the severity mapping into the global catalog; the containment checklist; the escalation routing template | Timing section; the canvas; Specification Limits and Gate-and-Proof sections; Section 7 |
| Shift Handoff Agent | Reasoning agent, no governance gate | Mostly indirect: the deviations, coaching events, gate outcomes, and qualification requirements the Workflow configuration produced during the shift. The one direct authoring concern is qualification requirements, cross-referenced against the incoming shift plan to flag readiness gaps | `MOD-STU-13`, indirectly via all authored configuration |

**The three deterministic detection mechanisms — L31713‑L31717, three data rows.**

| Detection mechanism | What triggers it | Configured in |
|---|---|---|
| Time deviation | Screen duration exceeds the maximum, or completes below the minimum, which suggests a skip | Timing section: maximum and minimum duration |
| Sequence deviation | A screen is reached out of order, or a required predecessor screen was skipped | The canvas: screen order and branch targets |
| Specification or evidence deviation | A measurement falls outside the specification limits, or a screen is closed without the required proof | Specification Limits and Gate-and-Proof sections |

**`DEC-GATE-001`, and the consequence for this module (L31692).** Both source readings stand; the adopted working position declares gating per agent in the agent record's governance‑binding field — Prevention Agent `authoring-time policy`, Deviation and Containment Agent `runtime human gate` for proposals beyond pre‑authorised containment. **The practical consequence, verbatim:** *"the Studio must author the pre-authorised policy completely, because for the Prevention Agent that authoring approval is the whole of the human approval, and must never present pre-authorised policy as though it were a runtime human gate."*

**`SB-STU-05`, the severity‑arming confirmation (L31814), verbatim in substance.** *"When an author maps a band to Severity 1, the Studio interrupts with an inline confirmation panel headed 'This band arms an automatic lot hold.' The panel states in plain words: what will be held (the Lot where a lot exists, the Unit where work is serialized, otherwise the Run), that release is Quality Manager only with no supervisor exception, that the hold is placed on the device immediately including offline, and that escalation delivery follows at sync. The author confirms explicitly. The confirmation is recorded with the authored band."*

**Objects.** `OBJ-STU-AGENTCFG`, `OBJ-STU-SCREEN`, `OBJ-STU-PACKAGE` (L31747).

**Dependencies (L31828).** The global severity catalog; the tenant action bundles; the Content Libraries; the capability enablement state.

**A cross‑reference defect the source found in itself (L31869).** *"§5.2.2 cites '(5.5.9)' as the place where the Studio surfaces the Severity 1 arming consequence, and §5.5.1's table plus §5.11's own numbering place Deviation Rules and Severity Mapping at §5.5.8, with §5.5.9 being Tool and Equipment… Recorded as `DEC-STUXREF-001`. It matters because downstream requirement traceability keyed on the cited section number would point at the wrong configuration section."*

---

### MOD‑STU‑03 — Workflow Library and Tenant Workspace

**Section §5.3. Card L31871‑L32030.**

**Purpose (L31886):** *"Hold, classify, filter, and expose the tenant's complete Workflow inventory with authoring status, version, and linkage."*

**Screens.** `SCR-STU-LIBRARY` (L31069) / `SCR-STU-02` (L48260) — **the landing view**, filtered to Published by default (`AC-STU-017`, L31097). `SCR-STU-NEWWF` (L31070). Storyboard `SB-STU-06` (L31976): *"A table with one row per Workflow: name, status badge, Job Type, Service Type tag where applied, current version, linked Jobs count, linked Runs count, and last published date. A filter bar above carries status (default Published), Job Type, Service Type tag, and free-text name search. A New Workflow button sits top-right, visible to grant-holders and disabled with a stated reason for read-only roles rather than hidden, so a Supervisor understands they need the grant rather than assuming the feature is missing."*

**States (L31924).** Draft, In Review, Published, Archived. *"The first three are stated in §5.3.1; Archived follows from §5.12.3's manual archival."* The card is candid that Archived is derived. **`OBJ-036` at L8598 gives only Draft, In Review, Published — no Archived.** See D21.

**The state machine (L31959‑L31972)** draws a transition the source cannot support: `Archived --> Published : republication is not defined in the source, see the note below`. L31974: *"the Statement of Work… does not state whether an archived version can be un-archived. Not specified in the Statement of Work. Recorded as part of `DEC-ARCH-001`."*

**Permission matrix — L31902‑L31912, nine data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker | Implementation team grant |
|---|---|---|---|---|---|---|---|
| Open the Library filtered to Published | Allowed | Allowed | Allowed | Allowed | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions — during onboarding only |
| See Draft and In Review Workflows | Allowed | Allowed with conditions — grant-holders and the chain only | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions — during onboarding only |
| Create a new Workflow | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — author and submit only |
| Apply a Job Type to a Workflow | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Apply a Service Type tag | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Create a custom Job Type or Service Type tag | Allowed | Client Decision Required — the Statement of Work says tenants may create custom types without naming the role | Explicitly prohibited | Client Decision Required — the tenant administration area is a plausible home; not stated | Explicitly prohibited | Explicitly prohibited | Client Decision Required |
| Edit or delete a platform-seeded starter type | Explicitly prohibited — inherited read-only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| See linkage counts | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions |
| See another tenant's Workflows | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**Row 1 is the widest read on the surface** — four roles hold it outright and the implementation grant holds it conditionally. Row 2 is the narrowest read that is not a prohibition, and the two together are the draft‑visibility boundary that `AC-STU-048` (L32013) tests.

**The taxonomy (L31890).** *"the eight starter Job Types and the eight starter Service Type tags"*. Job Type is structural: *"every Workflow carries exactly one, the Delivery Operations Hub filters workflow selection by it, and it is available at every commercial tier"*. Service Type is optional and *"never decides platform behaviour and nothing structural may hang on it"*.

**`DEC-TAX-002`, adopted working position (L31892):** *"The platform-seeded catalogue of Job Types and Service Type tags ships empty: zero seeded entries at version 1. Every tenant creates its own Job Types and Service Type tags immediately, on every tier, with no platform approval step, so no tenant is blocked."* L31894 is unambiguous that **the sixteen names are not invented**: *"no screen, table, or example in this chapter names a starter Job Type or Service Type tag as though it were canonical."*

**The internal tension in that card, recorded rather than smoothed.** The card's own option (c) — *"the platform ships with an empty seeded set and every tenant creates its own"* — is listed as **contradicting §5.3.2**, and the adopted position is materially option (c). L31896 reconciles it: *"Because the mechanism and the counts are preserved and only the load is deferred, §5.3.2's eight-and-eight statement is satisfied on delivery of the names rather than contradicted."*

**`DEC-TAXROLE-001` (L31914).** Which tenant role may create a custom type is not stated. *"an uncontrolled custom Job Type list degrades Workflow selection on the floor."* Recommendation: Tenant Admin in the tenant administration area, Quality Manager consulted.

**The zero‑is‑forbidden rule (L31930, L31956, `AC-STU-053` L32018).** *"linkage counts unavailable from the Delivery Operations Hub render as 'Linkage unavailable, last retrieved at' with the timestamp, never as zero"* — because *"showing zero linked Jobs would invite an author to change a Workflow they believe is unused."* This is the same defect shape as slice 4's loading‑never‑renders‑a‑zero rule, on a different axis.

**Objects.** `OBJ-STU-WORKFLOW` (L31922) = `OBJ-036` (L8589).

**Security (L32004).** *"a Workflow identifier from another tenant returns a refusal, not an empty result, and the attempt is audited."*

---

### MOD‑STU‑04 — Workflow Builder

**Section §5.4. Card L32032‑L32193. THIS IS THE EXEMPLAR MODULE.**

**Purpose (L32053):** *"Set Workflow-level settings and defaults, and assemble the screen sequence and branch targets that are simultaneously the worker's path and the sequence-detection reference."*
**User benefit (L32054):** *"One drawing produces the worker's route, the skip detector's reference, and the deviation router's default path."*

**The four settings and the exactly two inheritable defaults — L32040, quoted whole because the word "exactly" is load‑bearing:**

> *"Each Workflow carries four settings set before screen authoring begins — **name, Job Type, the optional Service Type tag, and locale coverage** (English and Spanish at launch) — and **exactly two** workflow-level defaults that every screen inherits unless overridden: **the default escalation routing template and the default coaching trigger percentage**. Deviation severity is never a workflow default; it is always mapped explicitly per screen. The word 'exactly' is the source's own and is load-bearing: an implementation that adds a third inheritable default, however convenient, departs from the specification and must be raised as a change request."*

**The dual role of the canvas — L32042, the single most load‑bearing sentence in the module:**

> *"The canvas presents the Workflow as a sequence of screen nodes connected by navigation arrows, and supports conditional branching — a measurement screen may route to the next standard screen when in tolerance and to a deviation-capture screen when out of tolerance. **The screen order and branch targets drawn on this canvas are also the reference the sequence-detection mechanism compares against at run time: an out-of-order or skipped screen is a deterministic sequence deviation.** This dual role is the single most important thing an author must understand about the canvas. The drawing is not documentation. It is the rule."*

**Gate‑failure branching (L32044).** *"When a worker fails a gate, the branch target defaults to a platform-standard deviation-capture screen — the author does not have to draw a failure path on every gated screen. A per-screen override is available for non-standard flows. The platform deviation-capture forms are part of the offline package, so the default path works without connectivity."*

**Fork strategy (L32046).** *"Where the work differs significantly — a different variant, a different method, a substantively different screen sequence — author separate Workflows and link the right one per Run at assignment in the Delivery Operations Hub. Where the fork is light — a conditional re-check, a tolerance-dependent routing, a deviation path — use branches within one Workflow. The canvas is for in-run routing, not for variant management."*

**Screens.** `SCR-STU-CANVAS` (L31071) / `SCR-STU-03` (L48261); `SCR-STU-BUILDER` (`SB-011-01`, L68164). Storyboard `SB-STU-07` (L32144): *"A left panel holds the four Workflow settings and the two inheritable defaults, each labelled with whether it is inherited by screens. The centre holds the node graph with drag-to-reorder and click-to-configure. A right panel holds structural validation results as a live list: unreachable nodes, dangling branch targets, screens with no severity mapping, screens missing a curated coaching default in a declared locale. Each validation item names the specific screen and is clickable. A Preview Sequence control walks the graph in worker order. The panel's heading states plainly: 'This drawing is also the sequence-detection reference used at run time.'"*

**States (L32080).** *"Inherits the Workflow lifecycle. Within Draft, a Workflow structure is additionally either **structurally valid** (every node reachable, every branch target resolvable, exactly one entry point) or **structurally invalid**, and a structurally invalid Workflow cannot be submitted."*

**Permission matrix — L32059‑L32070, ten data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker | Implementation team grant |
|---|---|---|---|---|---|---|---|
| Open the canvas for a Draft Workflow | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions — onboarding only |
| Open the canvas read-only for a Published version | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions |
| Set the four Workflow settings | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Set the default escalation routing template | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Set the default coaching trigger percentage | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Set a workflow-level default severity | Explicitly prohibited — severity is never a workflow default | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Add, remove, and reorder screen nodes | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Draw a conditional branch | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Override the platform-standard gate-failure target on a screen | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Preview the sequence | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions |

**Rows 1 and 2 are the load‑bearing pair.** The Supervisor without the grant and the Tenant Admin are `Explicitly prohibited` on the *draft* canvas and `Read-only` on the *published* canvas. A build that renders one canvas component with a read‑only flag will get row 2 right and row 1 wrong: the draft canvas must not be **reachable**, not merely non‑editable. `AC-STU-048` (L32013) and `AC-STU-151` (L34668) both test the read, not the render.

**Row 6 is the prohibition the whole module is shaped around.** `FUNC-STU-04-01-C-1` (L32094) makes the refusal a functionality with fallback `FB-STU-10`, and `AC-STU-055` (L32180) closes the API route as well as the control: *"No user interface control or application programming interface route sets a workflow-level default severity."*

**Alternate paths (L32120), each a build obligation.** *"Where a branch target is deleted, the branch is flagged as dangling and the Workflow becomes structurally invalid until the author supplies a target; the platform does not silently reroute. Where the author has drawn a variant tree that exceeds a reasonable branch depth, the fork guidance surfaces a recommendation to split into separate Workflows; **the recommendation never blocks**. Where no escalation routing template exists, the workflow default cannot be set and, where the containment response capability is enabled, publication is blocked with the missing default named."*

**Reconnect behaviour (L32152), and the reason it is not optional.** *"Structural validation re-runs in full on reconnection before submission is re-enabled, because a validation result computed before a dependency changed is stale data… an example is a branch target that validated successfully before another author deleted the target screen."*

**Security (L32171), and it is the scope rule in its surface‑specific form.** *"Read-only roles receive a rendered view with no editing affordances rather than a disabled editor, so a read-only user cannot construct an edit request from the client."*

**Objects.** `OBJ-STU-WORKFLOW`, `OBJ-STU-SCREEN` (L32078).

**Acceptance criteria (L32179‑L32183).** `AC-STU-054` exactly four settings and exactly two inheritable defaults, no third. `AC-STU-055` no route sets a workflow-level default severity. `AC-STU-056` *"The published sequence-detection reference is identical to the drawn screen order and branch targets, with no separate authoring path."* `AC-STU-057` a gated screen with no drawn failure path routes to the platform‑standard deviation‑capture screen and that form is present in the offline package. `AC-STU-058` a Workflow with an unreachable node or a dangling branch target cannot be submitted.

---

### MOD‑STU‑05 — Screen Authoring and the Nine Configuration Sections

**Section §5.5. Card L32195‑L32433.**

**Purpose (L32210):** *"Configure every screen the worker meets, supplying each agent capability with the information it requires."*
**User benefit (L32211):** *"One panel produces the worker's instruction, the proof requirement, the tolerance, the coach's trigger, and the deviation response together, so they cannot drift apart."*

**The atomic-unit rule (L32201):** *"A screen is the atomic unit of authoring and execution: one screen in the Builder corresponds exactly to one screen on the worker's device and one unit of execution telemetry… **There is no intermediate sub-screen construct.**"* And: *"Instruction content is embedded per screen; there is no separate work-instruction document at launch, and the difficulty levels of `MOD-STU-09` are renderings of this embedded content, not separate documents."*

**Section visibility (L32203):** *"Sections not relevant to the selected input type are not displayed — Section 5 appears only on measurement screens — Sections 8 and 9 are optional, and, per the capability principle, **each section exists because an agent capability requires the information it captures.**"*

**The nine sections — L32216‑L32226, nine data rows, quoted whole.**

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

**Section 4's boundary, stated so it cannot be softened (L32236):** *"A hard gate blocks advance until the required proof is captured and valid; a soft gate permits advance while recording the missing proof as an evidence gap for follow-up. This authored choice governs proof capture only. It is distinct from the platform's specification gate, which is hard platform-wide: an out-of-tolerance measurement always registers as a deviation and always classifies a severity, and no author or tenant setting can configure that away. **A soft proof gate never softens the specification gate.**"*

**Section 7's no-assumption rule (L32244):** *"What the author does in Section 7 is map the screen into that catalog, and **the platform never assumes a value — severity must be set explicitly on every screen that can deviate**"*, split two ways: *"**Non-measurement screens** (photo, scan, signature, checkbox, and similar): a deviation is binary, and the author maps it to a single catalog level. **Measurement screens**: severity is graduated. The author defines bands tied to the degree of departure from the specification limits, each band mapping to a catalog level and each able to carry its own containment checklist and escalation routing template. At minimum one mapping is required, covering any out-of-tolerance reading."*

**`DEC-CAP-001`, the capture-type contradiction, and why it is a build blocker (L32232).** *"Both the platform canon and the Studio state that there are **seven** capture types at launch, but **the two sets differ**. §1.7 and §7.8.3 list measurement, scan, photo, **checklist**, **boolean**, electronic signature, and free text. §5.5.3 lists measurement entry, photo capture, barcode or QR scan, **checkbox confirmation**, digital signature, free text, and **dropdown selection**… This matters concretely: **a Frontline player cannot render a type the contract does not name.**"* **Adopted working position: the §5.5.3 set**, with *"checkbox confirmation carrying a multiplicity setting, so one confirmation is what §1.7 and §7.8.3 call a boolean and many confirmations are what they call a checklist; the merge removes a type name and no capability."*

**Screens.** `SCR-STU-PANEL` (L31072) / `SCR-STU-04` (L48262). Storyboard `SB-STU-08` (L32379): *"A vertical accordion with nine numbered sections, each showing a completion indicator: complete, incomplete with the missing element named, or not applicable with the reason. Section 5 is absent unless measurement entry is selected. Sections 8 and 9 are collapsed by default and labelled optional. Section 7 shows, beneath the band editor, a live consequence preview: for each band, the catalog level, the tenant's configured action bundle for that level, and, for Severity 1, the platform floor stated in full. A footer states the screen's state and, where Incomplete, lists every blocking element with a link."* Also `SB-25-02` (L48298‑L48315), a fifteen-field panel spec for the same screen, and `SB-011-01` (L68164).

**States (L32277).** *"A screen is **Incomplete** while any mandatory element for its input type is missing, **Configured** when all are present, and **Published within a version** thereafter. Publication is blocked while any screen in the Workflow is Incomplete."*

**Permission matrix — L32257‑L32267, nine data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|
| Open the configuration panel on a Draft screen | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Author Sections 1 through 9 | Allowed — full authoring across all nine sections | Allowed — author all nine sections | Read-only on published content only | Read-only on published content only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Choose the input type | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Set a hard or soft proof gate | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Soften the platform specification gate | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Define a new severity level | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Map a band to a catalog level | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Edit a tenant action bundle | Explicitly prohibited — the tenant administration area owns it | Explicitly prohibited | Explicitly prohibited | Allowed — in the tenant administration area, above the floor only | Explicitly prohibited | Explicitly prohibited |
| Add a screen-level qualification override | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |

**Row 8 is the second inversion on the surface** — the Tenant Admin holds what the Quality Manager does not, and again the Quality Manager's cell names the owner rather than leaving a bare prohibition. The Auditor cell here is `Explicitly prohibited`, **not** `Client Decision Required`, because the act is outside the Studio entirely.

**Alternate paths (L32337), each a build obligation.** *"Where the input type changes after configuration, values belonging to sections that are no longer relevant are **retained and marked inactive rather than deleted**, so that reverting the input type restores them; this prevents an accidental type change from destroying a specification limit. Where a capability is disabled while a screen is configured against it, the section freezes read-only and publication is blocked with the screen named. Where a chosen capture type falls outside the adopted `DEC-CAP-001` set of seven, publication is blocked with the offending type named."*

**The per-functionality fallback differences that are publication blockers (L32287, L32291, L32301, L32304, L32308, L32313, L32321).** An unresolvable image reference blocks publication *"rather than publishing a screen with a broken image"*. A capture type outside the seven is blocked *"with the offending type named, because publishing a type the device cannot render would strand a worker mid-Run"*. A measurement screen with no limits *"cannot be published, because the specification gate would have nothing to check against"*. A missing coaching default *"in a declared locale blocks publication in that locale"*. At minimum one severity mapping *"is mandatory and its absence blocks publication"*. If the Severity 1 arming confirmation *"cannot be recorded, the mapping is not saved"*. An override *"naming a certification the tenant does not maintain blocks publication with the certification named"*.

**Objects (L32275).** `OBJ-STU-SCREEN`, and by reference `OBJ-STU-CHECKLIST`, `OBJ-STU-ROUTING`, `OBJ-STU-ASSET`, `OBJ-STU-BLOCK`, `OBJ-STU-QUALREQ`.

**Accessibility, called out by the source itself (L48332).** *"The configuration panel is the densest screen on the platform and is the accessibility risk: nine sections, conditional visibility, and per-locale, per-level text fields. Every section is a landmark region with a heading, the conditional appearance of section five is announced rather than silent, and every validation message is associated with its field programmatically. Keyboard traversal follows section order, and the canvas is operable without a pointing device, with branch targets selectable from a list as well as by drag."*

---

### MOD‑STU‑06 — Shared Instruction Blocks

**Section §5.6. Card L32435‑L32572.**

**Purpose (L32450):** *"Author instruction context once at Workflow level and apply it to any number of screens within that Workflow."*

**The defining constraint, and the source says it is easy to get wrong (L32443):** *"That scoping rule is the module's defining constraint and is easy to get wrong in implementation. **A block is not a library item. It has no cross-Workflow reuse, no independent version number, and no separate governance: it lives inside its Workflow and is published, diffed, and archived with it.**"* L32441: *"Blocks are scoped to a single Workflow and do not appear in the Content Libraries."*

**Screens.** `SCR-STU-BLOCK` (L31073) / `SCR-STU-05` (L48263). Storyboard `SB-STU-09` (L32523): *"A panel listing every block in this Workflow with its title, the count of applying screens, and its locale and difficulty coverage state. Opening a block shows a per-locale, per-difficulty-level editor and a live list of applying screens, each clickable. A prominent line states: 'Blocks belong to this Workflow only. They are not Content Library items and cannot be used in another Workflow.' A delete control is disabled while applying screens exist, with those screens named."*

**States (L32473).** *"Draft, Applied to one or more screens, Published within a version. A block with no applying screens is Draft and orphaned, and is reported as an unused block at submission rather than blocking it."*

**Permission matrix — L32456‑L32463, six data rows.** The narrowest matrix on the surface.

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|
| Create a block within a Workflow | Allowed | Allowed — create and apply Shared Instruction Blocks | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Apply a block to a screen | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Edit a block, propagating to every applying screen | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Remove a block from a screen | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Reuse a block in another Workflow | Explicitly prohibited — blocks are scoped to a single Workflow | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Read a block on published content | Read-only | Read-only | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited — workers meet the rendered result on the device, not the block |

**Note the last cell.** It is the only Worker cell on the surface that carries an *explanation* rather than a bare prohibition, and the explanation is a cross-surface statement: the worker meets the rendered composition, never the block.

**The propagation honesty rule (L32480, `AC-STU-070` L32562).** *"because a block edit changes worker-facing instruction content, it is a content change requiring republication, which means propagation is not instantaneous on the floor and **no view may suggest otherwise**."* And L32500: *"Where a block is edited after the Workflow is published, the change lands in a new draft and reaches the floor only through a new published version and its adoption; **no propagation occurs to a pinned package**."*

**The audit shape that a reviewer must see (L32548).** *"Block creation, edits, applications, and removals are captured in the draft revision history and surface in the screen-level diff **for every affected screen, so that a reviewer sees eight changed screens rather than one changed block**."*

**Objects.** `OBJ-STU-BLOCK`, `OBJ-STU-SCREEN` (L32471). `OBJ-039` at L8646.

---

### MOD‑STU‑07 — Content Libraries

**Section §5.7. Card L32574‑L32784.**

**Purpose (L32587):** *"Hold the tenant's reusable containment checklists, approved coaching assets, and escalation routing templates, referenced by pointer from screens."*

**The pointer model (L32580):** *"Items are authored or uploaded once and referenced from many screens via pickers; **screens hold pointers, so updating a library item propagates to every screen that references it.** Two of these libraries are not merely convenient — they are what give the agents something to act on."*

**Screens.** `SCR-STU-CHECKLIST`, `SCR-STU-CORPUS`, `SCR-STU-ROUTING` (L31074‑L31076) / `SCR-STU-06`, `SCR-STU-07`, `SCR-STU-08` (L48264‑L48266). Storyboard `SB-STU-10` (L32725): *"Three tabs, one per library. Each list shows item name, state, the count of referencing screens, and the count of Workflows affected. Opening an item shows its content, its reference list, and — for a published item — a banner reading 'This item is in force on the floor. Edits pass review before taking effect.' The Coaching Corpus tab additionally shows per-asset index state, language variant coverage, and resolution rate, with flagged assets grouped at the top. The Escalation Routing tab shows, per template, one row per severity level with recipient roles, channels, acknowledgement timeout, fallback recipients, and dedupe window, and a plain-language line stating that roles resolve to people on shift at run time with no on-call calendar."*

**States (L32647).** *"Checklists and templates: Draft, Published, Archived. Coaching assets: Uploaded, Approved, Indexed, Flagged for review, Retired. An asset that is Approved but not yet Indexed is retrievable only by metadata filter, not by semantic ranking, and the screen's curated default carries coaching until indexing completes."*

**Permission matrix — L32626‑L32637, ten data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|
| Create a Content Library item | Allowed — the Quality Manager owns the Content Libraries | Explicitly prohibited — may propose only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Edit a Content Library item | Allowed with conditions — edits to published items pass review; scope under `DEC-LIBREV-001` | Explicitly prohibited — may propose only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Archive a Content Library item | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Propose a Content Library change through the approval chain | Allowed | Allowed — propose Content Library changes | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Reference a library item from a screen picker | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Approve a coaching asset into the corpus | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Retire a flagged coaching asset | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Name an individual as an escalation recipient | Explicitly prohibited — templates name roles, never individuals | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Add a notification channel beyond in-app and email | Explicitly prohibited — two channels only at V1 | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Read published library content | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |

**This matrix carries the surface's sharpest DISABLED-with-reason case.** Rows 1, 2, 3, 6 and 7 give the Quality Manager `Allowed` and the Supervisor-with-grant `Explicitly prohibited — may propose only`, while row 4 gives that same Supervisor `Allowed`. The prohibition is a **routing** rule, not a categorical one: the control exists on the same screen for the Quality Manager and the Supervisor's own alternative — Propose — is one row below. Slice 4's `FB-QUAL-005` reading applies exactly: the disabled control teaches the rule at the moment it binds.

**The four properties that keep the corpus safe, verbatim in substance (L32599‑L32602):**
1. *"**Curation is retained.** Only approved content enters the corpus; the agent selects only from what the quality team sanctioned. Embeddings change how an asset is found, never whether it was approved."*
2. *"**Retrieval is hybrid.** A metadata filter narrows the corpus before semantic ranking, so a torque clip cannot surface on a paint screen."*
3. *"**A default is retained.** Each screen or failure type keeps a curated fallback asset per locale for cold start, before there is effectiveness data to learn from."*
4. *"**Retrieval quality is evaluated.** Retrieval behaviour is checked against scenario evaluations from day one, exactly like every other agent capability."*

**Escalation Routing Templates — the three things a rule names (L32612‑L32614).** *"**Recipient roles** — never named individuals, for example Line Supervisor, Quality Manager; **Channels** — in-app and email, the platform's only notification channels; other channels are outside launch scope; **Response behaviour** — whether acknowledgement is required, the timeout to wait for it, the fallback recipients to escalate to if no acknowledgement arrives in time, and a dedupe window that groups a flood of related deviations into a single alert."*

**Run-time resolution (L32616):** *"**Resolution is on-shift only; there is no separate on-call calendar.** … **It executes the template; it never chooses recipients.**"*

**Three open decisions live in this module.** `DEC-LIB-001` (L32591) — pointer propagation against package pinning, both readings preserved, recommendation pinning semantics. `DEC-LIBREV-001` (L32622) — what "lightweight review" removes, recommendation the full three-stage chain with a scoped preview, *"Until it is decided, this blueprint treats library edits as passing the full chain and records the divergence."* `DEC-EMBED-001` (L32606) — the data-processing posture for the external embedding model over media that may contain identifiable workers.

**The archival refusal (L32691, `AC-STU-077` L32769).** *"Where an item is archived while screens still reference it, the archival is refused and the referencing screens are named, because a dangling pointer would leave a screen with no containment or no routing."*

**The containment-step constraint that authoring must enforce (L32653).** Under `DEC-CONTLAUNCH-001`'s adopted position the checklist launches locally from the package, which *"requires every step to be fully renderable from the package with no server call — a step that requires a server lookup cannot be a launch-time step, **and authoring must refuse it**."*

**Objects.** `OBJ-STU-CHECKLIST`, `OBJ-STU-ASSET`, `OBJ-STU-ROUTING` (L32643). `OBJ-040`, `OBJ-041`, `OBJ-042`, `OBJ-043` at L8665‑L8722.

**The asymmetry the diagram exists to show (L32723).** *"All three libraries feed screens by pointer, and only two of the three reach the device: containment checklists and coaching assets ship in the package, while escalation routing resolves server-side through the Delivery Operations Hub at run time. That asymmetry is why an offline device can contain a deviation but cannot escalate one until it syncs."*

---

### MOD‑STU‑08 — Training Library

**Section §5.8. Card L32786‑L32937.**

**Purpose (L32809):** *"Author, version, and publish long-form instructional content delivered online-only and excluded from the offline work package."*

**Its five rules, stated exactly (L32796‑L32800):**
1. *"Content is **versioned and audited exactly like work instructions**, passing the same approval chain and carrying the same permanent history."*
2. *"Content is **authored and uploaded per language** (English and Spanish), with no run-time translation."*
3. *"Delivery is **online-only**: Training Library content is viewed over a connection, is excluded from the offline work package, and never competes with run-critical content for device storage. Storage, entitlement, and package-exclusion controls sit platform-side."*
4. *"Consuming training content **produces no production record**: viewing is not execution, generates no run telemetry, and never substitutes for a qualification. Qualifications and certifications remain Delivery Operations Hub master data."*
5. *"**Practice mode** — rehearsing a Workflow without producing a production record — **is cut from scope.** If it resurfaces, it is handled as a change request, not an assumed feature."*

L32802: *"Rule five is a scope boundary rather than a behaviour, and this blueprint honours it: **no practice-mode behaviour is designed, proposed, or implied anywhere in this chapter.**"*

**Screens.** `SCR-STU-TRAINING` (L31077) / `SCR-STU-09` (L48267). Storyboard `SB-STU-11` (L32887): *"A list of items with title, language coverage, version, status, and last published date. An upload control accepts long-form content and states the entitlement and remaining storage. A prominent banner reads: 'Training content is delivered online only. It is excluded from offline work packages, generates no production record, and never substitutes for a qualification.' Each item shows its approval log."*

**States (L32835).** Draft, In Review, Published, Archived — *"mirroring the Workflow lifecycle because the source requires the same chain and the same permanent history."*

**Permission matrix — L32815‑L32825, nine data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|
| Author and upload Training Library content | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Submit content into the approval chain | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Review a submission | Allowed with conditions — not on own submission | Allowed with conditions — not on own submission | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Release and publish | Allowed with conditions — Release Authority by tenant default, not on own submission | Explicitly prohibited — cannot approve or release | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Archive content | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Read published training content in the Studio | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited — workers view it through the Frontline Training Library Viewer |
| View published content on the device | Not applicable — the Studio is the authoring surface | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Allowed with conditions — online only, through the Frontline Training Library Viewer |
| View published content on the device while offline | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Unavailable — delivery is online-only and content is excluded from the offline work package |
| Have viewing count as execution or as a qualification | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**Rows 7 and 8 are the only rows on the entire surface where the Worker column is the only non-`Not applicable` cell**, and row 8 is one of exactly two places on the surface where the token `Unavailable` is used in the withheld-in-this-condition sense rather than the never-held sense. Both rows describe a **Frontline** consequence and neither is a Studio control — exactly the case L31515's convention exists to cover. A build that renders either as a Studio control invents a screen.

**The package-integrity consequence (L32918, `AC-STU-080` L32922).** *"On restoration, package definitions are re-verified to confirm no training item was included; any inclusion is treated as a package integrity failure and the package is quarantined rather than delivered."*

**Objects.** `OBJ-STU-TRAINING` (L32833) = `OBJ-044` (L8741).

---

### MOD‑STU‑09 — Work-Instruction Difficulty Levels

**Section §5.9. Card L32939‑L33088.**

**Purpose (L32956):** *"Provide three reviewed renderings of the same instruction content so each worker reads at the depth that suits them, without any variation in what the platform enforces."*

**The rule (L32945):** *"Every screen's instruction content exists at three difficulty levels — **simple, standard, and expanded**. The author writes one level; the platform's artificial intelligence drafts the other two; and every artificial-intelligence-drafted level passes the full review chain before publication — no generated rendering reaches a worker unreviewed. A field on the worker profile selects which level the Frontline surface renders for that worker; **the level changes the depth of explanation, never the required captures, gates, limits, or severity mappings, which are identical across levels.**"*

**The six-rendering count (L32947):** *"Combined with locale coverage, **a fully covered screen's instruction content exists in six authored renderings — three levels by two locales — every one of which passed review**; the publish-time completeness check verifies coverage."*

**Screens.** Within Section 1 of `SCR-STU-PANEL`. Storyboard `SB-STU-12` (L33038): *"three tabs labelled Simple, Standard, and Expanded, each with a locale sub-selector. The tab the author wrote is marked 'Authored'; the others are marked 'Drafted, awaiting your edit' or 'Reviewed'. A coverage strip above shows six cells, one per level and locale, each green when reviewed and red with the specific gap named when not. A permanent line reads: 'Difficulty levels change explanation depth only. Captures, gates, limits, and severity mappings are identical across all levels.'"* Also `SB-011-02` `SCR-STU-DIFFICULTY` (L68164).

**States (L32981).** *"Per level per locale: Authored, Drafted by artificial intelligence, Edited, Reviewed, Published within a version. A level that is Drafted but not Reviewed blocks publication."*

**Permission matrix — L32964‑L32971, eight data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|
| Author one difficulty level of a screen's instruction | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Request artificial-intelligence drafting of the other two levels | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Edit a drafted level before submission | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Review drafted levels in the chain | Allowed with conditions — not on own submission | Allowed with conditions — not on own submission | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Publish a level that has not been reviewed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Make a level change a capture, gate, limit, or severity mapping | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Set the difficulty level on a worker profile | Not applicable — the profile field is Delivery Operations Hub master data | Allowed — supervisor-entered worker record maintenance in the Delivery Operations Hub | Allowed — same reason | Allowed — same reason | Read-only | Explicitly prohibited — no self-selection is specified |
| Read all three levels of published content | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Allowed with conditions — the worker sees only the level their profile selects |

**Row 7 is the one row on the surface where the Read-only Auditor gets a definite status** — `Read-only`, not `Client Decision Required` — and the reason is that the act is a Delivery Operations Hub act where the Auditor's read authority is settled. It is also the row where the Supervisor **without** the grant holds something the Quality Manager does not.

**Row 8's Worker cell is the only `Allowed with conditions` in a Worker column anywhere on the surface**, and it is a Frontline consequence, not a Studio control.

**`DEC-WIDIFF-001` (L32949), and the trap inside it.** The source's **interim rule** is *"Until it resolves, the package definition carries instruction content at all levels"* and `AC-STU-090` (L33077) requires that interim rule to be applied. The source's **recommendation** is option (c) — the assigned worker's level plus the standard level as a substitution fallback. **They differ, and the interim rule wins**, because it is the one carrying an acceptance criterion. L33088 confirms: *"Packaging: `Client Decision Required` — `DEC-WIDIFF-001`, with the source's interim rule applied."*

**The equivalence guarantee (`FUNC-STU-09-01-C-1`, L32991; `AC-STU-088`, L33075).** *"Required captures, gates, specification limits, and severity mappings are byte-identical across all three levels."* `TEST-STU-093` (L33083): *"Attempt to configure a level-specific specification limit; confirm no such path exists."*

**The unset-profile default (L33011, L32998).** *"Where a worker's profile field is unset, the standard level is rendered as the defined default"* — *"a defined default rather than an absence."*

**Objects.** `OBJ-STU-SCREEN`, `OBJ-STU-BLOCK`, `OBJ-STU-PACKAGE` (L32979).

---

### MOD‑STU‑10 — Parts-Registry Authoring Seam

**Section §5.10. Card L33090‑L33231.**

**Purpose (L33105):** *"Let an author reference a part that does not yet exist without leaving the authoring context or stalling on master data."*
**Owning surface (L33104):** *"Standards and Operations Studio (`SURF-STU`), **writing a skeletal record into Delivery Operations Hub master data**"* — the only module on the surface whose owning-surface row names a write into another surface.

**The rule (L33096):** *"The Studio provides **one deliberate seam** so authoring never stalls on missing master data: while authoring a work-instruction step, the author may inline-add a part through a **name-only mini-form**. The platform mints the part identifier; the skeletal record lands in the Delivery Operations Hub registry for completion there. Parts are referenced from the work-instruction step, and **a part reference is optional per part — a step is never forced to carry one**."*

**Screens.** `SCR-STU-PARTADD` (L31088, catalogue A only — catalogue B has no row). Storyboard `SB-STU-13` (L33178): *"A small inline panel inside the work-instruction step editor with a single field labelled 'Part name' and two controls, Add and Cancel. Below the field, a line reads: 'This creates a skeletal record in the parts registry. Complete it in the Delivery Operations Hub. The platform assigns the identifier.' Once added, the step shows the part name with a 'Skeletal' badge that clears when the registry record is completed."*

**States (L33129).** *"The registry record is Skeletal until completed in the Delivery Operations Hub, then Complete. The Studio never advances the state; it only creates the Skeletal record."*

**Permission matrix — L33113‑L33119, seven data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|
| Reference an existing part from a work-instruction step | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Inline-add a part through the name-only mini-form | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Mint the part identifier | Explicitly prohibited — the platform mints it | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Complete a skeletal part record | Not applicable — completion happens in the Delivery Operations Hub parts registry | Not applicable — same reason | Not applicable — same reason | Allowed — in the Delivery Operations Hub, subject to its own permissions | Read-only | Explicitly prohibited |
| Edit registry fields from the Studio beyond the name | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Delete a part from the Studio | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Force a step to carry a part reference | Explicitly prohibited — a part reference is optional per part | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**Row 4 is the seam made visible in the matrix**, and it is the second row on the surface where the Auditor gets `Read-only` rather than `Client Decision Required` — again because the act is a Hub act.

**The three refusals that are not negotiable.**
- **Confirmation before attachment (`FUNC-STU-10-02-B-1`, L33143; `AC-STU-096`, L33220):** *"if the hand-off cannot be confirmed, the reference is not created, because a reference to a part that does not exist in the registry would break genealogy."*
- **Suspension is not a technical fault (`FUNC-STU-10-02-C-1`, L33145; `AC-STU-095`, L33219):** *"the author is told the tenant's suspension state is blocking master-data writes, not that the registry is down, because **presenting a commercial state as a technical fault would be dishonest.**"* This inherits slice 4's soft-suspension write-class table directly: *"under soft suspension, master-data writes are blocked, including new parts"* (L33121).
- **Unresolvable references block submission (L33211):** *"a reference whose record cannot be found is flagged by step and part name and blocks submission, because a package carrying an unresolvable part reference would break the consumption record."*

**`DEC-PARTSTUB-001` (L33203).** The review interval for an incomplete skeletal record is not specified. Recommendation: a tenant-configurable interval defaulting to seven days. *"an accumulation of name-only stubs degrades the registry's usefulness for genealogy and reporting."*

**Objects.** The Delivery Operations Hub parts registry record, owned by Chapter 18; `OBJ-STU-SCREEN` for the reference (L33127).

**Security (L33207).** *"The seam is a single, narrow write path with exactly one writable field. It cannot be used to edit or delete an existing registry record."*

---

### MOD‑STU‑11 — Approval Workflow

**Section §5.11. Card L33233‑L33416.**

**Purpose (L33262):** *"Enforce three-stage human sign-off with separation of duties on every piece of content that reaches the frontline."*
**User benefit (L33263):** *"A wrong specification limit has to survive three people to reach a worker, and the record of who passed it is permanent."*

**The chain, verbatim (L33239‑L33243):**

> ***"No Workflow content reaches the frontline without explicit human sign-off at each stage.** The chain has three stages:
> - **Author** — completes the Workflow and submits it for review.
> - **Reviewer** — a qualified peer or senior quality engineer opens the submission from the Approval Queue, steps through each screen in preview, reviews instruction text, specification limits, coaching content, and deviation rules, and either returns the Workflow with comments or advances it. **The Reviewer cannot edit content directly — corrections go back to the Author.**
> - **Release Authority** — grants final publication sign-off against the diff and the change summary, creating a new version. **The Release Authority cannot be bypassed.**"*

L33245: *"Separation of duties is enforced: the Reviewer must be a different person from the Author, and no role in the chain can perform two stages on the same submission. Every transition is permanently recorded with role, timestamp, version, and comments."*

**Release Authority assignment (L33247).** *"Release Authority defaults to the Quality Manager as a tenant-level default, with a per-workflow override where a specific Workflow warrants a different releaser. **It is not assigned per Service Type** — nothing structural hangs on the tag."*

**Screens.** `SCR-STU-QUEUE` and `SCR-STU-PREVIEW` (L31079‑L31080) / `SCR-STU-11` (L48269); `SCR-STU-DRAFTAI` the pre-approval editing surface (L31089). Storyboard `SB-STU-14` (L33357): *"The queue lists submissions with Workflow name, submitting Author, submission time, ageing indicator, and stage. Opening a submission enters a screen-by-screen preview that renders each screen exactly as the worker will see it, in a chosen locale and difficulty level, with a right-hand panel showing the four review obligations named in the source — instruction text, specification limits, coaching content, deviation rules — each with a tick and a comment box. Controls at the foot read Return with comments and Advance. **The Advance control is disabled with a stated reason if the reviewer is the Author.** At the Release Authority stage the preview is replaced by the diff and the change summary, with Release and Decline controls and a mandatory reason field on Decline."*

**States (L33289).** *"Submitted, Returned with comments, Advanced, Released, Withdrawn. A submission may cycle between Submitted and Returned any number of times; each cycle is recorded."* The state diagram at L33335‑L33352 adds Drafting, UnderReview and AwaitingRelease; `SEQ-012`'s diagram at L68297‑L68312 adds Revising and Stalled. See D21.

**Permission matrix — L33268‑L33279, ten data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker | Implementation team grant |
|---|---|---|---|---|---|---|---|
| Author and submit | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — onboarding only |
| Review a submission | Allowed with conditions — not their own submission, and not if they will release it | Allowed with conditions — act as Reviewer on submissions they did not author | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Edit content while reviewing | Explicitly prohibited — the Reviewer cannot edit; corrections go back to the Author | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Return a submission with comments | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Advance a submission to release | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Release and publish | Allowed with conditions — Release Authority by tenant default, never on a submission they authored or reviewed | Explicitly prohibited — cannot approve or release | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Hold a per-workflow Release Authority override | Allowed with conditions — assignment eligibility is `DEC-RELAUTH-001` | Client Decision Required — `DEC-RELAUTH-001` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Assign Release Authority per workflow | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Bypass the Release Authority | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Read the approval log | Allowed | Allowed | Read-only | Read-only — holds no stage of the chain | Client Decision Required — `DEC-AUDSTU-001`; the Delivery Operations Hub audit log is the specified route | Explicitly prohibited | Allowed with conditions |

**The implementation-team column is `Explicitly prohibited` on nine of ten rows** and the tenth is the read. That column is the separation-of-duties floor made visible: *"Approval authority rests with the tenant from day one"* (L33251).

**Identity, not role (L33389).** *"Person distinctness is checked against identity, not against role, because multi-role is additive and the audit log records identity and action rather than 'acting as role'. A user holding both the Supervisor and Quality Manager roles is still one person and still cannot occupy two stages."*

**Reconnect behaviour, and it is the honesty rule for this module (L33365).** *"A transition interrupted by connectivity loss is not recorded, so the submission remains at its prior stage; on reconnection the actor sees the true stage and repeats the transition. **No transition is ever inferred from a partial request.**"*

**`DEC-LANEB-001` (L33253), the surface's named-test-strength contradiction.** Reading (a): the chain is absolute and a Lane-B patch must still pass Reviewer and Release Authority. Reading (b): the Lane-B decision by a Quality Manager in the Client Command Center *is* the human sign-off. Recommendation: *"reading (b) restricted to values that cannot alter a specification limit, a severity mapping, or a gate rule, with any Lane-B proposal touching those three routed through the full chain."* **`AC-STU-097` (L33397) and `AC-STU-138` (L34332) cannot both hold for a package-borne Lane-B value.** The only instruction binding both sides is `AC-STU-104` (L33404) and `AC-STU-143` (L34337): the tension must be **surfaced**, not implemented silently.

**`DEC-RELAUTH-001` (L33255), the silent operational deadlock.** *"a tenant with exactly one Quality Manager and one authoring-grant holder can author and review but cannot release, because releasing would require the reviewer to perform a second stage. The Workflow stalls and the floor keeps running on the prior version, which is safe but is also a silent operational deadlock."* Recommendation: option (a), a pre-submission staffing check naming the shortfall, *"because a deadlock discovered at release time wastes an entire authoring cycle."*

**Withdrawal is a recommendation, not a fact (L33296).** *"Source status: `Recommendation — R&D`; the Statement of Work does not describe withdrawal… No client decision required, because withdrawal weakens no control."*

**Objects.** `OBJ-STU-SUBMISSION`, `OBJ-STU-WORKFLOW`, `OBJ-STU-VERSION` (L33287). `OBJ-050` Approval record at L8856.

---

### MOD‑STU‑12 — Versioning and Publication

**Section §5.12. Card L33418‑L33602.**

**Purpose (L33450):** *"Mint, classify, describe, distribute, compare, archive, and export Workflow versions, and make the version number the audit receipt for which limits were in force."*

**Semantic versioning (L33424‑L33429).** *"At republish the Author selects the bump classification and the Reviewer validates it against the diff — **a mis-classified patch is returned**, because the classification decides how the change reaches the floor:*
- ***PATCH** — corrections that change no operating behaviour: a typographical error, a clarified phrase, an updated reference image, a Lane-B-approved value.*
- ***MINOR and MAJOR** — the notified classes: changes to what the worker does or what the platform enforces, meaning limits, gates, timing, severity mappings, sequence, screens added or removed, with **MAJOR marking restructuring**."*

*"**Every republish requires a mandatory republish description** — what changed and why. It is stored in the permanent version history for every class, and for notified-class changes it does double duty as user-facing text."*

**Adoption (L33431).** *"Patch versions auto-adopt… Notified-class versions are decided. On publication of a MINOR or MAJOR version, **the owner named on each Job running the prior version is notified and decides adoption**, with a default one-shift update window, configurable, before the prior version is flagged outdated. **Runs in progress continue on the version they started** — the per-run pinned package is never swapped mid-run by a notified-class publish — while scheduled Runs may be rebased at the supervisor's discretion in the Delivery Operations Hub. When a worker first opens a Run on a notified-class version, the Frontline surface presents a first-screen notice of what changed, drawn from the mandatory republish description."*

**Job Owner is a field, not a role (L33433).** *"Job Owner is a field on the Job record, defaulting to the creator and reassignable — not a role. Version notifications and update decisions key to it."*

**Screens.** `SCR-STU-VERSION`, `SCR-STU-DIFF`, `SCR-STU-LINKAGE` (L31081‑L31083) / `SCR-STU-12` (L48270); `SCR-STU-PUBLISH` and `SCR-STU-VERSIONS` (`SB-013-01/02`, L68467). Storyboard `SB-STU-15` (L33546): *"A left column lists versions newest first with number, class badge, publication date, Release Authority, and adoption summary. Selecting two versions opens the screen-level diff: a list of changed screens, each expandable to show field-level before and after values with specification-limit changes highlighted in their own row. A Linkage tab lists Jobs and Runs per version with owner and decision state. An Archive control sits beside each version, disabled with the reason stated while active Jobs exist. An Export control produces the read-only document."* Also `SB-STU-03`, the adoption panel (L31304), whose summary line is the honesty exemplar: *"Published. One Job notified. Zero of one devices on this version."*

**States (L33479).** *"A version is Published, Superseded when a later version exists, or Archived. Adoption per Job is Notified, Decided-adopt, Decided-defer, or Outdated after the update window lapses."* **`OBJ-037` at L8616 gives `Draft, In Review, Published, Outdated, Archived`, using `Outdated` for the version state that this card calls `Superseded` while this card uses `Outdated` for something else entirely. See D21.**

**Permission matrix — L33456‑L33469, twelve data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker | Job Owner, a field on the Job |
|---|---|---|---|---|---|---|---|
| Select the bump classification at republish | Allowed — as Author | Allowed — as Author | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — the Job Owner decides adoption, not classification |
| Validate the classification against the diff | Allowed — as Reviewer | Allowed — as Reviewer | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — same reason |
| Write the mandatory republish description | Allowed — as Author | Allowed — as Author | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — same reason |
| Publish a version | Allowed with conditions — as Release Authority only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — same reason |
| Decide adoption of a notified-class version | Explicitly prohibited unless also the Job Owner | Explicitly prohibited unless also the Job Owner | Explicitly prohibited unless also the Job Owner | Explicitly prohibited unless also the Job Owner | Explicitly prohibited | Explicitly prohibited | Allowed — the decision keys to the Job Owner field |
| Rebase a scheduled Run | Not applicable — rebasing is a Delivery Operations Hub action | Allowed with conditions — at the supervisor's discretion in the Delivery Operations Hub | Allowed with conditions — same | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — same reason |
| View the version history and approval log | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Not applicable — the Job Owner sees the change notice, not the Studio |
| View the screen-level diff | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Not applicable — same reason |
| View the Job and Run linkage | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Not applicable — same reason |
| Archive a version manually | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — same reason |
| Export a version to portable document format | Allowed | Allowed | Read-only — may generate the read-only export | Read-only — may generate the read-only export | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Not applicable — same reason |
| Swap the pinned package of an in-flight Run | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**Row 5 is the only place on the surface where a permission is granted by a FIELD VALUE rather than by a role or a grant**, and four of the five tenant-role cells say so in the same words: `Explicitly prohibited unless also the Job Owner`. A build that renders this as a role check gets it wrong for the Quality Manager who happens to own the Job.

**Row 12 is the only row on the surface where every single cell across all seven columns is `Explicitly prohibited`** — including the Job Owner column, which is `Not applicable` on ten of the other eleven rows. That is the pinning guarantee stated as a matrix row.

**Row 11's Read-only cells carry a rendering instruction inside the token**: `Read-only — may generate the read-only export`. Read-only here does not mean "cannot act"; it means the action produces a read-only artefact. A build that maps `Read-only` mechanically to a disabled control will remove an export the source grants.

**`DEC-ARCH-001` (L33443).** *"It does **not** state whether an archived version can be un-archived, whether an archived version can be linked to a new Job, or whether archival is reversible at all."* Recommendation option (a), reversible with an audited reason, *"because the platform's only irreversible act is worker personal-data anonymisation and adding a second irreversible act to a content operation is disproportionate."*

**The two fail-closed differences (L33486, L33505, L33507).** Diff engine unavailable → *"the submission is held rather than advanced, because advancing an unvalidated classification could auto-adopt a behaviour change."* No-active-Jobs indicator uncomputable → *"archival is blocked rather than performed on an assumption."* Export → *"a partial export is never produced; the export either completes or fails with the reason stated, because a partially rendered specification document is worse than none."*

**Recovery (L33579).** *"minted version numbers are reconciled against audit entries and any gap is reported; **a version number is never re-used.** Adoption tracking is re-read per device and any device whose command state cannot be determined is shown as **unknown with the last known state and its timestamp, never as adopted.**"*

**Objects.** `OBJ-STU-VERSION`, `OBJ-STU-WORKFLOW`, and by consequence `OBJ-STU-PACKAGE` (L33477). `OBJ-037` at L8608.

---

### MOD‑STU‑13 — Qualification Requirements

**Section §5.13. Card L33604‑L33781.**

**Purpose (L33627):** *"State authoritatively which certifications a Workflow and its individual screens require, at two levels, validated at three points."*

**Two levels (L33610).** *"a baseline stated authoritatively on the Workflow — and therefore on any Job or Run linked to it — and screen-level overrides requiring additional certifications above that baseline."*

**The tag never decides (L33612).** *"Where a Service Type tag is applied, the tenant's tag-to-qualification-set mapping pre-populates the baseline as a starting convenience; **the tag never decides the requirement** — what is stated on the Workflow is authoritative, and the author edits freely over the pre-population."*

**Three validation points (L33614).** *"at assignment in the Delivery Operations Hub, again at Run start, and once more when a worker reaches a screen carrying an override."*

**The only configurable gate on the platform (L33616).** *"The Tenant Admin sets hard-block versus notify, and clearance duration. Under notify, the supervisor is notified and must confirm the assignment with a recorded reason; under hard-block, work proceeds only on a granted clearance, which is Client Command Center action number ten, delivered on the command channel and audited. The specification and evaluation gates, by contrast, are hard and non-configurable."*

**Grandfathering-but-flagged (L33618).** *"A certification-requirement change applies to Runs scheduled after the version carrying it is published; **active assignments are grandfathered but flagged, with the supervisor confirming continuation and a recorded reason**."*

**Screens.** `SCR-STU-QUAL` (L31078) / `SCR-STU-10` (L48268); `SCR-STU-QUALREQ` (`SB-011-03`, L68164). Storyboard `SB-STU-16` (L33725): *"A two-panel view. The left panel lists the Workflow's baseline certifications with a source badge reading either 'Pre-populated from tag' or 'Authored', and a control to add or remove. The right panel lists screens carrying overrides, with the additional certification named per screen. A cross-Workflow tab shows every requirement in the workspace grouped by certification, with the count of Workflows and screens requiring it. A banner states the tenant's current posture and clearance duration, read from the tenant administration area and marked read-only here."*

**States (L33655).** *"A requirement is Drafted or Published within a version. Against a given assignment it evaluates to Satisfied, Unsatisfied-blocked, Unsatisfied-notified, Cleared by a granted clearance, or Grandfathered-and-flagged."*

**Permission matrix — L33635‑L33645, eleven data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|
| State the Workflow qualification baseline | Allowed — manages Qualification Requirements | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Add a screen-level override | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Edit over a tag-driven pre-population | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Maintain the tag-to-qualification-set mapping | Not applicable — the mapping is tenant administration area master data | Not applicable — same reason | Not applicable — same reason | Allowed — in the tenant administration area | Read-only | Explicitly prohibited |
| Set hard-block versus notify posture | Explicitly prohibited — the posture is a tenant setting | Explicitly prohibited | Explicitly prohibited | Allowed — in the tenant administration area | Read-only | Explicitly prohibited |
| Set clearance duration | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed — uniform at tenant level, deliberately not per user | Read-only | Explicitly prohibited |
| Grant a qualification clearance | Not applicable — clearance is Client Command Center action ten | Allowed — Supervisor and above, in the Client Command Center | Allowed — same | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Confirm continuation of a grandfathered assignment | Allowed | Allowed — the supervisor confirms with a recorded reason | Allowed — same | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Enter or amend a worker's certification record | Explicitly prohibited from the Studio — certifications are Delivery Operations Hub master data, supervisor-entered, no self-attestation | Explicitly prohibited from the Studio | Explicitly prohibited from the Studio | Explicitly prohibited from the Studio | Explicitly prohibited | Explicitly prohibited |
| View the cross-Workflow requirement view | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Make the qualification gate looser than the platform floor | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**Rows 4, 5 and 6 are the third, fourth and fifth inversions**: the Tenant Admin holds three things the Quality Manager does not, and every Quality Manager cell names the owner. Row 6's Tenant Admin cell carries a design fact inside the token: `uniform at tenant level, deliberately not per user`.

**Row 7 is the surface's clearest cross-surface grant.** The Quality Manager's cell is `Not applicable` while both Supervisor columns are `Allowed` — because the act happens in the Client Command Center under the `Supervisor and above` reading of `DEC-PLUS-001`. **This aligns exactly with slice 4's D23 and D10**: the Hub renders the clearance register read-only and grants nothing; the Studio renders the requirement and grants nothing.

**Row 9 is the only row where the token is prefixed with a surface qualifier on four separate cells**: `Explicitly prohibited from the Studio`. That qualifier is load-bearing — the same act is permitted for a Supervisor in the Hub (slice 4's D9).

**The strictness defaults, both of which must be built (L33674, L33671).** *"where the posture cannot be read, the device applies the stricter posture, hard-block, because the configurability principle permits stricter and never looser."* And: *"a gate block encountered offline parks the run, the worker continues other assigned runs, and the parked run resumes when the clearance arrives."*

**`AC-STU-118` (L33769), inherited from slice 4's R7.** *"No surface shows a clearance as effective before its command reaches applied on the device."*

**Objects.** `OBJ-STU-QUALREQ`, `OBJ-STU-SCREEN`, `OBJ-STU-WORKFLOW`, `OBJ-STU-PACKAGE` (L33653). **`OBJ-STU-QUALREQ` has no numeric counterpart in the OBJ‑001…099 register.**

---

### MOD‑STU‑14 — The Offline Package

**Section §5.14. Card L33783‑L33959.**

**Purpose (L33814):** *"Define, build, deliver, and pin the complete self-sufficient bundle a device needs to render, evaluate, and enforce a Run alone."*
**Owning surface (L33813):** *"Standards and Operations Studio (`SURF-STU`), **instantiated per Run at assignment**."*

**The package contents — L33793‑L33797, five numbered classes, quoted whole:**

> *"**The package contains everything the device must render, evaluate, and enforce alone**:
> 1. all screen content, including instruction text at the difficulty levels — all levels pending the packaging decision of `DEC-WIDIFF-001` — in the Run's locale;
> 2. specification limits and gate rules;
> 3. the screen severity mappings together with the severity-catalog definitions and tenant action bundles needed to classify and act at capture;
> 4. the platform deviation-capture forms, so the default gate-failure path works offline;
> 5. the designated coaching defaults and short-form coaching assets, included subject to available device storage."*

L33799: *"**Training Library content is excluded. Escalation delivery is server-side and is not packaged.**"*

**FIVE against SIX — an unregistered count conflict.** `AC-STU-120` (L33941) asserts *"all five stated content classes"*. `AC-WF-AUT-009-01` (L53647) asserts *"Every package carries specification limits, gate rules, severity mappings, catalog definitions, tenant action bundles, and deviation-capture forms"* — six — and `TEST-WF-AUT-009-01` (L53648) is *"Manifest assertion for the **six** mandatory content classes."* The six-way list splits class 3 into three and class 2 into two, and drops screen content and coaching entirely. Both are test-strength assertions about one manifest. **No `DEC-*` identifier exists for this. See D17.**

**Offline severity handling, stated correctly (L33801).** *"Severity classification is on-device, at the moment of capture — always, including fully offline… **a Severity 1 classification places the lot hold at once, on the device, without waiting for connectivity.** What waits for reconnection is delivery."*

**The superseded description, named so it can be gated (L33803).** *"The discovery-stage description of offline deviations being 'processed at sync, with severity-band evaluation running on the captured value at that point' is **explicitly superseded** by Part V… **Any delivered artefact repeating the superseded description is a defect.**"*

**Screens.** No catalogue screen. Storyboard `SB-STU-17` (L33905): *"For a given Run, the Studio and the Delivery Operations Hub present a read-only package manifest: the pinned Workflow version, the locale, the difficulty levels carried, the count of screens, the presence of specification limits and gate rules, the severity mappings with their catalog levels and tenant action bundles, the deviation-capture forms, and the coaching assets included with any storage-driven omission listed explicitly by asset name. A line reads: 'This Run executes this package. A newer published version does not change it.'"*

**States (L33839).** *"Defined, Built, Delivered, Pinned, Superseded. A package that fails integrity verification is **Quarantined** and is never Delivered."* Quarantined is in the prose and not in the enumeration. `SEQ-013` (L68454‑L68461) adds Versioned, Building, Distributable, Incomplete, Recovery. See D21.

**Permission matrix — L33822‑L33829, eight data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|
| Define package contents | Explicitly prohibited — the package definition is platform-fixed from the published version | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Trigger a package build | Not applicable — the build fires at run assignment in the Delivery Operations Hub | Allowed with conditions — through run assignment in the Delivery Operations Hub | Allowed with conditions — same | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Perform an on-demand re-pull to a device | Not applicable — re-pull is a supervisor action | Allowed — on-demand re-pull by the supervisor | Allowed — same | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Swap the package of an in-flight Run | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Include Training Library content in a package | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Exclude a severity mapping from a package | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| View which package version a Run is pinned to | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Allowed with conditions — the worker sees the version on their own Run |
| Execute a package | Not applicable — execution is a Frontline action | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Allowed — on the assigned device |

**Row 1 is the only row on the surface where the Quality Manager — the surface's most privileged tenant role — is categorically prohibited from something with no alternative holder anywhere.** The package definition is platform-fixed. It is the Studio's own equivalent of slice 4's D10.

**Rows 2 and 3 are the seam.** The Quality Manager `Not applicable` and both Supervisor columns `Allowed with conditions — in the Delivery Operations Hub`: the act exists, it is not a Studio act, and slice 5 renders it as a cross-surface statement.

**Four open decisions land here.** `DEC-WIDIFF-001` (L33793, interim rule applied), `DEC-LIB-001` (L33805), `DEC-PKGFIELD-001` (L33807) — *"§6.7.4 states that the authoritative field-by-field assignment is carried in the package contract of Part VII; **Part VII does not enumerate it**"* — and `DEC-STORE-001` (L33850), storage-full behaviour *"explicitly deferred to the Frontline functional specification; **no behaviour is invented here.**"*

**Quarantine, defined in the source's own plain words (L31322).** *"the suspect item is set aside where it cannot be used but is not destroyed, so it can be inspected; it matters because silently discarding a bad package would hide a distribution fault."*

**Objects.** `OBJ-STU-PACKAGE` (L33837) = `OBJ-045` Work package + `OBJ-046` Package manifest (L8760, L8779).

---

### MOD‑STU‑15 — The Agent Builder

**Section §5.15. Card L33961‑L34152.**

**Purpose (L34001):** *"Enable atomic capabilities within entitlement and compose, evaluate, approve, deploy, and map tenant reasoning agents."*

**Two things that must not be conflated (L33967).** *"The first is configuring the three standard agents through the nine-section panel — every tenant does this. The second is composing a new agent: an authorised user selects and orders atomic capabilities, configures the agent, validates it against evaluations, routes it through approval, and deploys it within the tenant workspace."*

**The registry boundary (L33971).** *"**The Agent Builder composes from the registry; it never adds to it.** Authoring a new atomic capability is a platform engineering task… **A tenant enables and composes; a tenant never authors an atom.**"*

**Configuration follows capability — L33975‑L33982, six data rows, quoted whole because it is the map from capability to configuration surface.**

| If a tenant enables this capability | This configuration surface appears on the relevant screens |
|---|---|
| Real-time coaching, the Prevention Agent | Timing thresholds and the coaching-content section |
| Tolerance validation, part of deviation handling | Specification Limits: lower limit, upper limit, unit, drawing reference |
| Containment response, Deviation and Containment | Severity mapping, containment-checklist picker, escalation routing |
| Elevated qualification enforcement | Screen-level qualification override |
| Tool and equipment control | Tool barcode and calibration-confirmation requirements |
| A future capability, for example equipment-signal monitoring | A new configuration surface for that capability, appearing only where relevant |

**Action agents are configured, not composed (L33990).** *"The launch builder composes reasoning agents only — agents that produce an artifact. Action agents, which intervene on the floor, ship as platform-provided templates the tenant configures rather than composes, **because their blast radius requires platform-authored evaluations.**"*

**Screens.** `SCR-STU-CAPS` and `SCR-STU-AGENT` (L31084‑L31085) / `SCR-STU-13` (L48271); `SCR-STU-CAPABILITY` (`SB-010-03`, L68013); `SCR-STU-AGENTBUILDER` (L12027). Storyboard `SB-STU-18` (L34096): *"A list of composed agents with name, state badge, capability count, mapping count, and last state change. A New Agent flow steps through name, capability selection with drag-ordering, configuration, trigger, and mapping, with a running validity panel naming any capability that is not enabled. A Governance tab per agent shows the three gates as a progress track with each gate's outcome, timestamp, and decider. **Compose controls are shown with the reason 'Requires the Growth or Enterprise tier' where the tier is below Growth, rather than hidden.** A permanent line reads: 'The Agent Builder composes reasoning agents only. Action agents are configured, not composed.'"*

**States (L34030).** *"Composed, Evaluation pending, Evaluation passed, In approval, Platform review, Deployed. Failure at the evaluation gate returns the composition to Composed with the failing scenarios named. **Deprecation, disablement, and rollback states are `DEC-AGENTLC-001`.**"* There is no terminal state.

**Permission matrix — L34007‑L34020, twelve data rows.** The only module matrix whose second column is a **grant holder** rather than a role, and the only one carrying a platform-role column.

| Action | Quality Manager | Delegated administrator with Agent Author | Supervisor with authoring grant | Tenant Admin | Read-only Auditor | Worker | Platform Engineer |
|---|---|---|---|---|---|---|---|
| Enable or disable a capability within entitlement | Client Decision Required — `DEC-CAPAUTH-001` | Client Decision Required — `DEC-CAPAUTH-001` | Client Decision Required — `DEC-CAPAUTH-001` | Client Decision Required — `DEC-CAPAUTH-001` | Explicitly prohibited | Explicitly prohibited | Not applicable — the console sets entitlement, not enablement |
| Author an atomic capability | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — engineering change, evaluations written, evaluation gate, Admin approval |
| Compose a reasoning agent | Allowed with conditions — holds or delegates the Agent Author capability; Growth or Enterprise tier | Allowed with conditions — delegated Agent Author; Growth or Enterprise tier | Explicitly prohibited | Explicitly prohibited unless holding the delegated Agent Author capability | Explicitly prohibited | Explicitly prohibited | Not applicable — composition is a tenant act |
| Compose an action agent | Explicitly prohibited — action agents are configured, not composed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — action agents ship as platform templates |
| Configure a standard action agent through the nine-section panel | Allowed | Allowed with conditions — where they also hold the authoring grant | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — configuration is tenant authoring |
| Submit a composed agent to the evaluation gate | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — submission is a tenant act |
| Bypass the evaluation gate | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited — the gate binds every operator including the root account |
| Route a composed agent through the approval chain | Allowed with conditions — subject to separation of duties | Allowed with conditions — same | Allowed with conditions — may act as Reviewer on a composition they did not author | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable |
| Perform the platform-level review | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — in the Super Admin platform console |
| Map a composed agent to Workflows, screens, and triggers | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable |
| Assign or revoke the Agent Author delegation | Explicitly prohibited — administration of Studio capacities sits with the Tenant Admin | Explicitly prohibited | Explicitly prohibited | Allowed — per the tenant administration area | Explicitly prohibited | Explicitly prohibited | Not applicable |
| View composed-agent status and mappings | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions — through a named access class only |

**Row 1 is the surface's single most consequential open cell.** All four tenant columns read `Client Decision Required — DEC-CAPAUTH-001`, so **nobody holds capability enablement**, and enablement is what decides which of the nine configuration sections exist across every Workflow. Row 1 of `MOD-STU-18`'s consolidated matrix (L34555) repeats it. The whole "configuration follows capability" mechanism has no authorised operator until the client rules.

**Row 7 is the only row on the surface where the Platform Engineer cell is `Explicitly prohibited`** rather than `Not applicable` or `Allowed with conditions`, and its reason names the root account: *"the gate binds every operator including the root account."*

**`DEC-DELEG-001` bites the second column, and it is NOT in chapter 20's open-decisions table.** L17920: *"§4.8.4 states plainly: 'Delegation is deferred beyond V1; cover is handled by manually adding a role or grant'"* while §5.18 and §5.15.4 describe the Agent Author capability as held or delegated. `MTX-TEN-02b`'s condition `[Y21]` (L22052) states the interim position: *"Until decided, the build denies Supervisor access to the Agent Builder and names the decision."* This matrix's entire second column presumes delegation exists.

**Two open decisions declared here.** `DEC-CAPAUTH-001` (L33992), recommendation option (b) the Tenant Admin with mandatory Quality Manager consultation recorded. `DEC-AGENTLC-001` (L33994) — *"a composed reasoning agent that begins producing misleading briefs has no stated off switch short of the platform-wide emergency pause, which is a much blunter instrument"* — recommendation (a) tenant-side disable with an audited reason plus (c) a versioned composed-agent lifecycle.

**The disablement honesty rule (`FUNC-STU-15-01-A-2`, L34037; `AC-STU-130`, L34135).** *"disabling never alters a pinned package, so a disabled capability continues to execute on in-flight Runs until they finish, **which must be stated plainly rather than hidden.**"*

**Objects.** `OBJ-STU-CAPSTATE`, `OBJ-STU-COMPOSED`, *"and indirectly every `OBJ-STU-SCREEN` whose sections depend on an enabled capability"* (L34028).

---

### MOD‑STU‑16 — Memory and the Two-Lane Learning Loop

**Section §5.16. Card L34154‑L34349.**

**Purpose (L34186):** *"Write the Studio's authored content into memory, refine selection automatically inside authored boundaries, and route any proposed change to a configured value through a single human decision."*
**Owning surface (L34185):** *"Standards and Operations Studio (`SURF-STU`) for the procedural and semantic writes and the learning read view; **the Client Command Center owns the Lane-B decision**."*

**Five typed stores (L34162).** *"**working memory** (the live context of a Run), **episodic** (past cases and events), **semantic** (standards, specifications, and domain facts), **procedural** (how-to and learned routines), and **profile** (worker and operator profiles). **The Studio writes the procedural and semantic layers**… The memory architecture itself is platform-owned; a tenant may set retention within the allowed bounds and the personal-information policy on profile memory, never the architecture."*

**The single test that divides the whole system (L34164, L34171).** Lane A is *"everything that does not"* alter a configured operating value; it *"changes no configured value by definition, so these refinements are applied automatically, logged, and reversible."* Lane B is *"Any refinement that would change a configured operating value — a trigger percentage, a routing target, checklist content"*, surfaced as a proposal, *"**A proposal is never auto-approved — the decision is always human, made exactly once.**"*

**The package test (L34171).** *"A package-borne value — anything that lives inside a published Workflow version — **auto-publishes as a patch version**… **A server-only value applies immediately.** The publication is automatic and fully audited; no second approval, no ceremony."* And: *"Undecided proposals age visibly with a 30-day stale flag and never expire silently. In-flight runs stay pinned regardless."*

**No off switch (L34177).** *"**Learning is on by default, and the approval queue is the control**: nothing reaches a configured value without a person approving it in the Client Command Center, and Lane A changes no configured value by definition — so there is **no separate on/off switch**, and no risk the loop quietly never starts."*

**Screens.** `SCR-STU-LEARN` (L31086, catalogue A only). Storyboard `SB-STU-19` (L34293): *"Three panels. Coaching effectiveness lists assets with resolution rate, sample size, screens where used, and a flag badge for low performers with Review and Retire controls. Proposed threshold changes lists open Lane-B proposals with current value, proposed value, scope of impact, evidence summary, age, and a stale badge past 30 days, each linking to the Client Command Center where the decision is made — **the Studio displays, it does not decide.** Prior-case relevance shows the feedback the operation has given and how similarity has shifted. A footer states: 'Nothing here changes a configured value without a person approving it. Lane A changes no configured value at all.'"*

**States (L34212).** *"A Lane-B proposal is Proposed, Stale-flagged at 30 days, Approved, Rejected, Published as a patch, or Applied immediately for a server-only value. Lane-A refinements have no proposal state because they are applied automatically, logged, and reversible."*

**Permission matrix — L34194‑L34202, nine data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|
| Read the learning view | Allowed — learning read view | Allowed — the Quality Engineer read view | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |
| Decide a Lane-B proposal | Allowed — in the Client Command Center | Client Decision Required — `DEC-LANEBAUTH-001` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited — no Client Command Center access at all | Explicitly prohibited |
| Reverse a Lane-A refinement | Allowed — Lane A is reversible | Allowed with conditions — where they hold the learning read view | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Turn learning off | Explicitly prohibited — there is no separate on/off switch | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Set retention within allowed bounds on memory | Explicitly prohibited from the Studio | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — in the tenant administration area, within platform bounds | Read-only | Explicitly prohibited |
| Set the personal-information policy on profile memory | Explicitly prohibited from the Studio | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — in the tenant administration area | Read-only | Explicitly prohibited |
| Change the memory architecture | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Export learned content outside the tenant | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Flag or retire a low-performing coaching asset | Allowed | Explicitly prohibited — may propose | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |

**Row 2's Auditor cell is the only `Explicitly prohibited` on the surface that carries a positive statement of a different surface's rule**: *"no Client Command Center access at all"*. It is a settled fact (slice-4 D-equivalent, §3.5) and therefore NOT `Client Decision Required` — a useful contrast with row 1's Auditor cell four columns away, where the same role's Studio read IS open.

**Row 4's Quality Manager cell states an architectural absence, not a permission**: *"there is no separate on/off switch"*. Rendering it as a disabled toggle would invent the control the source says does not exist.

**`DEC-LANEBAUTH-001` (L34175), the persona-versus-role pivot.** *"A quality engineer is a **persona**, not a role: §5.18 staffs them as holders of the Supervisor or Quality Manager role with the authoring grant applied. Under §5.18's staffing model, a quality engineer holding only the Supervisor role would be able to decide a Lane-B proposal under §5.16.3 but not under §6.14.2."* Recommendation: option (a), Quality Manager and above only, *"because the Client Command Center's action set is explicitly closed at ten and adding decision authority to a role is a scope decision rather than a drift."*

**Security, and the platform's one irreversible act (L34322).** *"Worker personal data anonymises at 24 months for standard commercial tenants and never in Regulated-Industry mode; measurement, result, and evidence survive and the identity becomes an opaque worker identifier. **Anonymisation is the platform's one irreversible act.**"* Profile memory *"holds aggregates only under the personal-information redaction policy"* — which is the same support-not-surveillance floor slice 4 built its S10 on.

**Objects.** The five typed memory stores; `OBJ-STU-VERSION` on a Lane-B patch; `OBJ-STU-ASSET` on flagging and retirement (L34210).

---

### MOD‑STU‑17 — Localisation

**Section §5.17. Card L34351‑L34498.**

**Purpose (L34368):** *"Hold per-locale authored variants inside one Workflow and block publication in any locale whose worker-facing content is incomplete."*

**The rule (L34357).** *"The platform is multilingual by locale files — English and Spanish at launch — and **nothing is translated at run time, anywhere**. Worker-facing Workflow content is held as per-locale authored variants within one Workflow: screen content lives in a single Workflow with multiple language renderings, **never as parallel per-language Workflow versions**. Instruction text at each difficulty level, screen-specific notes, Shared Instruction Blocks, deviation-capture forms, coaching assets, and Training Library content are all authored or uploaded per language."*

**The completeness check (L34359).** *"Before publication, a locale-completeness check verifies that every worker-facing element of the Workflow — **including the designated coaching defaults** — exists in every locale the Workflow declares; an incomplete locale blocks publication in that locale. Locale-pack versioning and governance sit platform-side."*

**Per-locale, not per-Workflow — and this is a `Derived Clarification` (L34361).** *"A Workflow declaring English and Spanish whose Spanish coaching default is missing publishes in English and is blocked in Spanish, with the specific missing element named. This is a deliberate reading of 'blocks publication in that locale' and is `Derived Clarification`; the alternative reading, that any incompleteness blocks the whole publication, would make a partially localised improvement impossible to ship and is rejected for that reason."*

**Screens.** `SCR-STU-LOCALE` (L31087 — the only catalogue-A row **not** marked "Named in the source: Yes") / `SCR-STU-14` (L48272). Storyboard `SB-STU-20` (L34447): *"A grid with one row per worker-facing element and one column per declared locale, each cell showing Complete, Drafted awaiting review, or Missing with the element named. A per-locale summary line reads either 'Ready to publish' or 'Blocked, with a count of missing elements'. Each Missing cell links straight to the editor for that element in that locale. A permanent line reads: 'Nothing is translated at run time. Every locale variant is authored and reviewed.'"*

**States (L34393).** *"Per element per locale: Authored, Drafted by artificial intelligence, Reviewed, Complete, Incomplete. Per locale on a Workflow: Complete and publishable, or Incomplete and blocked."*

**Permission matrix — L34376‑L34383, eight data rows.**

| Action | Quality Manager | Supervisor with grant | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker |
|---|---|---|---|---|---|---|
| Declare a Workflow's locale coverage | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Author a locale variant | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Request artificial-intelligence drafting of a locale variant | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Publish into an incomplete locale | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Enable run-time machine translation | Explicitly prohibited — nothing is translated at run time, anywhere | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Add a locale beyond English and Spanish | Explicitly prohibited — two languages at V1 | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Manage locale-pack versioning and governance | Not applicable — locale-pack versioning sits platform-side | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason | Not applicable — same reason |
| View the coverage report | Allowed | Allowed | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited |

**Row 7 is the only matrix row on the entire surface where all six cells are identical and all six are `Not applicable`.** Nothing renders. A build that shows a locale-pack management section on any Studio screen invents a surface.

**The fail-closed rule (`FUNC-STU-17-03-A-1`, L34409; `AC-STU-149`, L34487).** *"where the check itself cannot run, publication is blocked, failing closed, because publishing an unverified locale is the exact failure the check exists to prevent."*

**Objects (L34391).** `OBJ-STU-LOCALE`, `OBJ-STU-SCREEN`, `OBJ-STU-BLOCK`, `OBJ-STU-ASSET`, `OBJ-STU-TRAINING`, `OBJ-STU-VERSION`. **`OBJ-STU-LOCALE` has no numeric counterpart** — `OBJ-051` Locale pack (L8875) is the platform-side pack, not the per-locale authored variant.

---

### MOD‑STU‑18 — Permissions and Roles in the Studio

**Section §5.18. Card L34500‑L34686.**

**Purpose (L34533):** *"Gate every Studio capability by role and grant, and enforce a separation-of-duties floor that no tenant can widen."*
**Owning surface (L34532):** *"Standards and Operations Studio (`SURF-STU`); **grant administration sits in the tenant administration area inside the Delivery Operations Hub**."*

**The two rules that bound every other module (L34508).** *"**Drafts and in-review versions are visible only to grant-holders and the chain; published content is what read-only roles see. Nothing in the table can be widened by a tenant beyond the platform's separation-of-duties floor: an author can never approve their own work, and the Release Authority can never be bypassed.**"*

**§5.18's own table, reproduced faithfully by the source — L34512‑L34518, five data rows.** This is the SOURCE table. It is headed *"Fixed role"*, it includes **Plant Manager**, and it **omits the Read-only Auditor entirely**.

| Fixed role, as the source heads the column | Access in the Studio |
|---|---|
| Quality Manager | Full authoring across all nine sections, Shared Instruction Blocks, and Content Libraries which the Quality Manager owns; manages Qualification Requirements; Release Authority by tenant default; holds or delegates the Agent Author capability; learning read view |
| Supervisor | Read-only access to published Workflow content — screen sequences, instruction text, specification limits — for reference. With the authoring grant, meaning a quality engineer staffed in this role: create Workflows, author all nine sections, create and apply Shared Instruction Blocks, propose Content Library changes, and submit for review; act as Reviewer on submissions they did not author; cannot approve or release |
| Plant Manager | Read-only access to published Workflow content. No access to drafts or in-review versions; cannot edit |
| Tenant Admin | Administers Studio capacities — assigns and revokes the authoring grant and the Agent Author delegation, per the tenant administration area; read-only access to published content; holds no stage of the approval chain, for separation of duties |
| Frontline Worker | No access to the Studio. Workers meet Workflow content exclusively through the Frontline surface during Run execution |

**Chapter 20's expansion of the same table — L34519‑L34528 of §20.1.3, at L30819‑L30828, eight data rows.** It splits Supervisor into with-grant and without-grant, adds the Read-only Auditor as an open question, and adds the implementation-team grant.

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

**Platform roles and the Studio — L30807‑L30812, four data rows.** All four are prohibited from standing access; each reaches the surface only through a named access class.

| Platform role | Standing Studio access | Access through a named class | Note |
|---|---|---|---|
| Root Super Admin (`ROLE-PLAT-ROOT`) | Explicitly prohibited | Allowed with conditions — compliance-emergency path only, dual-authorised with one Admin, time-boxed, scope declared before it opens | Exactly one account exists; created through the backend at platform commissioning. |
| Admin (`ROLE-PLAT-ADMIN`) | Explicitly prohibited | Allowed with conditions — support session read-only, or as the second authorisation on the compliance-emergency path | Cannot author or release tenant Workflow content in any class. |
| Platform Engineer (`ROLE-PLAT-ENG`) | Explicitly prohibited | Allowed with conditions — support session read-only; registry and evaluation work happens in the console, not the Studio | Mutating console changes submit into the approval cycle. |
| Support (`ROLE-PLAT-SUP`) | Explicitly prohibited | Allowed with conditions — read-only, time-boxed support session with a tenant-visible banner | No configuration changes in any surface. |

**The consolidated Studio permission matrix — L34539‑L34563, twenty-three data rows, nine columns.** The widest matrix on the surface. L34537: *"Every cell carries an explicit status."*

| Capability | Quality Manager | Supervisor with `GRANT-STU-AUTHOR` | Supervisor without the grant | Plant Manager persona | Tenant Admin | Read-only Auditor | Worker | `GRANT-STU-IMPL` |
|---|---|---|---|---|---|---|---|---|
| Open the Studio | Allowed | Allowed | Allowed | Allowed | Allowed | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions — onboarding only |
| Read published Workflow content | Allowed | Allowed | Read-only | Read-only | Read-only | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions |
| Read drafts and in-review versions | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions |
| Create a Workflow | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Author all nine configuration sections | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Create and apply Shared Instruction Blocks | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Create, edit, archive Content Library items | Allowed — the Quality Manager owns the libraries | Explicitly prohibited — may propose only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Propose a Content Library change | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Manage Qualification Requirements | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Submit for review | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed with conditions |
| Act as Reviewer | Allowed with conditions — not own submission | Allowed with conditions — only on submissions they did not author | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Approve or release | Allowed with conditions — Release Authority by tenant default, never on own submission or one they reviewed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Hold or delegate the Agent Author capability | Allowed | Explicitly prohibited unless delegated `GRANT-STU-AGENT` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited — assigns it, does not hold it by default | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Compose a reasoning agent | Allowed with conditions — Growth or Enterprise tier | Allowed with conditions — only with `GRANT-STU-AGENT` and Growth or Enterprise | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — only if delegated `GRANT-STU-AGENT` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Enable or disable an atomic capability | Client Decision Required — `DEC-CAPAUTH-001` | Client Decision Required — `DEC-CAPAUTH-001` | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-CAPAUTH-001` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Read the learning view | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Explicitly prohibited |
| Decide a Lane-B proposal | Allowed — in the Client Command Center | Client Decision Required — `DEC-LANEBAUTH-001` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited — no Client Command Center access at all | Explicitly prohibited | Explicitly prohibited |
| Assign or revoke `GRANT-STU-AUTHOR` and `GRANT-STU-AGENT` | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Allowed — administers Studio capacities from the tenant administration area | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Hold any stage of the approval chain | Allowed with conditions — one stage per submission | Allowed with conditions — Author or Reviewer only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited — holds no stage, for separation of duties | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited — author and submit only |
| Publish Training Library content | Allowed with conditions — as Release Authority | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Generate a portable-document-format export of a version | Allowed | Allowed | Read-only — may generate the read-only export | Read-only — may generate the read-only export | Read-only — may generate the read-only export | Client Decision Required — `DEC-AUDSTU-001` | Explicitly prohibited | Allowed with conditions |
| Widen any of the above beyond the separation-of-duties floor | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
| Use any Studio capability while offline | Unavailable — the Studio requires an active connection | Unavailable — same reason | Unavailable — same reason | Unavailable — same reason | Unavailable — same reason | Unavailable — same reason | Explicitly prohibited — no access at all | Unavailable — same reason |

**Row 23 is the surface's cleanest `Unavailable`-versus-`Explicitly prohibited` contrast in a single row.** Seven columns read `Unavailable — the Studio requires an active connection` (the capability exists and is withheld by a condition) while the Worker column reads `Explicitly prohibited — no access at all` (the capability is never held). Same row, same axis, two tokens, two renderings. **This row alone settles which sense of `Unavailable` governs on this surface for the connectivity axis.**

**Row 22 is a meta-row**: it is not a capability, it is the floor itself asserted as a matrix row, prohibited for all nine columns including the Tenant Admin who administers everything else.

**States (L34573).** *"A grant is Assigned, Active, Revoked, or Expired, the last applying to the implementation team's capacity at onboarding's end."*

**Screens.** `SCR-STU-15` (L48273, catalogue B only — catalogue A has no permissions screen); `SCR-STU-GRANT-01` (L16457). Storyboard `SB-STU-21` (L34631): *"A view showing the signed-in identity, its roles, its grants, and the tenant's tier, followed by a list of Studio capabilities each marked Available or Unavailable with the specific missing condition named, for example 'Requires the authoring grant. Ask your Tenant Admin.' The Tenant Admin's view of the same information adds Assign and Revoke controls, with a note that the Tenant Admin holds no stage of the approval chain."*

**Fail closed (L34605, `AC-STU-156` L34673).** *"Where the identity layer is unreachable, the Studio denies authoring capabilities and permits nothing beyond published read, failing closed. Where a grant is revoked mid-session, the next authorised action is refused with the revocation named; **the session is not silently degraded.**"*

**Refusal transparency is a `Recommendation — R&D` (L34595), not a `SoW Fact`.** *"Present every unavailable capability with a stated reason rather than hiding it. Purpose: a user should learn what they need, not that a feature does not exist… benefit is fewer support tickets and clearer grant requests, cost is a small user-interface obligation, no client decision required."*

**`DEC-ROLE-001` (L34522), the adopted treatment.** *"This blueprint treats Plant Manager as a **persona** whose Studio access is delivered by a Supervisor role without the authoring grant, which produces exactly the access §5.18 describes, and records the divergence rather than resolving it."*

**`DEC-AUDSTU-001` (L34524), and its binding instruction.** *"**Until decided, every Read-only Auditor cell in this chapter reads `Client Decision Required` rather than being guessed.**"* The counter-pattern is recorded in the same card: §3.5 routes the Auditor to the Delivery Operations Hub record, but *"Studio publish events are ingested into that same tenant audit log while the diff and the approval log are not stated to be."* Recommendation option (b); option (a) is rejected because it *"would force auditors to depend on the audited party to produce evidence, which weakens the audit"*.

**Objects (L34571).** `GRANT-STU-AUTHOR`, `GRANT-STU-AGENT`, `GRANT-STU-IMPL`, *"and every Studio object by way of access control"*.

---

## 2. THE CROSS‑CUTTING MATRICES — quoted in full because they disagree with §1

Three matrices outside chapter 20 state Studio permissions. All three are transcribed here, because **each one contradicts chapter 20 in at least one cell**, and an implementer working from any of them alone would build a status the module cards deliberately leave open.

### 2.1 `MTX-TEN-02b` — tenant role to module, the eighteen derived Studio modules

**L22031‑L22050, eighteen data rows.** Preamble at L22029: *"The count is `Derived Clarification` under `DEC-STUDIO-001`. Every Read-only Auditor cell in this table is `Client Decision Required` under `DEC-AUDSTU-001`, and every Worker cell is `Explicitly prohibited` because workers meet Workflow content exclusively through the Frontline surface `[SoW Fact — §5.18]`; both are stated once here and repeated in the table because blank cells are prohibited."*

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

**Its twenty-four conditions are at L22052 and are not reproduced in full here** — they are quoted individually where they bite, in §6. The four that change a build decision are `[Y6]`, `[Y12]`, `[Y19]` and `[Y21]`:

- `[Y6]` *"The Tenant Admin administers Studio capacities and reads published content; no authoring capacity is assigned"* — attached to three `Unavailable` cells.
- `[Y12]` *"The bulk-upload registry is administered in the tenant administration area; the Studio holds only the inline-add seam"*.
- `[Y19]` *"The offline package is assembled by the platform at run assignment and is inspected rather than authored"*.
- `[Y21]` *"`DEC-DELEG-001`: §5.18 permits the Quality Manager to delegate the Agent Author capability while §4.8.4 states delegation is deferred beyond V1. **Until decided, the build denies Supervisor access to the Agent Builder and names the decision.**"*

**Where it disagrees with chapter 20.** `MOD-STU-04` and `MOD-STU-05` give the Tenant Admin `Unavailable` here; chapter 20's own matrices give the Tenant Admin `Explicitly prohibited` on the draft canvas and `Read-only` on the published canvas (L32061‑L32062, L32259‑L32260). `MOD-STU-12` gives the Supervisor `Explicitly prohibited` here; chapter 20's matrix gives the Supervisor-with-grant `Allowed` on six of twelve rows (L33458‑L33468). **Under the slice-4 adjudication these render oppositely** — `Unavailable` sense B is ABSENT, `Read-only` is `STATE-06`. See D9.

### 2.2 §25.3 — Actions and permissions on the Standards and Operations Studio

**L48319‑L48328, eight data rows.**

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

**This matrix gives the Read-only Auditor a STATUS on all eight rows** — `Not applicable`, `Unavailable`, `Read-only` — where chapter 20 gives `Client Decision Required` on the equivalent rows and `AC-STU-157` (L34674) forbids exactly that. **It is the single most likely source of the slice-5 equivalent of slice 4's brief defects**, because it is a compact, authoritative-looking, five-column table that an implementer would naturally transcribe. See D2.

**It also disagrees on two more cells.** Row 5 gives the Auditor `Read-only` on Content Libraries where `MOD-STU-07`'s matrix (L32637) gives `Client Decision Required`. Row 7 gives the Auditor `Read-only` on grant administration where `MOD-STU-18`'s consolidated matrix (L34558) gives `Explicitly prohibited`.

### 2.3 The two surface-level rows

**`MTX-TEN-01` tenant role → surface, `SURF-STU` row only, L21928, one data row.**

| Surface | Tenant Admin | Supervisor | Quality Manager | Read-only Auditor | Worker |
|---|---|---|---|---|---|
| Standards and Operations Studio (`SURF-STU`) | `Allowed with conditions` `[U6]` | `Read-only` `[U7]` | `Allowed` `[U8]` | `Client Decision Required` `[U9]` | `Explicitly prohibited` `[U10]` |

**`MTX-PLAT-01` platform role → surface, `SURF-STU` row only, L21068, one data row.**

| Surface | Root Super Admin | Admin | Platform Engineer | Support |
|---|---|---|---|---|
| Standards and Operations Studio (`SURF-STU`) | `Allowed with conditions` `[P4]` | `Allowed with conditions` `[P8]` | `Explicitly prohibited` `[P6]` | `Allowed with conditions` `[P7]` |

**Note that `MTX-PLAT-01` gives the Platform Engineer `Explicitly prohibited` at surface level** while §20.1.3's platform table (L30811) gives the same role `Allowed with conditions — support session read-only`. The surface matrix states standing access; the chapter table states access through a named class. Both are true; a build that reads only the surface matrix will render the Engineer as never able to see a Studio screen, which is wrong inside a support session.

**Matrix census total: twenty-six matrices, 239 data rows.** Per-module 187 (seventeen action matrices totalling 164, plus `MOD-STU-18`'s consolidated 23); cross-cutting 52 (tier 7, platform roles 4, tenant roles 8, §5.18 source table 5, `MTX-TEN-02b` 18, §25.3 8, `MTX-TEN-01` 1, `MTX-PLAT-01` 1).

---

## 3. THE SHARED SPINE

Twelve things every Studio screen sits on. Build these once, before any module screen.

**S1 — `evaluateStudioAccess`, layered on slice 3's `evaluateAccess`, is the only access entry point.** The Studio does not have nine intersecting conditions; it has **role + grant + tier + object state + separation of duties**, and separation of duties is evaluated **by identity, not by role** (L33389, L34592). The grant is a first-class input: *"authoring is a capability, not a sixth role"* (L34584). Fail closed: *"Where the identity layer is unreachable, the Studio denies authoring capabilities and permits nothing beyond published read"* (L34605). *Touched by: every module. Owned by `MOD-STU-18`.*

**S2 — The three‑stage chain is a service, not a screen.** `MOD-STU-11` owns it and four other modules reuse it: `MOD-STU-08` Training Library (L32846), `MOD-STU-07` Content Library edits per `DEC-LIBREV-001` (L32678), `MOD-STU-09` every drafted difficulty level (L32994), `MOD-STU-15` composed agents plus two further gates (L34052). `FUNC-STU-11-06-A-1` (L33320) states the reuse explicitly: *"one governance floor for everything that reaches the floor."* *Owned by `MOD-STU-11`.*

**S3 — Publish‑time validation is a fail‑closed gate set, not a warning set.** L48330: *"the locale completeness check and the missing-severity-mapping check are publication blockers, not warnings."* The full set, gathered from the per‑functionality "specific difference" clauses: structural validity (L32101), a severity mapping on every screen that can deviate (L32308), a capture type inside the adopted seven (L32291), specification limits complete with unit and drawing reference on every measurement screen (L32301), a curated coaching default per declared locale (L32304), locale completeness across every worker‑facing element (L34409), every library pointer resolvable (L32483, L33211), every named certification still maintained (L32321), every capability dependency satisfiable (L30782), a recorded Severity 1 arming confirmation (L32313), and a staffable chain (L33307). **Where the check itself cannot run, publication is blocked** (`FB-STU-09`, L31453; `AC-STU-149`, L34487). *Touched by: 04, 05, 06, 07, 09, 11, 12, 13, 15, 17.*

**S4 — Screen states, with this surface's four departures.** The thirteen‑state contract at L48007‑L48014 with L48330's departures quoted in §1. Two things are different from slice 4: `STATE-07` is inapplicable **everywhere** (not merely mostly), and `STATE-10`/`STATE-11` **do** apply — on the configuration panel and the agent screens — because this surface has three live artificial‑intelligence touchpoints in the authoring path. `TEST-SCR-STU-005` (L48358) names the `STATE-11` rendering.

**S5 — The connectivity ruling.** See D7. One rule, three source answers, and the never‑queue half is not negotiable: the Studio has no offline mode and no write is ever queued client‑side.

**S6 — Audit in the same transaction, or the action did not happen.** `FB-STU-10` (L31454, L31220) is *"the strictest contract in this chapter"*: *"an administrative or operational change and its audit event commit in the same transaction, so an action that cannot be audited does not happen. If the audit write fails, the Studio action fails with it. **There is no first fallback that permits the action to proceed unaudited.**"* The retry is *"bounded, idempotent… a publish retry that re-uses the same submission identifier so the second attempt either completes the first attempt or does nothing"*. The terminal safe state: *"the Workflow remains at its prior state and **no version number is minted**"*, and *"a version number is never re-used"*. **The Studio keeps no log of its own** (L31481). *Touched by: every write.*

**S7 — The Tier‑2 boundary is a refusal classification, not a hidden button.** `FUNC-STU-01-01-C-1` (L31599): *"Refused at the application programming interface layer, not merely hidden in the user interface"*, and *"the refusal itself is audited, and if the audit write fails, the refusal is still enforced because refusing is the safe direction."* `AC-STU-041` (L31674). *Owned by `MOD-STU-01`.*

**S8 — Configuration follows capability.** Enabling a capability switches a configuration surface on; disabling removes it and blocks publication of dependent Workflows with the dependent screens named (`AC-STU-006`, `AC-STU-007`, L30781‑L30782). The one difference that stops silent data loss (`FUNC-STU-01-01-B-1`, L31597): under `FB-STU-07`, *"surfaces freeze read-only rather than disappearing, so an author is never shown an empty section that silently discarded a value."* And `MOD-STU-05`'s parallel rule (L32337): a changed input type marks now‑irrelevant values **inactive rather than deleting them**. *Touched by: 01, 05, 15.*

**S9 — The pointer model and the propagation honesty rule.** Screens hold pointers, never copies (`AC-STU-071`, L32763). A pointer that fails to load never clears an existing pointer (`AC-STU-018`, L31098). An item cannot be archived while screens reference it, and the referencing screens are named (`AC-STU-077`, L32769). And the honesty half: *"a block edit reaches the floor only through a new published version and its adoption, and **no view suggests live propagation to a pinned package**"* (`AC-STU-070`, L32562). *Touched by: 04, 05, 06, 07.*

**S10 — Never claim a device state.** The fifteen command states (L31181) are the only vocabulary for adoption. `AC-STU-023` (L31226): *"No Studio view describes a published version as in force on a device."* `AC-STU-112` (L33590): *"Adoption is reported per device with explicit command states and never as a binary claim of being live."* `AC-STU-118` (L33769): no clearance is effective before `applied`. `AC-STU-028` (L31328): no escalation is reported as delivered before the Hub records delivery. Reconciliation: a device whose command state cannot be determined *"is shown as unknown with the last known state and its timestamp, never as adopted"* (L33579). *Touched by: 12, 13, 14, 16.*

**S11 — Support‑not‑surveillance, and here the hazard is INDIRECT but real.** The Studio holds no worker record — but it holds the **learning view**, and `MOD-STU-16` writes **profile memory**. L34322: *"Profile memory holds aggregates only under the personal-information redaction policy."* L34179: *"**Everything learned stays strictly inside the tenant's own manufacturing memory: nothing is shared across tenants, and nothing is exported as external training data.**"* Slice 4's standing data‑model assertion carries forward unchanged: **no persisted table has a worker identifier as a grouping key for a behavioural measure.** The learning view's coaching‑effectiveness panel groups by **asset**, never by worker (L34293), and the Lane‑A signal is *"this asset, in this language, worked for this failure pattern on this screen"* (L34166) — asset, language, pattern, screen. Not worker. *Touched by: 07, 16.*

**S12 — The derived count renders with its qualifier, everywhere.** `AC-STU-014` (L30992) binds this build's own documents and screens, not only the blueprint's. Wherever the Studio's module count appears on a screen it carries *"derived count, not stated in the Statement of Work"* and links `DEC-STUDIO-001` (L14442, `TEST-ROLE-1023` L14497). *Touched by: the module rail and any coverage view.*

---

## 4. THE WORKFLOW BUILDER JOURNEY — mapped fully, with five‑surface effects

The master prompt names the Workflow Builder the exemplar and demands *a real interactive authoring journey rather than a picture*. The source supplies **three independent renderings** of that journey and they must be reconciled rather than picked from:

- **A — the workflow catalogue, §28.6, L53338‑L53730.** Eleven member workflows `WF-AUT-001` … `WF-AUT-011`, each with Source, Happy path, Denied path, Failure path, Offline‑device impact, Artificial‑intelligence impact, Fallback ladder, **Five surfaces**, Recovery and reconciliation, Audit, Acceptance criteria, Tests and a diagram. **This is the only rendering that states five‑surface effects explicitly, so it is the spine.**
- **B — the canonical story sequences, §30A.13‑§30A.16, L67873‑L68478.** `SEQ-010` prepare the workspace, `SEQ-011` build, `SEQ-012` review/reject/revise/approve, `SEQ-013` publish and generate the package. Each carries a starting state, an ending state, a role‑and‑surface authority table, allowed/conditional/prohibited actions, per‑surface behaviour, ten named validation classes, and a named `FB-SEQ-0xx` contract.
- **C — the module cards, `MOD-STU-04` and its neighbours.** Happy path, alternate paths, storyboard, structural validation set.

**Where they differ, A wins on five‑surface effects, B wins on state names and ordering, C wins on control‑level detail.** Nothing below is invented; every row cites the rendering it came from.

| # | Journey step | `WF-AUT` | Owning module | Five‑surface effects, from L53365 onward |
|---|---|---|---|---|
| 1 | **Open or create** | `WF-AUT-002` L53386 | `MOD-STU-03` | DOH — linkage counts, rendered `Linkage unavailable, last retrieved at <ts>` and **never zero**. STU — the Library. CC — nothing. FL — nothing; *"No draft is ever delivered to a device"* (L68076). SA — the platform taxonomy, inherited read‑only. |
| 2 | **Choose taxonomy** | `WF-AUT-002` | `MOD-STU-03` | DOH — *"the published Workflow becomes linkable to Jobs"* and Job Type filters selection. STU — the settings panel. CC — nothing. FL — nothing. SA — the seeded catalogue (empty at v1 under `DEC-TAX-002`). |
| 3 | **Name, scope, version** — four settings, **exactly two** inheritable defaults | `WF-AUT-002` | `MOD-STU-04` | DOH — Job Type drives Workflow‑selection filtering. STU — the left panel, *"each labelled with whether it is inherited by screens"*. CC — nothing. FL — the inherited coaching trigger executes on the device from the package. SA — the locale set. |
| 4 | **Add, reorder, remove screens** | `WF-AUT-002` | `MOD-STU-04` | DOH — nothing. STU — the canvas plus the live structural‑validation panel. CC — nothing. FL — *"the packaged sequence"* is the deterministic sequence mechanism's reference. SA — nothing. |
| 5 | **Draw branches; accept or override the gate‑failure default** | `WF-AUT-002` | `MOD-STU-04` | DOH — nothing. STU — the canvas. CC — nothing. FL — the platform‑standard deviation‑capture form *"opens locally"* from the package with no signal. SA — nothing. |
| 6 | **Configure the nine sections** | `WF-AUT-002` L53397 | `MOD-STU-05` | DOH — the tenant action bundles and certification list the panel reads. STU — the Builder itself. CC — *"deviation workspace renders the configured severity level and its action bundle"*. FL — *"the screens, limits, and gates execute here"*. SA — *"the atom registry and capability entitlements bound what the Builder can offer"*. |
| 7 | **Author one difficulty level; draft the other two** | `WF-AUT-001` L53365 | `MOD-STU-09` | DOH — *"the worker profile field holding the level"*. STU — *"authoring and review of all levels"*. CC — *"no authoring; the learning read view shows coaching effectiveness"*. FL — *"renders the selected level and falls back to authored Work Instructions when the agent-selected coaching card is unavailable offline"*. SA — *"locale completeness checks block publication in an incomplete locale"*. |
| 8 | **Validate** | `WF-AUT-002` | `MOD-STU-04` + S3 | As step 6; the terminal safe state is *"draft, unsubmittable, no package generated"* (L53396). |
| 9 | **Save draft** | — | `FB-STU-01` | DOH — the reconciliation record commits *"in the same transaction as the accepted revision"* (L30867). STU — the draft. CC/FL/SA — nothing. |
| 10 | **Compare versions (diff)** | `WF-AUT-003` L53435 | `MOD-STU-12` | DOH — *"Job version history is unchanged until publication"*. STU — *"draft and diff"*. CC — *"unaffected until publication"*. FL — *"unaffected; version pinning holds"*. SA — *"package versioning policy applies platform-wide"*. |
| 11 | **Preview** | `WF-AUT-004` L53468 | `MOD-STU-11` | DOH — *"nothing until publication"*. STU — *"the queue and preview"*. CC — *"unaffected"*. FL — *"unaffected"*. SA — *"composed agents follow this same chain plus the evaluation gate and platform review"*. |
| 12 | **Submit** | `WF-AUT-002` → `WF-AUT-004` | `MOD-STU-11` | DOH — the submission event enters the tenant audit log. STU — the Approval Queue. CC — nothing; *"a workflow approval likewise is not an in-shift decision"* (L68226). FL — nothing. SA — nothing. |
| 13 | **Return with comments** | `WF-AUT-006` L53540 | `MOD-STU-11` | DOH — *"no effect"*. STU — *"the queue and the version history"*. CC — *"no effect"*. FL — *"no effect; the prior version remains in force"*. SA — *"no effect"*. |
| 14 | **Revise and resubmit** | `WF-AUT-007` L53572 | `MOD-STU-11` | *"As for `WF-AUT-006` until publication occurs."* |
| 15 | **Evaluate** — composed agents only, **not Workflows** | — | `MOD-STU-15` | DOH — nothing. STU — the Governance tab's three‑gate progress track. CC — nothing. FL — *"no composed reasoning agent appears in any work package or executes on a device"* (`TEST-STU-133`, L34148). SA — the evaluation harness and the platform review queue. |
| 16 | **Maker‑checker approve** | `WF-AUT-004` + `WF-AUT-005` L53505 | `MOD-STU-11` | DOH — *"Job version adoption decisions route to Job Owners"*. STU — *"version history, approval log, diff, linkage view"*. CC — *"no role in publication"*. FL — *"the first screen of the next execution carries the change notice for notified classes"*. SA — *"the versioning policy and per-device package inventory"*. |
| 17 | **Publish** | `WF-AUT-008` L53607 | `MOD-STU-12` | DOH — *"Job version history, adoption tracking, and the audit"*. STU — *"the linkage view showing which Jobs and Runs are on each version"*. CC — *"no publication role; it shows deviations against the version each run actually executed"*. FL — *"the change notice on the first screen of the next execution and the flagged steps in situ"*. SA — *"the per-device package inventory with per-run pinned versions and the adoption-timing lag metric"*. |
| 18 | **Generate the package** | `WF-AUT-009` L53644 | `MOD-STU-14` | DOH — *"assignment pins the package"*. STU — *"package definition and contents"*. CC — *"deviation workspace reads the severity level and bundle the device applied"*. FL — *"evaluates and enforces from the package alone"*. SA — *"the severity catalog distributes into packages and a catalog change is a package-affecting, critical-class change"*. |
| 19 | **Pin** — **a Delivery Operations Hub act, `MOD-DOH-06`** | `WF-AUT-010` L53679 | seam to slice 6 | DOH — *"the run record with its immutable pin"*. STU — *"the linkage view showing runs per version"*. CC — *"the run's version is shown alongside its deviations"*. FL — *"the pinned package is what executes"*. SA — *"per-run pinned versions in the device package inventory"*. |
| 20 | **Supersede** | implicit in `WF-AUT-008` | `MOD-STU-12` | *"a superseded version is not deleted — prior versions are retained in full and remain permanently readable"* (L53332). Named `Superseded` at L31125/L33479/L53326 and `Outdated` at L8616 — see D21. |
| 21 | **Roll back** | `WF-AUT-011` L53711 | `MOD-STU-12` | DOH — *"Job linkage and adoption"*. STU — *"version history showing both the withdrawn and the corrected version"*. CC — *"deviations continue to be attributed to whichever version each run executed"*. FL — *"the change notice at the next execution boundary"*. SA — *"package inventory shows the fleet's mixed state during the transition"*. |
| 22 | **Archive** | implicit in `WF-AUT-011` | `MOD-STU-12` | Manual, deliberate, against a clear no‑active‑Jobs indicator; blocked where the indicator cannot be computed (L33505). |

### 4.1 The four steps whose refusals are the point

**Rollback is a forward act (L53703).** *"A published version turns out to be wrong. The platform does not un-publish it, because the floor may already have run it. Instead the previous content is put through the chain again and comes out as a new, higher version number."* Its denied path, verbatim (L53706): *"**Deleting or hiding a published version is refused; prior versions are retained in full. Rolling back by editing a published version in place is refused. Skipping the chain for a rollback is refused** — nothing reaches the frontline without sign-off at each stage."* And the operational branch beside it (L53707): *"In-flight runs are executing the bad version. They cannot be re-based, so the correct response is operational — cancel or complete under supervision — not technical."*

**Revision cannot skip the Reviewer (L53567).** *"A revision cannot skip the Reviewer stage even where the change is trivial."* `AC-WF-AUT-007-04` (L53575): *"No auto-acceptance of a resubmission exists."*

**Rejection requires comments (L53535).** *"Rejection without comments is refused, because **the comment is the instruction to the Author.**"* And the notification is never the mechanism (`AC-WF-AUT-006-03`, L53543): *"Returned items are visible in the Author's queue independently of notification delivery."*

**Publication cannot re‑base an in‑flight run (L53602).** *"A publication cannot re-base an in-flight run. A Supervisor cannot force adoption on a Job they do not own; the adoption decision keys to the Job Owner field. **A Client Command Center user cannot publish anything** — configuration changes travel only through Studio authoring or the governed Lane B pipeline."*

### 4.2 The four sequences as the fixture's spine

`SEQ-011`'s ending state (L68040) is the most complete single statement of a finished draft in the source and is the target state for the Builder fixture:

> *"a draft of **Assembly — Wheel Bolt Torque Verification** exists with its screens authored, the wheel bolt torque specification set to a lower limit of 44 Newton metres and an upper limit of 47 Newton metres against drawing reference `DWG-A441`, severity banding set so that a departure of 0 to 10 per cent outside the limits maps to Severity 2 and beyond 10 per cent maps to Severity 1, the containment checklists selected per severity level, coaching defaults designated, the qualification baseline set to Torque Wrench Operator Certification with screen-level overrides where authored, all three work-instruction difficulty levels present, and both language variants complete; the draft is submitted into the approval chain and is not published, not versioned as a release, and not available for Job assignment."*

The four sequence states are the fixture's state machine: `STATE-STU-PREPARED` → `STATE-WF-DRAFT-SUBMITTED` → `STATE-WF-RELEASE-APPROVED` → `STATE-WF-PUBLISHED-V210`.

**`FB-SEQ-012` (L68262) is the one‑person‑quality‑team failure in operational form**, and it is `DEC-RELAUTH-001` made concrete: *"**Primary failure**: no eligible Reviewer exists because the only other grant-holder authored the submission… **Terminal safe state**: the submission stays submitted and unpublished, no version exists, no package can be built, and no Job can link to it."* L68291 puts it plainly: *"The failure branch shows the platform's answer to a one-person quality team: work does not get published faster, **it does not get published at all**."*

**`SEQ-013` step 3 (L68396) makes the package completeness check a separate act from the build**: *"The platform, checking the package before it is publishable, verifies that the specification limits, the severity mappings, the gate rules and the deviation-capture forms are all present. If any were missing the package could not be built and the version could not be distributed, because the device would be unable to classify or contain alone."* And L68465 names the distinction the state model must carry: *"`Versioned` and `Distributable` are different states, so **a version can exist in history without ever having been safe to run**."*

---

## 5. DEPENDENCY ORDER

The source's own dependency rows contain no cycle on this surface — every edge runs one way, from authority to content to governance to distribution. What they do contain is a **layering inversion**: `MOD-STU-11` (approval) and `MOD-STU-12` (versioning) are *consumed by* five modules and *depend on* none of them, so they must be built early even though they appear late in the section order.

1. **Spine S1, S4, S6, S7, S12** — `evaluateStudioAccess`, the state contract, the audit path, the boundary refusal classification, the derived‑count qualifier. No module edge; this is the floor.
2. **`MOD-STU-18`.** It gates every other module (L34647: *"Gates every other module in this chapter"*). Its own dependency is the identity layer and the tenant administration area, both built in slice 4. Build it first so that no later module invents a permission check.
3. **`MOD-STU-01`.** Depends on the registry, the entitlement set and the tier, all slice 3. Produces the refusal classification other modules inherit. Stub `MOD-STU-15`'s enablement — its authority is `DEC-CAPAUTH-001`.
4. **`MOD-STU-03`.** Owns `OBJ-STU-WORKFLOW` and is the landing view; every journey starts here. Edge: the Delivery Operations Hub for linkage counts (seam, slice 6) and the platform taxonomy (slice 3).
5. **`MOD-STU-11` — the chain, as a service, before any content module can submit.** Edges: the identity layer for person distinctness, and `MOD-STU-12`'s diff engine for classification validation. **Build the chain with the diff engine stubbed and a staffability check that names its shortfall**, because `FUNC-STU-12-01-A-2` (L33486) requires the submission to be *held* rather than advanced when the diff is unavailable — which is a behaviour the chain must be able to express before the diff exists.
6. **`MOD-STU-12`.** Edges: `MOD-STU-11` gates it; the Job Owner and adoption decision are seams to slice 6. Building it here closes step 5's stub.
7. **`MOD-STU-04`.** Edges: `MOD-STU-03` for the Workflow record, `MOD-STU-07` for the default routing template pointer, the taxonomy, the locale set, the platform‑standard deviation‑capture forms. **Ships with the routing pointer stubbed** — see step 8.
8. **`MOD-STU-07`.** Edges: the global severity catalog (slice 3), the tenant role set, the Delivery Operations Hub for run‑time role resolution (seam, slice 10), the embedding service (external, simulated). Closes step 7's stub. Build it after `MOD-STU-11`, because published‑item edits pass the chain under `DEC-LIBREV-001`.
9. **`MOD-STU-06`.** Edge: `MOD-STU-04` for the Workflow's declared locale coverage, and `MOD-STU-09`'s difficulty‑level model. Cheap; a small object with one hard scope refusal.
10. **`MOD-STU-05`.** The largest module. Edges: `MOD-STU-01` (which sections exist), `MOD-STU-06` (blocks), `MOD-STU-07` (pointers), the severity catalog, the tenant action bundles, the certification list, the locale set. **This is where five publication‑blocking validations land**, so it must follow both `MOD-STU-07` and `MOD-STU-11`.
11. **`MOD-STU-09`.** Edge: `MOD-STU-05` Section 1 content and `MOD-STU-06` block content; the drafting aid; the worker‑profile field (seam, slice 4 fixture field).
12. **`MOD-STU-17`.** Edge: everything worker‑facing from 05, 06, 07, 08, 09. Its completeness check cannot be written before the elements it covers exist. It is also `MOD-STU-12`'s publication gate, which is why it is late but before publication is exercised.
13. **`MOD-STU-13`.** Edges: the certification list (slice 4), the tag‑to‑qualification‑set mapping (tenant administration area), the posture and clearance duration (slice 4 floor register), the command channel for clearances (seam, slice 9). Supplies `MOD-STU-05` Section 9, so its evaluator must exist before Section 9's publication‑blocking check can fire — but its *screens* can follow.
14. **`MOD-STU-02`.** A pure composition over 05, 07 and 13. Nothing owns it earlier because it has no object of its own.
15. **`MOD-STU-10`.** Edges: the Delivery Operations Hub parts registry — **`MOD-DOH-19`, registered but unscheduled** — and the tenant suspension state (slice 4). Isolated: nothing else depends on it. Build it late so a seam that must declare an absence is not on the critical path.
16. **`MOD-STU-08`.** Edges: `MOD-STU-11` and `MOD-STU-17`; platform‑side storage and entitlement. Its whole substance is what it excludes, so it needs `MOD-STU-14`'s manifest to exclude *from*.
17. **`MOD-STU-14`.** Edges: 05, 06, 07, 09, 12, 13 for contents; 08 for the exclusion; the severity catalog and action bundles; the Delivery Operations Hub for the build trigger and the pin (seam, slice 6). **Last of the content path**, because it consumes six modules.
18. **`MOD-STU-15`.** Two open decisions gate it (`DEC-CAPAUTH-001`, `DEC-AGENTLC-001`) and a third bites its second matrix column (`DEC-DELEG-001`). Nothing else depends on it except `MOD-STU-01`'s enablement stub. Parallelisable off the critical path.
19. **`MOD-STU-16`.** Edges: `MOD-STU-12`'s patch path, `MOD-STU-13`'s requirements, `MOD-STU-07`'s asset flagging, and the Client Command Center for the Lane‑B decision (seam, slice 9). **Last**, because it is the only module whose central act happens on another surface and because `DEC-LANEB-001` must render both readings against a chain that already exists.

---

## 6. CROSS‑SLICE SEAMS — named, never inline

Each ships as a named interface with a seeded fixture behind it and an entry in the handover list. A silent stub is the defect. **Where the counterpart is not scheduled anywhere, the absence is declared rather than guessed** — slice 4 hit two unregistered dependencies and both modules correctly declared the absence.

### 6.1 Consumption seams — the counterpart is already built

| seam | consumer | owner | contract |
|---|---|---|---|
| Grant assignment and revocation | `MOD-STU-18` | tenant administration area, `MOD-DOH-09`, **slice 4** | *"grant administration sits in the tenant administration area inside the Delivery Operations Hub"* (L34532). Revocation is *"an identity-layer action rather than a Studio-layer one"* so it holds *"even if the Studio is degraded"* (L31944, L34588). Fail closed on an unreadable grant (L34584). |
| Worker certification list | `MOD-STU-13` | `MOD-DOH-04`, **slice 4** | `AC-STU-119` (L33770): the Studio cannot create, edit or delete a certification record. An override naming an unmaintained certification blocks publication with the certification named. **Lands on slice 4's D22** — certification types are a seeded fixture with no CRUD screen; this check reads that same fixture. |
| Worker‑profile difficulty field | `MOD-STU-09` | `MOD-DOH-04`, **slice 4** | *"Not applicable — the profile field is Delivery Operations Hub master data"* (L32970). An **additive fixture field**, not a new module. Unreadable → the standard level as *"a defined default rather than an absence"* (L32998). |
| Qualification gate posture and clearance duration | `MOD-STU-13` | tenant administration area, **slice 4** floor register | Unreadable → *"the device applies the stricter posture, hard-block, because the configurability principle permits stricter and never looser"* (L33674). |
| Shift timing for `SCHED-HANDOFF-001` | `MOD-STU-02` | `MOD-DOH-03`, **slice 4** | Default 30 minutes before shift end, computed against the Shift's end time (L67942). |
| Tenant suspension state | `MOD-STU-10` | `MOD-DOH-01`, **slice 4** | Under soft suspension *"master-data writes are blocked, including new parts"* (L33121). The refusal names the **suspension state**, not a technical fault (L33145). |
| Atomic capability registry, entitlement set, tier | `MOD-STU-01`, `MOD-STU-15` | `MOD-SA-02` / `MOD-SA-11`, **slice 3** | Capabilities outside entitlement are *"visible as unavailable with a stated reason, never silently absent"* (`AC-STU-008`, L30783). |
| Global severity catalog | `MOD-STU-05` §7, `MOD-STU-14` | `MOD-SA-07`, **slice 3** | Unreadable → *"blocks publication rather than offering a stale level list"* (L31767). |
| Evaluation harness results | `MOD-STU-15` | `MOD-SA-05`, **slice 3** | Unreachable → *"the composition holds at Evaluation pending and is never advanced on an assumption"* (L34050). |

### 6.2 Forward seams — the counterpart is registered but unbuilt

| seam | consumer | owner | slice | contract |
|---|---|---|---|---|
| Job and Run linkage counts | `MOD-STU-03`, `MOD-STU-12` | `MOD-DOH-05` / `MOD-DOH-06` | 6 | Renders *"Linkage unavailable, last retrieved at"* with a timestamp, **never zero** (`AC-STU-053`, L32018). |
| Job Owner identity and the adoption decision | `MOD-STU-12` | `MOD-DOH-05` | 6 | A whole matrix **column** (L33456) whose only `Allowed` cell is the adoption decision. The permission keys on a **field value**, not a role. |
| Package build trigger and the pin | `MOD-STU-14` | `MOD-DOH-06` | 6 | *"the build fires at run assignment in the Delivery Operations Hub"* (L33823). `WF-AUT-010`'s surface is the Hub (L53668). Slice 5 builds the **definition, manifest and pinning contract** and renders the pin; it never fires a build. |
| Qualification validation at assignment | `MOD-STU-13` | `MOD-DOH-07` | 6 | The first of three enforcement points. Slice 5 owns the **requirement and the evaluator**; slice 6 owns this point. |
| Frontline Training Library Viewer | `MOD-STU-08` | `MOD-FL-B12` | 7 | Named three times in the matrix as the Worker's route (L32822‑L32824). Slice 5 builds the **authoring and the exclusion guarantee**; the viewer is slice 7. |
| Package delivery, on‑device evaluation, reconnect | `MOD-STU-14` | `MOD-FL-A*`/`MOD-FL-B*` | 7, 8 | Slice 5 owns the manifest and the integrity check; the device is slices 7 and 8. |
| Qualification clearance, action ten | `MOD-STU-13` | `MOD-CC-13` | 9 | *"the Studio from granting one; any agent from granting one"* (L33676). **Aligns with slice 4's D23** — the Hub renders the register, the Command Center exercises the grant, and now the Studio renders the requirement. |
| Lane‑B decision | `MOD-STU-16` | `MOD-CC-06` / `MOD-CC-13` action 3 | 9 | *"the Studio displays, it does not decide"* (L34293). |
| Escalation delivery and role→person resolution | `MOD-STU-07` | `MOD-DOH-10` | 10 | *"escalation delivery is server-side and is not packaged"* (L33799). |
| The tenant audit log | every Studio write | `MOD-DOH-17` / `MOD-DOH-18` | 10 | *"The Studio keeps no audit log of its own"* (L31481). Read‑through over a seeded fixture — **the same pattern slice 4 adopted for Platform Access History (its D14)**, and for the same reason: a second store would be invisible until slice 10 tried to reconcile. |
| Composed‑agent platform review | `MOD-STU-15` | `SURF-SA` | 12 | Held at Platform review, never advanced on an assumption. |

### 6.3 Unregistered dependencies — declared, not guessed

**`MOD-DOH-19` Parts Registry.** Registered in `registries/generated/modules.json` as `not-represented`, **explicitly excluded from slice 4** (*"tenant master data, but not tenant setup, users, Workers, qualifications or devices; nothing in slice 4 reads `OBJ-DOH-PART`"*), and named in **no later slice's stated scope** in the umbrella build order. `MOD-STU-10` depends on it entirely. The seam ships as a named interface plus a seeded skeletal‑record fixture, the **Skeletal** badge renders, and the completion path states its owner with **no slice assigned**. The hard constraint that forbids a silently‑succeeding stub: *"if the hand-off cannot be confirmed, the reference is not created, because a reference to a part that does not exist in the registry would break genealogy"* (L33143) and `AC-STU-096` (L33220).

**The severity action bundle editor.** `MOD-STU-05`'s Section 7 consequence preview reads it (L32379) and `MOD-STU-14` packages it (L33795). Its owner is stated only as *"the tenant administration area"* — **no `MOD-DOH-*` identifier appears anywhere in the cards read**. `OBJ-049` (L8837) exists in the object register with no owning module. Ships as a named read interface over a seeded bundle fixture.

**The tag‑to‑qualification‑set mapping.** `MOD-STU-13` reads it; the matrix (L33638) says *"the mapping is tenant administration area master data"*; **no module owns it in any card read.** Ships as a named read interface with the *"convenience rather than a requirement"* fallback (L33662): unreadable → the author states the baseline manually and publication is **not** blocked.

**The composed‑agent platform review queue.** L67927 names it; no `MOD-SA-*` identifier is attached. Ships as a named interface with a seeded outcome fixture.

**The multimodal embedding and indexing service.** External — *"currently Gemini Embedding 2.0"* (L31191). The storyboard is browser‑only with no network, so the index is a seeded fixture with an explicit **not indexed** state. `AC-STU-072` (L32764) is what makes the simulation honest: *"indexing never changes approval state."* `DEC-EMBED-001` renders on screen.

### 6.4 Seams the Studio OWNS for later slices

| seam | consumers | contract |
|---|---|---|
| The work‑package definition and manifest | slices 7, 8 | the five content classes (L33793‑L33797), the two exclusions (L33799), the integrity check and quarantine (L33839, L68396) |
| Agent operating parameters | slice 11 | L31705‑L31709, what each of the three standard agents needs and where it is configured |
| Threshold and deviation‑rule context | slice 9 | `INT-STU-CC` (L31189), outbound |
| Escalation routing rules | slice 10 | L31120 seam 4 — the Studio is *"the producer of escalation routing rules, which the Delivery Operations Hub then resolves from roles to persons"* |
| Procedural and semantic memory writes | slice 11 | `FUNC-STU-16-01-A-1`/`A-2` (L34218‑L34219) |

---

## 7. CONFLICTS AND SILENCES — NUMBERED DECISIONS

Every one becomes a numbered decision in the spec. None becomes a silent assumption in code.

**D1 — Which screen catalogue is canonical.** Two exist: mnemonic A (L31067‑L31089, twenty‑one rows) and numbered B (L48259‑L48273, fifteen rows), plus nineteen one‑off literals. **They do not collide on a token**, unlike slice 4's `SCR-DOH-23`/`SCR-DOH-023`; they collide on coverage in both directions. *Options:* (a) A; (b) B; (c) a union. **Recommend (b) as the route key, with A's three orphans registered as sub‑views of their B parents.** B is the only catalogue carrying roles‑that‑can‑open, module‑and‑feature and navigation entry point, `AC-SCR-STU-001` (L48346) asserts *"All fifteen screens exist"*, and B is the only one that has a Sign‑in row and a permissions screen — both of which the surface demonstrably needs. A's `SCR-STU-LEARN` becomes a view of `SCR-STU-13`, `SCR-STU-PARTADD` an inline panel of `SCR-STU-04`, `SCR-STU-DRAFTAI` a state of `SCR-STU-11`. The nineteen literals are recorded as **uncatalogued storyboard names** and none becomes a route.

**D2 — Which permission statement governs a cell.** Three tables outside chapter 20 state Studio permissions and all three disagree with it: `MTX-TEN-02b` (L22031), §25.3 (L48319), and the `SEQ-0xx` role‑authority tables (L67899, L68050, L68202, L68354). **Recommend the chapter‑20 module matrices as governing, without exception**, for the reason the source itself supplies at L31513: the module template is *"identical for all eighteen so that a reader can compare modules directly and so that an omission is visible rather than invisible"*, and L34537 states *"Every cell carries an explicit status."* The others are restatements at coarser granularity. **§25.3's eight‑row table is the most dangerous of the three** and is recorded as attributed‑but‑disputed, because it fills the Read‑only Auditor column with statuses that `AC-STU-157` forbids.

**D3 — May the Read‑only Auditor open the Studio.** `DEC-AUDSTU-001` (L34524), open, and the most pervasive open cell on the surface — 47 cells across 15 of 26 matrices. *Options:* (a) no Studio access; (b) read‑only to published versions, version history, approval logs and diffs, no drafts; (c) read‑only to everything including drafts. **The source recommends (b) and this census does not overrule it — but the decision is the client's and the build must not pre‑empt it.** L34524 is binding: *"Until decided, every Read-only Auditor cell in this chapter reads `Client Decision Required` rather than being guessed."* **Recommend: build the token, render `Client Decision Required` with `DEC-AUDSTU-001` and both readings on screen, and stage option (b) behind the decision.** This is the surface's headline disclosure.

**D4 — What the Studio does when the connection drops.** Three answers: `STATE-08`/`STATE-13` (L48014), `STATE-12` (L48330), and chapter 20's own four‑state machine with an *"explicit disconnected state"* (L30842‑L30863). No `DEC-*` identifier exists. **Recommend the split rule that satisfies all three**, mirroring slice 4's D7 on a surface with no offline mode: content already loaded → **`STATE-08`** with a freshness marker; a read that fails outright → **`STATE-12`** naming what failed and whether anything was written; **every write control → DISABLED with a named reason, never queued**; the editor additionally holds an explicit disconnected state with the local draft buffer and the plain statement that **no save has been recorded** (`AC-STU-009`, L30871); reconnection → **`STATE-13`**, and structural validation re‑runs **in full** before submission is re‑enabled (L32152). **Nothing on this surface ever queues a write, and no `STATE-07` renders anywhere.**

**D5 — `Superseded` or `Outdated`.** `MOD-STU-12` and the object table say `Superseded` (L31125, L33479, L53326); `OBJ-037` says `Outdated` (L8616). **And `MOD-STU-12` uses `Outdated` in the same paragraph for a different thing** — the per‑Job adoption state after the update window lapses. **Recommend `Superseded` for the version state and `Outdated` for the per‑Job adoption state, exactly as L33479 uses them**, and record `OBJ-037`'s naming as an erratum. Collapsing them loses the distinction between *a newer version exists* and *this Job's window lapsed*, which are separately notifiable (L33569).

**D6 — Does a Workflow, as distinct from a version, have an Archived state.** Chapter 20 says yes (L31124, L31924, itself flagging Archived as derived from §5.12.3); `OBJ-036` says no (L8598). **Recommend yes**, because `MOD-STU-03`'s own state machine draws it and because a Library with no archived filter cannot express the linkage view's *"not linkable"* state. Record `OBJ-036` as the narrower statement, not a contradiction.

**D7 — The rollback decision has two identifiers.** `DEC-WFROLL-001` (chapter 28, L53350, 8 references) and `DEC-VERROLL-001` (chapter 7, L8623, 5 references) ask the same question with no cross‑reference. **Recommend registering `DEC-WFROLL-001` as canonical and `DEC-VERROLL-001` as its alias**, because the chapter‑28 card is the one carrying options, a recommendation, a trade‑off and a decision owner (L53710) while chapter 7's is a one‑line mention. **Both identifiers render**, so a client search on either finds the same card.

**D8 — Five package content classes or six.** `AC-STU-120` (L33941) says five; `AC-WF-AUT-009-01` and `TEST-WF-AUT-009-01` (L53647‑L53648) say six. **Recommend: the manifest is one data structure quoting L33793‑L33797's five numbered classes verbatim, with the six‑way split recorded as a second grouping of the same contents.** Neither count is asserted as *the* count; the manifest's *contents* satisfy both assertions, and the gate asserts contents rather than cardinality.

**D9 — `Unavailable` on this surface.** Inherited from slice 4 and not re‑litigated: overloaded across two senses that render oppositely. **What is new is that this surface settles the connectivity axis in a single row.** `MOD-STU-18`'s consolidated matrix row 23 (L34563) puts `Unavailable — the Studio requires an active connection` in seven columns and `Explicitly prohibited — no access at all` in the eighth, same row, same axis. **Recommend: on the connectivity axis `Unavailable` is sense A and renders DISABLED with the condition named; on the role axis (`MTX-TEN-02b`'s `[Y6]`, `[Y12]`, §25.3's rows) it is sense B and renders ABSENT**, which is also what the chapter‑20 matrices say in `Explicitly prohibited` terms for the same cells. D2 makes chapter 20 governing, so sense B cells never render at all.

**D10 — Which feature‑numbering scheme is the traceability key.** Chapter 20's `FEAT-STU-01-01` against the four‑digit `FEAT-STU-0101` (L47378‑L47431). Both are registered in `features.json`. **Recommend the four‑digit catalogue as the traceability key**, on the same reasoning as slice 4's D20: it is the only scheme covering all eighteen modules in one table with a uniform three‑per‑module shape, which is what a traceability matrix needs. Map the chapter scheme to it once, in one table, and never mix them in a ticket.

**D11 — Which object naming scheme is canonical.** `OBJ-STU-*` mnemonic (L31122‑L31138, fifteen) against `OBJ-036`…`OBJ-051`, `OBJ-066` numeric (L8589‑L8875, L9391, eighteen). `business-objects.json` carries the numeric ninety‑nine and **zero** `OBJ-STU-*`. **Recommend the numeric register as canonical with the mnemonic carried as a label**, because the numeric scheme is the one the umbrella design confirmed at §12 and the one the coverage register can close against. **Record the three mnemonics with no numeric counterpart — `OBJ-STU-QUALREQ`, `OBJ-STU-CAPSTATE`, `OBJ-STU-LOCALE` — as a registered gap**, not as new objects, because minting three new `OBJ-1xx` rows would inflate a closed register of ninety‑nine.

**D12 — Does capability enablement have an operator at all.** `DEC-CAPAUTH-001` (L33992). All four tenant columns of `MOD-STU-15` row 1 (L34009) and `MOD-STU-18` row 15 (L34555) read `Client Decision Required`, so **nobody holds it**, and enablement decides which of the nine sections exist. Source recommendation: option (b), Tenant Admin with recorded Quality Manager consultation. **Recommend building the Atomic Capabilities view read‑only with the enablement controls DISABLED and `DEC-CAPAUTH-001` named**, and seeding the enablement state so the nine sections render. Building it with an operator would pre‑empt the decision; building it without the view would hide the mechanism `AC-STU-006` and `AC-STU-008` require to be visible.

**D13 — May the Agent Author capability be delegated.** `DEC-DELEG-001` (L17920) — **not in chapter 20's open‑decisions table**, and chapter 20 nonetheless gives `MOD-STU-15`'s matrix a whole column headed *"Delegated administrator with Agent Author"*. `MTX-TEN-02b`'s `[Y21]` states the interim position: *"Until decided, the build denies Supervisor access to the Agent Builder and names the decision."* **Recommend the interim position**, and render the delegated column as `Client Decision Required` with `DEC-DELEG-001`. Building the column as `Allowed with conditions` would contradict §4.8.4 at the level of a stated fact.

**D14 — Does an approved Lane‑B value pass the chain.** `DEC-LANEB-001` (L33253). **`AC-STU-097` and `AC-STU-138` cannot both hold for a package‑borne value.** The only instruction binding both sides is `AC-STU-104`/`AC-STU-143`: **surface it, do not implement it silently.** *Options:* (a) full chain always; (b) the Lane‑B decision is the sign‑off; (c) the source's own hybrid — (b) restricted to values that cannot alter a specification limit, a severity mapping or a gate rule. **Recommend (c), the source's recommendation**, because it preserves the efficiency intent while keeping the three highest‑consequence value classes under the full floor, and because it is the only reading under which both acceptance criteria can be satisfied on disjoint value sets. **The classification step it adds depends on `DEC-PKGFIELD-001`, which is open** — so the value classifier ships as a named interface over a seeded field map, and the map's provenance renders.

**D15 — Does a library edit reach an in‑flight run.** `DEC-LIB-001` (L32591). **Recommend pinning semantics for anything that ships in the package**, the source's own recommendation, under which *"'propagates immediately' is true of authoring… and becomes true of the floor at the next package build."* The counter‑argument is on the record and is not trivial: pinning *"delays a safety-motivated checklist improvement by up to one Run"*. Both render.

**D16 — How many difficulty levels does the package carry.** `DEC-WIDIFF-001` (L32949). **The source's interim rule (all levels) and the source's recommendation (assigned level plus standard) differ.** `AC-STU-090` (L33077) requires the interim rule to be applied *and* the decision surfaced. **Recommend the interim rule** — build all levels into the manifest — because it is the reading carrying an acceptance criterion, and render the recommendation as the alternative with its storage trade‑off stated.

**D17 — What "lightweight review" removes.** `DEC-LIBREV-001` (L32622). **Recommend option (a), the full three‑stage chain with a scoped preview limited to the changed item** — the source's recommendation and its own interim treatment: *"Until it is decided, this blueprint treats library edits as passing the full chain and records the divergence."* One separation‑of‑duties floor across all content that reaches the floor is the whole point of §5.18's non‑widening rule.

**D18 — Who decides a Lane‑B proposal.** `DEC-LANEBAUTH-001` (L34175). **Recommend option (a), Quality Manager and above only**, the source's recommendation, *"because the Client Command Center's action set is explicitly closed at ten"* — and because slice 4 already built that closed set's authority column. The Supervisor‑with‑grant cell renders `Client Decision Required`.

**D19 — Which capture types exist.** `DEC-CAP-001` (L32232). **Adopted, not open**: the §5.5.3 seven, with checkbox confirmation carrying a multiplicity setting. `AC-STU-065` (L32421) names them verbatim and `TEST-WF-AUT-002-04` (L53401) makes divergence a **build failure**. Build the closed set from `AC-STU-065`'s own words; render both source readings in the disclosure.

**D20 — Whether the taxonomy ships with sixteen names.** `DEC-TAX-002` (L31892). **Adopted**: the seeded catalogue ships **empty** and tenants create their own immediately at every tier. **The sixteen names are not invented and no example names one as canonical** (L31894). `DEC-TAXROLE-001` (L31914) — which role may create one — stays open; **recommend the source's Tenant Admin reading** and render the control `Client Decision Required` until ruled.

**D21 — Object state vocabularies.** Every object on the surface has two to four rival sets. **Recommend the module identity cards as governing** — the same ruling slice 4 made as its D21, for the same reason the source supplies: state names are `Derived Clarification` while the behaviours are `SoW Fact`. **But record what is lost, and model the three that are operationally distinct as flags rather than discarding them:** `Quarantined` on a package (in `MOD-STU-14`'s prose, absent from its enumeration, and the state that stops a bad package reaching a device); `Stalled` on a submission (in `SEQ-012`'s diagram only, and the only state that makes `DEC-RELAUTH-001`'s deadlock visible to a tenant); `Distributable` on a version (in `SEQ-013` only, and the state that separates *a version exists* from *a version is safe to run*).

**D22 — Whether the Studio has a `STATE-07`.** No. L48330 is decisive and no source disagrees on this specific point. **Recommend: `STATE-07` renders nowhere on `SURF-STU`, and a gate asserts its absence** — the same shape as slice 4's gate 6, on a different token. What replaces it is D4's split rule.

**D23 — Where the Severity 1 arming confirmation lives.** §5.2.2 cites §5.5.9; the behaviour is in §5.5.8. `DEC-STUXREF-001` (L31869). **Recommend building against §5.5.8 — Section 7 — and recording the off‑by‑one**, because *"downstream requirement traceability keyed on the cited section number would point at the wrong configuration section."*

**D24 — Whether a Studio grant carries an expiry.** `DEC-TENGRANT-001` (L16457), raised outside chapter 20 and absent from its table. `MOD-STU-18`'s states (L34573) include `Expired` but attach it only to the implementation‑team capacity. **Recommend: `Expired` exists on `GRANT-STU-IMPL` because §5.11.4 requires revocation at onboarding's end, and renders `Client Decision Required` on the other two grants**, with `DEC-TENGRANT-001` named.

---

## 8. THE HONEST RISK LIST

**R1 — A Studio view claims a device state.** The publication surface is one careless sentence away from claiming something it cannot know. L31181: *"The Studio's publication view must therefore never show a version as 'live on the floor'."* Three acceptance criteria guard it — `AC-STU-023` (L31226), `AC-STU-112` (L33590), `AC-STU-118` (L33769) — and `SB-STU-03` (L31304) writes the honest line: *"Published. One Job notified. Zero of one devices on this version."* *Mitigation:* every adoption figure renders in its true command state from the fifteen‑state ladder; the gate plants a *live on the floor* string and proves it red.

**R2 — The Read‑only Auditor column gets a status.** `DEC-AUDSTU-001` touches 47 cells across 15 matrices, and **three places in the source already give the Auditor a status** — §25.3 L48321 `Not applicable`, §25.3 L48325 `Read-only`, `SEQ-010` L67908 `Read-only`. An implementer transcribing from any of the three fills a cell the chapter deliberately leaves open, and `AC-STU-157` forbids exactly that. **This is the slice‑5 analogue of slice 4's brief defects, and it is the most likely one to happen.** *Mitigation:* `Client Decision Required` is a first‑class rendering; a gate asserts no Auditor cell on `SURF-STU` resolves to a permission status.

**R3 — A third inheritable default.** L32040 names it: *"an implementation that adds a third inheritable default, however convenient, departs from the specification and must be raised as a change request."* Severity is the obvious candidate and is the one thing forbidden. *Mitigation:* closed vocabulary with an exhaustiveness check; the gate plants a third default.

**R4 — The canvas drawing is stored twice.** L32098: *"no role may author a sequence reference that differs from the drawn order, because two references would make skip detection unfalsifiable."* A build that stores the drawn order and the detection reference separately creates exactly the second reference. *Mitigation:* one structure; `AC-STU-056` as a gate reading the built artefact.

**R5 — A capture type outside the adopted seven is offered.** Two seven‑type lists exist and differ. `TEST-WF-AUT-002-04` (L53401) demands a **build failure** on divergence: *"Cross-check the Builder capture-type list against the Frontline renderer list and fail the build on divergence."* *Mitigation:* one `as const satisfies readonly T[]` named verbatim from `AC-STU-065`, plus a gate that plants an eighth type.

**R6 — A deviating screen publishes with no severity mapping.** Restated six times — L32244, `AC-STU-042`, `AC-STU-062`, `AC-WF-AUT-002-01`, `AC-SCR-STU-003`, `AC-011-01`. Six restatements is itself the signal. *Mitigation:* a publication‑blocking validation naming each unmapped screen; the gate plants one.

**R7 — The Severity 1 arming panel is a warning, not a recorded act.** `FUNC-STU-05-08-C-1` (L32313): *"if the confirmation cannot be recorded, the mapping is not saved."* A build that shows the panel and saves regardless satisfies a naive reading and fails `AC-STU-043` and `AC-STU-063`. *Mitigation:* the confirmation is a write through the audit path; **the covering test mutates the band before the audit fails and asserts the band did not persist** — slice 4's defect shape 3 in its slice‑5 form.

**R8 — Separation of duties is checked by role.** L33389: *"A user holding both the Supervisor and Quality Manager roles is still one person."* A role‑based check passes every test written with single‑role personas. *Mitigation:* distinctness keys on identity; a fixture persona holds both roles and the gate asserts refusal — `TEST-STU-152` (L34681) is the source's own test.

**R9 — The Studio claims an escalation was delivered.** `AC-STU-028` (L31328), `AC-STU-123` (L33944). L31257: *"a tenant must never be told that an offline device 'escalated'."* *Mitigation:* escalation state renders from the notification‑state ladder; no Studio surface holds a delivery claim.

**R10 — The superseded offline description reappears.** L31256 and L33803 name it; `AC-STU-030` and `AC-STU-126` forbid it. The superseded wording — *"processed at sync, with severity-band evaluation running on the captured value at that point"* — is a plausible sentence an implementer might write from first principles. *Mitigation:* a string gate over the built artefact.

**R11 — A Shared Instruction Block is modelled as a library item.** L32443 says it is easy to get wrong, and the natural data model for *write once, apply to eight screens* is a library. *Mitigation:* the block record is keyed by Workflow; the service‑layer refusal (L32486) is exercised by a gate that attempts a cross‑Workflow reference.

**R12 — The Studio mints a second audit log.** L31481 forbids it. **Same defect shape as slice 4's D14** — a second store to make a slice self‑contained, invisible until the owning slice reconciles. *Mitigation:* read‑through over slice 4's audit fixture; a gate asserts one store.

**R13 — A screen sentence points at content that is not there.** Slice 4's defect shape 5, and this surface is dense with pointers: library items (`AC-STU-071`), a coaching default per locale (`AC-STU-074`), a maintained certification (L33664), a branch target (L32101), a block reference (L32483), a part reference (L33211). Every one is a sentence naming content elsewhere. *Mitigation:* **every pointer‑bearing sentence has a test that fails when its target is removed** — not one that iterates an array and can only pass.

**R14 — Draft visibility is enforced in the render.** Slice 4's defect shape 7, on this surface's scope dimension. `AC-STU-048` (L32013) and `AC-STU-151` (L34668). A Library built from an unfiltered read that hides draft rows in the component has exactly the defect slice 4 shipped. *Mitigation:* the selector filters; the component receives only what the identity may read; **the gate asserts the selector, not the render.**

**R15 — `MOD-STU-04`'s two canvas rows are collapsed into one component with a flag.** Row 1 is `Explicitly prohibited` on the draft canvas for the Supervisor‑without‑grant and the Tenant Admin; row 2 is `Read-only` on the published canvas for the same two. A single canvas with a read‑only prop gets row 2 right and row 1 wrong. **This is R14's specific instance and the highest‑probability place for it.** *Mitigation:* two routes, two reads.

**R16 — `DEC-LANEB-001` is built one way on each side.** `AC-STU-097` and `AC-STU-138` cannot both hold. The chain team and the learning team would each satisfy their own criterion. *Mitigation:* the conflict renders on screen with both readings and their locators; the pinned fixture holds both and neither is asserted as the source's answer.

**R17 — The package manifest is asserted against five or six.** A gate written against either passes while contradicting a named acceptance criterion. *Mitigation:* the gate asserts **contents**, not cardinality (D8).

**R18 — The eighteen is rendered without its qualifier.** L4183 names this exact failure, *derived‑count leakage*, and `AC-STU-014` binds this build's own documents and screens. *Mitigation:* every occurrence carries the qualifier; a gate scans the built artefact for a bare Studio count.

**R19 — Forty‑one notifications ship without identifiers.** Forty‑one trigger rows across the eighteen cards, **none carrying a `NOTIF-*` identifier**, and `notifications.json` holds zero Studio rows against 205 total. A slice‑10 reconciliation will find forty‑one behaviours with no register entry. Slice 4 hit the same shape as its R9 — identifiers that existed with no content; this is the mirror, content with no identifiers. *Mitigation:* register the forty‑one as derived rows with their card locators **at census time**, not at slice 10.

**R20 — The Studio is built as if it could be offline.** Seventeen of eighteen module cards say *"Unavailable — the Studio requires an active connection"*, and L31515 warns that an offline status on this surface *"describes the Frontline consequence… not a Studio user's own experience"*. A build that renders a Studio offline state satisfies the shared thirteen‑state contract and contradicts the surface. *Mitigation:* D22's gate.

**R21 — `MOD-STU-10` ships a seam that silently succeeds.** `MOD-DOH-19` is registered and unscheduled. A stub that returns a minted identifier without a confirmed hand‑off violates `AC-STU-096` and L33143, and the violation is invisible until a package carries an unresolvable part reference. *Mitigation:* the seam's fixture returns a **confirmed** or **unconfirmed** outcome and the unconfirmed path is the one the gate exercises.

**R22 — Row 4 of `MOD-STU-14` is read as a Studio control.** *"Trigger a package build | Not applicable — the build fires at run assignment in the Delivery Operations Hub"*, with both Supervisor columns `Allowed with conditions`. An implementer reading only the Allowed cells will put a Build button on a Studio screen. **The same trap exists on `MOD-STU-13` row 7 (clearance), `MOD-STU-09` row 7 (profile field), `MOD-STU-12` row 6 (rebase) and `MOD-STU-05` row 8 (action bundle).** *Mitigation:* a cell whose token is `Not applicable` for the Quality Manager and `Allowed` for a Supervisor is a **cross‑surface statement**, never a control; the gate asserts no Studio route offers any of the five.

**R23 — The Studio's fifteen objects are minted as new register rows.** The mnemonic scheme has fifteen names; the numeric register already carries eighteen matching rows. Minting `OBJ-1xx` would inflate a closed ninety‑nine. *Mitigation:* D11 — numeric canonical, mnemonic as label, three gaps registered as gaps.

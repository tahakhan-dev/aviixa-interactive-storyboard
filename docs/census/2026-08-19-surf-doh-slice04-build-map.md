# SURF‑DOH SLICE 4 — BUILD MAP

**Delivery Operations Hub, setup half.** Modules in scope: MOD‑DOH‑01, 02, 03, 04, 09, 12 (FEAT‑DOH‑1201 only), 13, 14, plus one unnumbered device screen group. All line numbers are lines in `/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md` (122,241 lines). Every role matrix quoted below I re‑read directly from the source rather than from the reader summaries; where a reader was wrong I say so.

**Count scope, once, for everything here.** "Nineteen DOH modules" is the canonical §4.1.3 inventory (L2436, L1568, L1606). Every other number in this document counts *rows I read in a named table at a named line* — a module card's matrix, a screen catalogue, a state contract. No number here is an extraction tally and none should be quoted as an inventory total.

---

## 1. PER‑MODULE BUILD UNIT

### Conventions used in every unit below

**Screen identifiers.** Two incompatible catalogues exist and I verified both. Catalogue A: `SCR-DOH-001`…`026` at L26051‑L26076, five columns, carrying *access status by role set*. Catalogue B: `SCR-DOH-01`…`23` at L48095‑L48117, six columns, carrying *roles that can open it*, *modules and features shown*, and *navigation entry point*. They are not a superset relationship — `SCR-DOH-13` is "Run schedule board" (L48107) while `SCR-DOH-013` is "Run schedule, today plus 7 days" (L26061); catalogue B has a Sign‑in row (L48095) that catalogue A has no row for; catalogue A has a Suspension status panel (`SCR-DOH-003`, L26053) that catalogue B folds away. **I use catalogue B identifiers throughout and carry catalogue A's access‑status column as a cross‑check.** See D1.

**Screen states.** The thirteen‑state contract is at L48007‑L48014: STATE‑01 Empty, 02 Loading, 03 Success, 04 Validation, 05 Permission‑denied, 06 Read‑only, 07 Offline, 08 Stale‑data, 09 Queued, 10 AI‑degraded, 11 AI‑unavailable, 12 Failure, 13 Recovery. Two states are inapplicable across all of slice 4 and I state that once rather than in every unit: **STATE‑10 and STATE‑11 do not apply anywhere in slice 4** — MOD‑DOH‑02 and MOD‑DOH‑03 are "None. No agent creates, edits, archives or proposes" (L27204, L27373), MOD‑DOH‑04 is "No agent enters, edits, clears or expires a qualification" (L27572), and MOD‑DOH‑01/13 are fully functional with all agents paused (L27010, L29260). The single AI touchpoint in the whole slice is the Shift Handoff Agent *reading* shift timing (L27373) and *reading* qualification records to flag readiness gaps (L8427) — neither renders on a slice‑4 screen.

**STATE‑07 Offline — the Hub is not simply "web, therefore no offline".** The binding context says STATE‑07 is frontline‑only unless the source says otherwise. The source says otherwise, three times, and disagrees with itself. The global contract (L48014) says the three web surfaces "render a connection-lost banner and enter `STATE-08` or `STATE-13`, because they have no offline mode." The per‑screen inventory (L48196) says "Not applicable — the Delivery Operations Hub is a web surface with no offline mode. Loss of connection renders the failure banner of `STATE-12`." The module cards say something more specific and more useful: "the tier and usage view degrades to the last loaded figures with a freshness marker under `FB-DOH-CORE-001`; the upgrade and downgrade-request controls disable rather than queue" (L27004), and "Reads degrade under `FB-DOH-CORE-001`; qualification and clearance write controls disable rather than queue, because a queued clearance would be a safety control with no audit entry" (L27568). See D7 for the ruling. **Nothing on this surface ever queues a write.**

**Prohibition rendering.** Source status tokens map to the three renderings as follows, and this mapping is itself a decision (D8):

| Source token | Rendering | Why |
|---|---|---|
| `Unavailable` | **ABSENT** | The role cannot hold it in any scope. Nothing renders. |
| `Explicitly prohibited` — *categorical rule* | **ABSENT** | L17662: "no create-role, edit-role, or clone-role control on any surface". L23918: custom‑role creation is absent, not disabled, because "a disabled control would imply a roadmap promise". L64386/AC‑30‑20‑001 (L64421): no on‑device override control exists for any role. |
| `Explicitly prohibited` — *routing rule* | **DISABLED, NAMED REASON** | FB‑QUAL‑005 (L64415): the disabled control carries its reason "which teaches the rule at the moment it binds". Applies where another role on the same screen holds it — e.g. Supervisor on never‑held clearance (L27477). |
| `Not applicable — reason` | **ABSENT**, reason in help text | Nothing exists to enable. |
| `Read-only` | **STATE‑06**, cause named | L48013: "the cause is always named; 'read-only' alone is never shown." |
| `Allowed with conditions` | Renders; condition enforced at the write | — |
| Critical‑class action visible to a role that cannot approve | **CLASS BADGE** | Slice 4 has exactly one: the device wipe request (L45508, L107423). |

---

### MOD‑DOH‑01 — Tenant Lifecycle and Tier Operations

**Purpose (L26866):** "Enforce the tenant's commercial and compliance state everywhere in the Hub, record every transition, and render the tenant's own position read-only."

**Screens.**
- `SCR-DOH-03` **Tier and usage read view** (L48097, catalogue A `SCR-DOH-002` L26052; storyboard SB‑DOH‑013 L27029). Five regions in fixed order (L27029, restated as FUNC‑DOH‑12‑3.2.1 at L29100 and AC‑DOH‑12‑6 at L29136): (1) the meter definition quoted verbatim from the tier record; (2) current‑period consumption against ceiling as number **and** bar with a data‑as‑of timestamp; (3) ladder position with the three thresholds marked and the burst band shaded; (4) Active Locations count, **Site level only**; (5) suspension status.
- **Suspension status panel** — catalogue A `SCR-DOH-003` (L26053) only. Catalogue B has no row. Build it as a region of `SCR-DOH-03`, not a route (D1).
- Two banner variants in the shared chrome, not screens of their own: `SCR-DOH-SUSPEND-SOFT` (L65028) and `SCR-DOH-SUSPEND-HARD` (L65152).

**States.** 01 Empty (never — a tenant always has a tier), 02 Loading (**"Loading never renders a zero — a count that has not arrived is shown as a placeholder, not as '0'"**, L48009 — critical here, a consumption bar rendering 0 before load reads as "you have used nothing"), 03 Success with as‑of timestamp, 05 Permission‑denied for Supervisor/QM/Worker, 06 Read‑only (this screen is read‑only for everyone always — the cause is "the tenant's own position is rendered read-only", L26866), 08 Stale‑data on reconnect, 12/13. STATE‑04 applies only to the two request controls. STATE‑09 does not apply — nothing here is device‑facing.

**Controls and roles** (matrix verified at L26883‑L26896, twelve rows, "Every cell carries an explicit status", L26881):

| Control | TA | Sup | QM | Aud | Wkr | Effect |
|---|---|---|---|---|---|---|
| View tier / entitlements / caps / consumption | `Read-only` | `Unavailable` | `Unavailable` | `Read-only` | `Unavailable` | — |
| View ladder position and burst‑band status | `Read-only` | `Unavailable` | `Unavailable` | `Read-only` | `Unavailable` | — |
| View suspension status | `Read-only` | `Unavailable` | `Unavailable` | `Read-only` | `Unavailable` | — |
| See the suspension banner in soft or hard | `Allowed` | `Not applicable — no other user sees anything in soft or hard state` | same | same | same | — |
| See the compliance‑suspension message | `Allowed` | `Allowed` | `Allowed` | `Allowed` | `Allowed` — fixed message on the device | — |
| Request a tier upgrade | `Allowed` — self‑service, effective immediately | `Explicitly prohibited` ×4 | | | | Consumption **carries forward, never resets** (AC‑DOH‑01‑2, L27040; AC‑GOAL‑065, L2241) |
| Request a tier downgrade | `Allowed with conditions` — request only | `Explicitly prohibited` ×4 | | | | Records a request; execution is the client platform team's |
| Execute a downgrade | `Explicitly prohibited` ×5 | | | | | ABSENT for all |
| Change a suspension state | `Explicitly prohibited` ×5 | | | | | ABSENT for all |
| Change ladder thresholds | `Explicitly prohibited` — set per tenant in the Super Admin console | ×4 | | | | ABSENT for all |
| View tenant‑group membership | `Not applicable — groups are an internal label of the client's team and are not visible in any tenant's Hub` ×5 | | | | | ABSENT; AC‑DOH‑01‑10 (L27048) makes it testable |
| Read `tenant_state_history` via audit | `Read-only` | `Unavailable` | `Unavailable` | `Read-only` | `Unavailable` | — |

**What a denied role sees.** Supervisor, Quality Manager and Worker get **nothing at all** — the module rail does not offer the route (`Unavailable` = ABSENT). This is not a permission‑denied screen; a Supervisor who deep‑links gets STATE‑05 with the L48012 wording pattern ("this identity's roles and scopes do not carry the action, the name of the role that does, and the route to request it", and **the attempt is audited**). Read‑only Auditor sees the identical screen to the Tenant Admin minus the two request buttons. Note the trap: the module card's `roles_allowed` row (L26866) lists all five roles, which means *roles the module touches*, not *roles that can open the screen*. Drive visibility from L26885‑L26896 only.

**Object.** `OBJ-DOH-TENSTATE`, the module's only owned object — Hub is authoritative owner, the Super Admin console is the administering surface (L26874). States: `active, soft_suspended, hard_suspended, compliance_suspended, archived` (L26875). Tier‑change: `none, pending_downgrade`. Ladder: `below_80, at_or_above_80, at_or_above_100_burst, above_125_flagged`. Everything else the screen renders — Tenant, Tier, Usage Ledger, Pilot, Tenant Group — is SURF‑SA‑owned and read‑only here.

---

### MOD‑DOH‑02 — Location Configuration

**Purpose (L27098):** "Hold the tenant's physical structure as the anchor for timezone, shifts, Job binding, scoping and reporting drill-down."

**Screens.** `SCR-DOH-04` **Location hierarchy configuration** (L48098; catalogue A splits it into `SCR-DOH-004` browser + `SCR-DOH-005` detail/edit, L26054‑L26055). Storyboard SB‑DOH‑014 (L27217): three‑column tree collapsing to fewer columns at shallower depth; an archived node greyed with an "Archived" chip and **still clickable for history**; a node with in‑flight Jobs shows **a lock beside its structural controls**; a node whose archival is held shows a "Reassignment required — N Jobs paused" banner with a direct list. Each row carries an **in‑use badge** where records reference it (SB‑DEC‑03 panel 2, L112906).

**States.** 01 Empty ("the frame plus a sentence naming what would appear and what creates it", L48008 — but note AC‑51‑12 at L113054: a default Site exists *before any Tenant Admin signs in*, so true‑empty is unreachable and STATE‑01 renders only inside a Site with no Areas), 02, 03, **04 Validation carries the heaviest load on this screen** — the re‑parent refusal must name the blocking Jobs (L27149) and the archival confirmation must list affected child nodes and Jobs before confirmation (L112908), 05, 06 (hard suspension; archived node), 08, 12, 13.

**Controls** (matrix L27117‑L27127, eleven rows):

| Control | TA | Sup | QM | Aud | Wkr | Effect |
|---|---|---|---|---|---|---|
| View the location tree | `Allowed` | `Allowed w/c` own Site+Area scopes | `Allowed w/c` own scopes | `Read-only` | `Unavailable` | Area‑scoped Supervisors cannot see out‑of‑scope nodes **in any list, filter, search or export** (L27214) |
| Create a Site / Area / Location | `Allowed w/c` — blocked in soft, hard and compliance | `Explicitly prohibited` ×4 | | | | Commits with its audit entry in one transaction |
| Edit name, address, contact | `Allowed w/c` — **at any time**, fully audited | `Explicitly prohibited` ×4 | | | | Not blocked by in‑flight Jobs (L27119) |
| Re‑parent a Location / change depth | `Allowed w/c` — blocked while in‑flight Jobs exist | `Explicitly prohibited` ×4 | | | | Server‑side on every attempt; **no role may override, including Tenant Admin** (L27185) |
| Split / merge / re‑parent an Area | `Explicitly prohibited` ×5 — not supported at V1 | | | | | ABSENT for all; archive‑and‑recreate is the sanctioned path |
| Archive a Site or Area | `Allowed w/c` — cascade must complete first | `Explicitly prohibited` ×4 | | | | Soft archive; history stays accessible |
| Reassign a paused Job during cascade | `Allowed` | `Allowed w/c` own Area | `Explicitly prohibited` ×3 | | | Releases the held archival |
| Set the Site timezone | `Allowed w/c` — one per Site; per‑Area/per‑Shift override `Unavailable` | `Explicitly prohibited` ×4 | | | | AC‑SCOPE‑034 (L2612) |
| Set a Location's required certification | `Allowed` | `Explicitly prohibited` ×4 | | | | **A gate input** — protect as configuration, not free text (L27214) |
| View a map of locations | `Not applicable` ×5 — deferred beyond V1 | | | | | ABSENT |
| Create an equipment record | `Explicitly prohibited` ×5 | | | | | ABSENT; TEST‑DOH‑02‑D4 requires refusal on the location, parts **and** Job paths (L27246) |

**Denied rendering.** Supervisor/QM see the tree read‑only and scope‑filtered; every write control is ABSENT for them (categorical `Explicitly prohibited`, and they cannot hold it in any scope). The Tenant Admin's *blocked* re‑parent is the one DISABLED‑with‑reason case: the lock icon plus the named blocking Jobs, because the control exists for that role and is refused by object state, not by role.

**Objects.** `OBJ-DOH-SITE`, `OBJ-DOH-AREA`, `OBJ-DOH-CELL`, all `active | archived` (L27106). Plus an unnamed cascade record binding the per‑Job pause transactions, `cascade_pending_reassignment | cascade_complete` (L27107, L27227).

---

### MOD‑DOH‑03 — Shift Management

**Purpose (L27272):** "Define the tenant's working-time blocks as the anchor for metering, production dating and escalation resolution."

**Screens.** `SCR-DOH-05` **Shift management** (L48099; catalogue A `SCR-DOH-006`, L26056). Editor form fields fixed at SB‑DOH‑015 (L27377): name; parent Site **with its timezone shown as read‑only inherited text**; nominal start and end; bound Areas as a multi‑select; digest delivery time **pre‑filled 06:00**. Beneath the form, a panel stating that the Shift anchors usage metering, the production date for runs crossing midnight, and escalation resolution, **and that editing changes future behaviour only**. Also `SCR-TEN-SHIFT-01` (L118001) rendering the platform default and the bound beside the digest‑time field.

**States.** 01, 02, 03, **04** (the overlap refusal, AC‑51‑13 at L113055, and the no‑span‑Sites rule at L72144), 05, 06, 08, 12, 13. STATE‑09 does not apply — the digest is not a device command.

**Controls** (matrix L27291‑L27297, seven rows):

| Control | TA | Sup | QM | Aud | Wkr |
|---|---|---|---|---|---|
| Create a Shift | `Allowed w/c` — blocked in **every** suspension state | `Explicitly prohibited` ×4 | | | |
| Edit a Shift | `Allowed w/c` — **never retroactively re‑stamps completed runs**; audited at the same weight as a permission change, before‑and‑after values (L27375) | `Explicitly prohibited` ×4 | | | |
| Archive a Shift | `Allowed w/c` — refused while runs are scheduled; refusal raises NOTIF‑DOH‑03‑3 to the requester | `Explicitly prohibited` ×4 | | | |
| Bind a Shift to Areas | `Allowed` | `Explicitly prohibited` ×4 | | | |
| Set per‑Shift digest delivery time | `Allowed`, default 06:00 | `Explicitly prohibited` ×4 | | | |
| Override the inherited timezone | `Explicitly prohibited` ×5 — deferred beyond V1 | | | | |
| View Shifts | `Allowed` | `Allowed w/c` own scopes | `Allowed w/c` own scopes | `Read-only` | `Allowed w/c` — **own assigned shift only** |

The Worker row here is the only place in the whole MOD‑DOH‑03 matrix a Worker gets anything (L27297), and it collides with D11.

**Object.** `OBJ-DOH-SHIFT`, `active | archived` (L27281). Run is listed "affected by reference" only (L27280) — slice 4 exposes `shift_id` for denormalisation and implements no run state.

**Cardinality is not buildable yet.** DEC‑SHIFT‑001 is open and the source calls it "Blocking for Delivery Operations Hub module 3" (L112952, L116264). The mitigation is on the record at L116590: ship "the Shift entity with Site binding and timezone inheritance; **defer Area cardinality**." See D6.

---

### MOD‑DOH‑04 — Worker Lifecycle and Qualifications

**Purpose (L27451):** "Hold who may do what, enforce it at assignment and on the device, and provide the audited exception path when the line would otherwise stop."

**Screens.** `SCR-DOH-07` **Worker list** (L48101), `SCR-DOH-08` **Worker record and qualifications** (L48102). Catalogue A splits three ways: `SCR-DOH-007` register/detail, `SCR-DOH-008` qualification entry and recertification, `SCR-DOH-009` **Clearance register — "`Read-only` in the Hub; granting is a Client Command Center action"** (L26057‑L26059). That access note is the cleanest statement of the clearance seam in the source and it decides D23.

Worker‑record banner copy is fixed at SB‑DOH‑016 (L27592): a red banner above the record when any qualification is expired reading *"One certification has expired. New assignment to runs requiring it is blocked. The current run may be completed."*

**States.** 01, 02, 03, **04** (recertification expiry must postdate the previous, refused with the rule stated and **no partial record created**, L61522; the instruction‑difficulty field accepts only `simple|standard|expanded` and on an invalid value the record is held **incomplete and cannot receive assignments** — "no assignment is safer than an assignment whose instructions may render at the wrong level", L52798), 05, 06 (**soft suspension is a split state on this screen** — create is blocked, recertify stays open, L26919/L27043), 08, **09 Queued — this is the one slice‑4 screen where the fifteen device command states are load‑bearing**: a clearance renders in its true command state and **never as applied** until the device acknowledges (L27614, AC‑STU‑118 at L33769: "No surface shows a clearance as effective before its command reaches applied on the device"), 12, 13.

**Controls** — matrix verified verbatim at L27466‑L27484, **fifteen rows and all five columns present**. One reader claimed "the MOD‑DOH‑04 matrix contains no Tenant Admin row at all"; that is false, and the correction matters because it resolves a flagged blocker (D9).

| Control | TA | Sup | QM | Aud | Wkr |
|---|---|---|---|---|---|
| Create or edit a worker record | `Allowed` | `Allowed w/c` own scope; **blocked for new workers in soft suspension** | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |
| View a worker record | `Allowed` | `Allowed w/c` own scope | `Allowed w/c` own scope | `Read-only` | `Allowed w/c` — own record only |
| Enter a qualification | `Allowed` | `Allowed` — with full audit | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` — **self-attestation is not permitted** |
| Record a recertification | `Allowed` | `Allowed w/c` — new expiry postdates the old; **stays open in soft suspension** | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |
| Back‑date an issue date | `Allowed w/c` — both dates recorded | `Allowed w/c` same | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |
| Set instruction‑difficulty profile | `Allowed` | `Allowed` | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |
| Grant clearance — expired cert | **`Explicitly prohibited`** | `Allowed w/c` — mandatory categorised reason; QM notified | `Allowed` | `Explicitly prohibited` | `Explicitly prohibited` |
| Grant clearance — never‑held | **`Explicitly prohibited`** | `Explicitly prohibited` — requires QM authorisation | `Allowed w/c` — reason code plus authorisation | `Explicitly prohibited` | `Explicitly prohibited` |
| Grant second clearance, same Area same shift | `Explicitly prohibited` | `Explicitly prohibited` — routes to the QM | `Allowed w/c` | `Explicitly prohibited` | `Explicitly prohibited` |
| Set gate posture / clearance duration | `Allowed w/c` — in the tenant administration area, **never below the notify‑only floor** | `Explicitly prohibited` ×4 | | | |
| Archive a worker | `Allowed w/c` — two‑step flow | `Allowed w/c` — two‑step, own scope | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |
| Reactivate a departed worker | `Allowed w/c` — **re‑validation prompt mandatory** | `Allowed w/c` same | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |
| Bulk import workers | `Allowed` | `Allowed w/c` — canonical template only | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |
| View own certification alerts | `Allowed` | `Allowed` | `Allowed` | `Read-only` | `Allowed w/c` — own certifications only |
| Read the clearance corpus across time | `Read-only` | `Read-only` own scope | `Read-only` | `Read-only` | `Unavailable` |

**Two findings a reader missed and the spec must carry.** (a) **The Tenant Admin cannot grant a clearance of any kind** — `Explicitly prohibited` on all three clearance rows (L27472‑L27478). The tenant's most privileged role is deliberately outside the safety‑exception path. (b) The Quality Manager cannot *enter* a qualification but *can* grant every class of clearance — the entry authority and the exception authority are deliberately different people.

**Denied rendering.** Worker qualification entry is **ABSENT**, absolutely and by construction, not by permission check: "no worker-role path reaches qualification entry" (L27472) and TEST‑DOH‑04‑D1 requires the refusal to hold through every path including the mobile application and any API (L27621). The Supervisor's never‑held clearance control is the canonical **DISABLED‑with‑named‑reason** case (FB‑QUAL‑005, L64415) — it renders greyed carrying "requires Quality Manager authorisation", because that is where the rule teaches itself. The Tenant Admin's three clearance rows are also DISABLED‑with‑reason, not absent, because the controls exist on the screen for other roles.

**Fixed behaviours slice 4 owns.** The 14/7/1/0‑day expiry ladder — tenants may add earlier stages, **never remove or delay one** (L27423, AC‑28.4‑02 at L52774, AC‑NFR‑1105 at L106864). Per‑Area qualification scope that may span Areas across **multiple Sites** (L27421). Certification date and entry date both recorded so a late entry creates no apparent gap (L27435). Two‑step departure — reassign, then archive; open step executions close as abandoned with the reason "Worker departed" (L27443). Bulk import all‑or‑nothing per file, single canonical CSV template (L26707, L27438). Clearance lapse returns the qualification to **Expired, never to Valid** (L27533).

**Objects.** `OBJ-DOH-WORKER` (`active, archived, reactivated`), `OBJ-DOH-QUAL` (`valid, warning_14, warning_7, warning_1, expired, renewed`), `OBJ-DOH-CLEAR` (`granted, active, lapsed, superseded_by_renewal`) — all from the card at L27460. Rival vocabularies exist for each; see D21.

---

### MOD‑DOH‑09 — Permissions, Roles and Access

**Purpose (L28505):** "Configure who exists in the tenant, what each may do, and where; enforce it across all five surfaces from one place."

**Screens.** `SCR-DOH-01` **Sign‑in** (L48095, "MOD‑DOH‑09 FEAT‑DOH‑0903", all five roles, application entry). `SCR-DOH-18` **Users, roles and scopes** (L48112; catalogue A `SCR-DOH-019`, L26069). Plus a documented role‑explanation family that catalogue B does not list but the source specifies in detail: `SCR-DOH-ROLE-01` landing with **By person** and **By capability** tabs, `-02`, `-03`, `-04` **Why was I refused**, `-05` role definition card, `-06` feature change impact, `-07` user detail roles panel (L14264‑L14719). Build `-01`/`-04`/`-05`; the rest are administrative luxuries.

**States.** All twelve applicable, and this is the screen where STATE‑05 is not an edge case but the product: `SCR-DOH-ROLE-04` renders **which of the nine intersecting access conditions failed, in evaluation order, safety first** (L14531), not definition order (L14514).

**Controls** (matrix verified L28520‑L28533, twelve rows). Tenant Admin holds everything writable; the other four roles are `Explicitly prohibited` on every write row. Highlights: create/edit user account is `Allowed with conditions` — **blocked in every suspension state as a configuration edit** (L28522). Assign/remove role is `Allowed with conditions` — mandatory‑role rules enforced (L28523). Issue or reset a managed PIN is the **only** row where a non‑admin writes: Supervisor `Allowed with conditions` — own scope, for workers (L28531). View the user and role register: TA `Allowed`, Sup/QM `Read-only` own scope, Auditor `Read-only`, Worker **`Unavailable`**.

Five rows are `Explicitly prohibited` for **all five roles** and must render ABSENT, never disabled: remove the last Tenant Admin; remove the last approver‑capable role while a Job exists; create a custom role; delegate a role temporarily; scope a permission to a Location, Job or worker; act as another role in the audit trail (L28525‑L28533). AC‑16‑39 (L20658) makes the first testable: refused, rule named, "no override exists on any surface — **including within support sessions**". AC‑16‑12 (L20225) makes the last testable: "No surface renders a role selector, an 'acting as' control, an 'acting as' banner, or any session-level role context."

**That last gate has a direct consequence for this prototype.** The role selector in the storyboard is a **view switcher across seeded fixtures**, not a session role context, and the UI must not present it as one. Any label reading "acting as" would violate AC‑16‑12 as read by a reviewer.

**Standing panel required on `SCR-DOH-18`** (L23918): an approver‑capable holders counter and a "Tenant Admins: N" counter, neither of which ever renders zero without a warning, turning red with the sentence "A tenant must hold an approver role whenever a Job exists." Custom roles carry a static footnote, not a disabled button.

**Objects.** `OBJ-DOH-USER` — user account, role set, scope set — the module card's only named object (L28511), states `active, suspended_by_tenant_state, archived` (L28512), plus role assignment `assigned | removed`. Four rival account lifecycles exist (L8350, L18939, L67543); see D21.

---

### MOD‑DOH‑12 — Integration Surface, narrowed to FEAT‑DOH‑1201

**In scope: single sign‑on only.** Card verified at L29023‑L29045. Objects affected: "Configuration records for `INT-DOH-SSO` and the tenant contact email; **no operational object**" (L29031). States: `configured, not_configured, reserved_inert` (L29032).

**Screen.** `SCR-DOH-21` **Integration settings** (L48115; catalogue A `SCR-DOH-022`, L26072), built with only the SSO section live. Slice 4 also owns the sign‑in address screen that consumes it (L95827‑L95832): work‑email field, Continue, and a secondary "Sign in with a platform credential" path.

**Controls** (matrix L29040‑L29045): Configure single sign‑on metadata — TA `Allowed`, all others `Explicitly prohibited`. Provide the tenant contact email — same. Manage email‑vendor credentials — `Not applicable — the tenant manages no credentials; the vendor is platform-contracted` for all five. Supply an AI API key — `Not applicable — compute is bundled; no tenant key is required` for all five. Both `Not applicable` rows render **ABSENT with the reason in help text**; this is a security feature the card states plainly: "The tenant manages no email credentials, which removes a credential-handling risk entirely" (L29035).

**Two gates that shape the sign‑in screen.** "Authentication is not authorization. Role assignment stays inside the platform; an assertion carrying a group or role claim is **untrusted input, logged and ignored**" (L95776, AC‑RBAC‑203 at L20993). And: "the platform maps the asserted subject to exactly one existing platform user record within exactly one tenant; where no such record exists, sign-in is refused, because **there is no just-in-time provisioning at the first version**" (L95794) — carried as open decision DEC‑SSO‑001 (L95907).

**Note for the prototype boundary:** there is no authentication here. `SCR-DOH-01` renders the two‑track *shape* against fixtures. Do not describe the SSO section as connecting to anything.

---

### MOD‑DOH‑13 — Tenant View of Platform Administration

**Purpose (L29178):** "Make every platform-side access to a tenant's workspace visible to that tenant, and give the tenant a control it can actually exercise." Card at L29178‑L29252 contains exactly three features (L29240‑L29250): Platform Access History, support‑session transparency, announcements. **Objects affected: "A filtered projection of `OBJ-DOH-AUDIT`; no new operational object"** (L29187). This module owns no business object and should be modelled as a read/mirror plus one command.

**Screens.** `SCR-DOH-22` **Platform Access History and announcements** (L48116; catalogue A `SCR-DOH-023`, L26073). Table columns fixed at SB‑DOH‑025 (L29274): timestamp, access class, platform identity, reason, ticket reference, scope; filterable by class and date; export control; under the line *"This is a filtered view of your own audit log. Every platform-side access appears here."* Plus `SCR-DOH-PAH-02` post‑session report (L14853).

**States.** 01 (no platform access has ever occurred — a real and common state), 02, 03, 05, 06, 08, 12, 13. STATE‑09 does not apply.

**Controls** (matrix verified L29195‑L29205, nine rows):

| Control | TA | Sup | QM | Aud | Wkr |
|---|---|---|---|---|---|
| View Platform Access History | `Read-only` | `Unavailable` | `Unavailable` | `Read-only` | `Unavailable` |
| See the support‑session banner | `Allowed` | `Allowed` | `Allowed` | `Allowed` | `Not applicable — the banner is a Delivery Operations Hub web element` |
| **End a support session from the banner** | `Allowed` | `Allowed w/c` — **any signed-in web user seeing the banner may end it, because the control belongs to the tenant** | same | same | `Not applicable — no Hub web session` |
| See a platform announcement | `Allowed` | `Allowed` | `Allowed` | `Allowed` | `Not applicable` |
| Post or edit a platform announcement | `Explicitly prohibited` — the client's platform team only | ×4 | | | |
| Configure tiers or feature gates | `Explicitly prohibited` — Super Admin console only | ×4 | | | |
| Manage pilots or tenant groups | `Explicitly prohibited` — Super Admin console only | ×4 | | | |
| Initiate/approve compliance‑emergency access | `Explicitly prohibited` — dual‑authorised by two senior platform staff | ×4 | | | |
| Receive the compliance post‑session report | `Allowed` — full report of what was accessed | `Unavailable` | `Unavailable` | `Read-only` | `Unavailable` |

This settles the "four mutually inconsistent End‑session role lists" the readers flagged: **the module matrix grants it to all four web roles**, and L29199 states the widening is deliberate. The narrower rows (L1476, L22780) are drafting drift. The one row granting the platform‑side Support role the tenant's control (L21449) contradicts the premise and must be excluded.

**Banner behaviour is a hard gate, not decoration.** "No banner means no session: the session does not open, or terminates, if the banner cannot be shown" (L64726); "No read of tenant operational content occurs before the tenant banner is confirmed displayed and the session-open event is committed to the tenant's audit stream" (AC‑4870, L107883). Three controls **do not exist** on the banner and must be ABSENT: grant the engineer write access, hide the banner, extend the time box (L64699). The announcement banner **cannot be muted by any tenant user** (AC‑SA‑14‑02, L45684).

**Scope gate (AC‑DOH‑13‑7, L29172):** "The Hub shows the tenant its own position, read-only — nothing more." Six things are unreachable from the Hub and every one of them must be absent from the module rail: tier configuration, feature gates, pilot management, tenant‑group management, impersonation control, usage administration.

---

### MOD‑DOH‑14 — Qualification Calendar

**Purpose (L29326):** "Give the Quality Manager a single 60-day, tenant-wide view of certification expiry for planning." A read‑only projection of `OBJ-DOH-QUAL` and `OBJ-DOH-WORKER`; **objects affected: none**. Its purpose is deliberately distinct from the alert ladder's: "it exists so recertification is planned against the schedule rather than discovered at the 14-day alert" (L29320).

**Screen.** `SCR-DOH-09` **Qualification Calendar** (L48103, "MOD‑DOH‑14 all features"; catalogue A `SCR-DOH-010`, L26060). Storyboard SB‑DOH‑026 (L29412) — a nine‑week grid across the top.

**States.** 01 (**and this one is specified**: a certification with no expiry date does not appear at all, "and its absence is explained on screen rather than left as a silent omission", L29361), 02, 03, 05, 06, 08, 12, 13. No 04 — nothing is written here.

**Controls** (matrix verified L29343‑L29350, six rows):

| Control | TA | Sup | QM | Aud | Wkr |
|---|---|---|---|---|---|
| Open the Calendar | `Read-only` | `Read-only` — filtered to own Area scope | `Allowed` — tenant‑wide | `Read-only` | `Unavailable` |
| Filter by week / Area / cert type / worker | `Allowed w/c` within scope | `Allowed w/c` within Area scope | `Allowed` | `Allowed w/c` read‑only filters | `Unavailable` |
| Link through to a worker record | `Allowed` | `Allowed w/c` own scope | `Allowed` | `Read-only` | `Unavailable` |
| Record a recertification from the Calendar | `Allowed w/c` — through the linked worker record | `Allowed w/c` — same, own scope | `Explicitly prohibited` — qualification entry is a Supervisor and Tenant Admin act | `Explicitly prohibited` | `Explicitly prohibited` |
| Change the 60‑day horizon | `Explicitly prohibited` — fixed at 60 days | ×4 | | | |
| Export the Calendar | `Not applicable — the Statement of Work does not specify a Calendar export; the underlying data is reachable through the audit and report paths` ×5 | | | | |

This matrix resolves the seven conflicting `roles_allowed` lists the readers found (D24). Note the pleasing inversion: the **Quality Manager owns the Calendar and cannot act on it**; the Tenant Admin and Supervisor can act, through the linked record, and see less.

Boundary test on record: TEST‑DOH‑14‑N1 seeds 5, 30, 59, 60 and 61 days out — the first four appear, the fifth does not (L29433). **60 days inclusive.** The horizon is fixed everywhere it is restated (twenty‑odd lines; L2463, L8428, L47267, L114425 among them).

---

### Device screen group — unnumbered, gated behind a decision

**This is not a module.** No MOD‑DOH module is named for devices; the §4.1.3 inventory at L2436 enumerates all nineteen and contains none. The string `SCR-DOH-DEVICES` occurs **exactly once in the frozen source**, at L67861, which I read directly: *"Delivery Operations Hub, screen `SCR-DOH-DEVICES` Device enrollment: panel fields are device identifier, platform, device mode of Shared or Personal set at enrollment, location binding, application version against the floor, enrollment date, last seen, sync health, storage-pressure indicator and retire control."* It is absent from both screen catalogues and from `identifier-index.json`. A second uncatalogued appearance, `SB-SEC-005-S1` "Delivery Operations Hub device inventory" (L103830), carries **"Mark device lost / Request wipe"** — Tenant Admin, described as "Tenant-side state plus a wipe request routed to the platform team; **wipes nothing itself**."

**Build scope.** Enrol (WF‑DVC‑001, L53085), reassign to another Area or worker group (WF‑DVC‑002, L53118), retire (the retire control at L67861), mark‑lost‑plus‑request‑wipe (L103830). **Do not build suspend or wipe** — WF‑DVC‑005 and WF‑DVC‑006 are MOD‑SA‑13 only (L53224, L53257) and wipe is a critical‑class root‑approved action (L45508, L107423).

**States.** 01, 02, 03, 04, 05, 06, 08, **09 Queued — mandatory here**: a retire or a wipe request renders in its true command state and never as done (L48015 STATE‑09), 12, 13.

**Roles.** Every device control is Tenant Admin only in the source rows I have (L53089 "Tenant Admin opens device enrollment"; L103830). No five‑role matrix exists for devices anywhere. The other four roles: ABSENT. **The "Request wipe" control gets the CLASS BADGE** — it is the one critical‑class action a slice‑4 role can see and cannot approve, and the badge is what stops the Tenant Admin believing the press wiped anything.

**Two open decisions block hardening.** DEC‑DEVOWN‑001 (L8459, L8472, L8491, L10324) — Client Decision Required, `adopted_working_position: null`, on whether a Tenant Admin may enrol at all. DEC‑DEVLOST‑001, impact recorded as "Blocks WF‑DVC‑001 to WF‑DVC‑006" (L56662), with no lost/stolen classification anywhere (L53160). See D3, D4, D27.

---

## 2. THE SHARED SPINE

Ten things every slice‑4 screen sits on. Build these once, before any module screen.

**S1 — `evaluateAccess`, the only access‑control entry point.** Already carries `allowedRoles, deniedRoles, requiredSites, requiredAreas, requiredShifts, requiredObjectScope, requiredTemporaryGrant, requiredEntitlement, resourceTenant`. The source's own model is the **nine intersecting access conditions**, and they have two orders. Definition order (L14514): role permission, assigned scope, tenant entitlement, object state, qualification, active grant, device and connectivity state, segregation of duties, safety controls. **Evaluation order, safety first (L14531): safety controls, role permission, assigned scope, tenant entitlement, object state, qualification, active grant, device and connectivity state, segregation of duties.** `SCR-DOH-ROLE-04` must render the evaluation order. Deny‑by‑default is a gate: "an unresolved or unreachable permission condition produces a refusal, never a grant. An absolute rule that cannot be evaluated is treated as violated" (L14476); AC‑DOH‑09‑9 (L28623). *Touched by: every module. Owned by MOD‑DOH‑09.*

**S2 — Tenant state gate.** `OBJ-DOH-TENSTATE` read on every request and applied **before any write control renders** (L27002). The write‑class table is stated "exactly" and must be encoded as data, not as scattered `if` statements: soft blocks new Jobs, Workers, locations, shifts, parts and **all configuration edits**, while **recertification of existing workers stays open** (L26919); hard is read‑only except the enumerated completion pipeline (L26920); compliance blocks all logins immediately (L26921). Where state cannot be determined, "the stricter interpretation applies" (L26547). *Touched by: 02, 03, 04, 09, 12, 19 — every write path in the slice. Owned by MOD‑DOH‑01.*

**S3 — Hub chrome: a three‑slot banner region and nothing more.** The banner classes are a closed set of three at V1 (L26047, L25591): suspension banner, support‑session banner with End‑session, platform‑announcement banner. Plus the module rail — `SCR-DOH-02` Operations home, "The module rail across MOD-DOH-01 to MOD-DOH-19" (L48096), which is shared, not owned. *Touched by: every screen. Owned by: 01 (suspension), 13 (support + announcement), no module (rail).*

**S4 — The thirteen screen states with the Hub departures.** L48007‑L48014, plus the slice‑4 rulings above: 10 and 11 never apply; 07 resolves per D7; 09 applies only where a device command exists (MOD‑DOH‑04 clearances, device retire/wipe request). AC‑DOC‑006 (L856) and AC‑RBAC‑001 (L20781): every matrix cell carries exactly one status token; a blank, ellipsis, dash or "same as above" is a build‑blocking defect. *Touched by: every screen.*

**S5 — Scope resolution: Tenant, Site, Area, and only those.** Three orthogonal dimensions held simultaneously, additive, and a scope narrows a role and never widens it (L17470). Location (Cell), Job and worker scoping are **deferred beyond V1 and no rule may depend on them** (L14515, L16370) — they render ABSENT, not disabled (L23918). AC‑16‑02 (L20046): "scopes do not merge across grants." *Touched by: 02 (supplies values), 03, 04, 09, 14.*

**S6 — Audit in the same transaction, or the action did not happen.** "An action that cannot be audited does not happen. A partial write is never visible. A write is never queued client-side" (L26547, FB‑DOH‑WRITE‑002). Restated per module at L27588 and L26904. STATE‑12 has a specific obligation here: "Where the failure is an audit-write failure, the screen states that the action did not happen" (L48018). *Touched by: every write in the slice.*

**S7 — The tenant‑configuration floor rule.** A tenant may configure itself **stricter than a default and never looser**, and the registry rejects a looser value **at the write, with the bound stated**, rather than accepting and logging it (L20841, DNC‑22 at L98506). Concretely in slice 4: gate posture may never go below notify‑only (L27425); the 14/7/1/0 warning schedule may gain earlier stages, never later ones (AC‑NFR‑1105, L106864, and the rejection is at the point of entry, L109345). *Touched by: the tenant administration area sections owned by 02 (hierarchy depth), 03 (digest defaults), 04 (gate posture, clearance duration).*

**S8 — The Hub access resolution stages.** `Unauthenticated → SsoTrack | ManagedTrack → ScopeResolved → TenantStateApplied → HubRendered` (L25667). This is literally the prototype's boot order and the reason S1, S5 and S2 must exist before any module screen renders. *Touched by: 09, 12, 01.*

**S9 — The fifteen device command states.** Already shared. Required wherever an accepted action has not yet taken effect: it renders in its true command state and **never as done** (L48015). In slice 4 that is exactly two places — the clearance record on `SCR-DOH-08` (AC‑STU‑118, L33769) and the device retire / wipe request. *Touched by: 04, device group.*

**S10 — Support‑not‑surveillance, and on this surface the hazard is direct.** The Worker record lives here. Four prohibitions bind every screen: no worker‑facing pace figure, timer against expectation or comparison to others "in any module, any state, any release of this scope" (L2002, AC‑GOAL‑030 at L2044); oversight is exception‑led, never a per‑worker wall (L2004); the app is scoped to the logged‑in identity's own work (L2006); worker‑level data is held as **purpose‑bound aggregates**, not raw behavioural feeds (L2008). Two register entries bite directly on slice 4. **M‑A4 qualification state**: individual‑level measurement is *legitimately allowed* here — "qualification is a property of a person and a safety control" — but the prohibited use is named, "using expiry frequency as a performance measure", and AC‑SCHED‑253 (L101561) makes it testable. **M‑A5 clearance frequency**: individual‑level is *Explicitly prohibited*; the data is cut **by role and by Area, never by worker** (AC‑SCHED‑254, L101565), because "frequent clearances usually indicate a certification-planning failure, not a worker failure" (L101536). The second‑clearance escalation keys on **(Area, Shift), never on (Worker)** — "repeated exceptions in one Area are a signal about the Area" (L27434). The regression test is a data‑model assertion: **no persisted table has a worker identifier as a grouping key for a behavioural measure** (L101581). *Touched by: 04 and 14 directly; every read model in the slice.*

---

## 3. DEPENDENCY ORDER

There is a genuine cycle in the source's own dependency rows — MOD‑DOH‑09 needs MOD‑DOH‑02 for scope values (L28513), MOD‑DOH‑02 needs MOD‑DOH‑01 for tenant state (L27107), and MOD‑DOH‑01's card names the Worker‑Shift meter inputs from MOD‑DOH‑07 (slice 6). It breaks cleanly if MOD‑DOH‑09 ships twice.

1. **Spine S1, S4, S5, S8** — nothing renders before `evaluateAccess`, the state contract and the resolution stages exist. No module edge; this is the floor.
2. **MOD‑DOH‑01, state machine only (no meter).** Because "Gates the write classes of every other module" (L26866 card, Interconnections) and tenant state is applied before any write control renders (L27002). Stub the Worker‑Shift meter — its inputs are MOD‑DOH‑07 assignment events, slice 6.
3. **MOD‑DOH‑09 pass one, Tenant scope only.** Because S8 puts `SsoTrack|ManagedTrack → ScopeResolved` ahead of `TenantStateApplied → HubRendered`, and because there is no other module in the surface that creates tenant user accounts (`OBJ-DOH-USER`, L28511). Tenant scope needs no location tree, so this pass has no edge to MOD‑DOH‑02.
4. **MOD‑DOH‑12, FEAT‑DOH‑1201 only.** Edge: MOD‑DOH‑09's own Dependencies row names "MOD‑DOH‑12 for single sign-on" (L28513) and `SCR-DOH-01` Sign‑in is served by FEAT‑DOH‑0903 (L48095). The connection record must exist for the two‑track sign‑in to have two tracks.
5. **MOD‑DOH‑02.** Edges: needs tenant state from step 2 (L27107); AC‑51‑12 (L113054) requires a default Site to exist *before any Tenant Admin signs in*, so its fixture must be seeded even earlier than its screen.
6. **MOD‑DOH‑09 pass two — enable Site and Area scope.** Edge: "MOD‑DOH‑02 for scope values" (L28513). This is the second half of the split and the reason the cycle is not real.
7. **MOD‑DOH‑03.** Edges: MOD‑DOH‑02 for the Site and its timezone (L27282) — a Shift cannot inherit a timezone from a Site that does not exist; MOD‑DOH‑01 for the suspension write class. Ships with cardinality deferred (D6).
8. **MOD‑DOH‑04.** Edges: MOD‑DOH‑02 for Area scope (per‑Area qualification scope, L27421) and MOD‑DOH‑03 for on‑shift roster resolution (L27456) — the escalation at L27429 resolves against role‑holders currently on shift, which is meaningless without Shifts. Also MOD‑DOH‑09 for the worker's user account, since the worker record carries an identity link as a field (L8367).
9. **MOD‑DOH‑14.** Edge: "feeds MOD‑DOH‑14 Qualification Calendar" (L27459). Its Dependencies row names only MOD‑DOH‑04 and MOD‑DOH‑02 (L29326) — no edge outside the slice at all. Cheapest module here; a pure projection over data step 8 already owns.
10. **MOD‑DOH‑13.** Edge: the chrome (S3) only. Its objects are all SURF‑SA‑owned and seeded as fixtures. Buildable in parallel with 5–9 by anyone not on the critical path. **Declare its cross‑slice dependency**: AC‑SA‑18‑06 (L46193) requires Platform Access History to read *the same audit records* rather than a separate view, and the audit store is MOD‑DOH‑11, slice 10 (D14).
11. **Device screen group, last.** Two open decisions gate it (D3, D27) and no other module depends on it. Building it early risks throwing it away.

---

## 4. CONFLICTS AND SILENCES — NUMBERED DECISIONS

Every one of these becomes a numbered decision in the spec. None becomes a silent assumption in code.

**D1 — Which screen catalogue is canonical.** Two exist: `SCR-DOH-001…026` (L26051‑L26076) and `SCR-DOH-01…23` (L48095‑L48117). Same identifier, different screen: `SCR-DOH-023` is Platform Access History while `SCR-DOH-23` is the Tenant administration area; `SCR-DOH-009` is the Clearance register while `SCR-DOH-09` is the Qualification Calendar. A route table keyed on either literal binds the wrong screen. *Options:* (a) three‑digit; (b) two‑digit; (c) neither, mint fresh. **Recommend (b), catalogue B at L48095‑L48117** — it is the only one carrying roles‑that‑can‑open, module‑and‑feature, and navigation entry point, three fields the prototype needs and catalogue A lacks. Carry catalogue A's access‑status column as a cross‑check; never write a bare three‑digit form anywhere.

**D2 — Who owns the tenant administration area.** Three answers: WF‑TEN‑003 says "Module MOD‑DOH‑13, tenant administration area (Part IX)" (L52469); catalogue B says `SCR-DOH-23` is served by "Part IX settings register, MOD‑DOH‑17" (L48117); catalogue A says `SCR-DOH-026` is "MOD‑DOH‑01 and cross-module" (L26076). *Options:* pick one module; or treat it as ownerless. **Recommend ownerless.** It is confirmed to be a screen *group*, not a surface (L1598, AC‑PROD‑040 at L1614), and catalogue A's own answer is "and cross-module". Register it as `SCR-DOH-23`, and let each module own its own section — MOD‑DOH‑02 the hierarchy depth, MOD‑DOH‑03 the digest defaults, MOD‑DOH‑04 the gate posture and clearance duration (L27098, L27451). No module card is amended, no fictional ownership is minted.

**D3 — May a Tenant Admin enrol a device.** DEC‑DEVOWN‑001, Client Decision Required, `adopted_working_position: null` (L8459, L8472, L8491, L10324). For: §8.13.4 "Tenant self-service enrolment within platform policy" (L4715, restated L18252, L45472, L53039); AC‑WF‑DVC‑001‑01 "Enrollment is tenant-self-service and never a console write into tenant data" (L53099); MOD‑SA‑13's own role matrix prohibits all four platform roles from enrolling (L45543). Against: §7.5.2; the day‑zero storyboard disables it with "Device enrolment is performed by the platform team from the Super Admin platform console" (L61357). **Recommend build it, behind one feature flag, defaulting to enabled**, because three acceptance criteria and a platform role matrix say yes against two storyboard strings, and because the storyboard at L67861 specifies the enrolment panel field‑by‑field — the source describes the screen in more detail than it describes the objection. Flag name goes in the spec; the flag is not a silent default.

**D4 — What identifier the device screen carries.** `SCR-DOH-DEVICES` occurs exactly once (L67861) and appears in neither catalogue nor the identifier index. *Options:* mint `SCR-DOH-24`; reuse the literal; leave it unnamed. **Recommend the literal `SCR-DOH-DEVICES`, marked uncatalogued.** Minting a number invents a catalogue row the source does not have, and catalogue B already ends at 23 with a different screen.

**D5 — MOD‑DOH‑13's remit.** Its card (L29178‑L29252) has three features and zero device content; the workflow catalogue assigns it WF‑TEN‑003 and WF‑DVC‑001/002/003 (L52469, L53085, L53118, L53150). The module boundary differs by roughly a factor of three depending on which wins. **Recommend the card wins.** The card is internally consistent with its own scope gate — "The Hub shows the tenant its own position, read-only — nothing more" (L29172) — and a read‑only module cannot own device enrolment. Treat the tenant administration area (D2) and the device group (D4) as separate screen groups with no module owner, and record the workflow catalogue rows as attributed‑but‑disputed.

**D6 — Shift‑to‑Area cardinality.** DEC‑SHIFT‑001, open, and the source calls it "Blocking for Delivery Operations Hub module 3" (L112952, L116264). Options on the record: (a) many‑to‑many, no overlap permitted on the same Area; (b) Shift to many Areas, Area to exactly one Shift; (c) Shift to exactly one Area. **Recommend (a), and ship the mitigation the source already wrote** (L116590): the Shift entity with Site binding and timezone inheritance, Area cardinality deferred. Reason: AC‑51‑13 (L113055) *already asserts* option (a)'s overlap refusal as an acceptance criterion with a verifying test, and §19.5 silently adopts many‑Areas throughout ("Bind a Shift to one or more Areas", L27349). Two of the three sources already behave as if (a) is decided. Note the hazard: an implementer reading only §19.5 would never learn the cardinality is contested, because DEC‑SHIFT‑001 appears nowhere in the module chapter.

**D7 — What the Hub does when the connection drops.** Three answers: connection‑lost banner then STATE‑08 or STATE‑13 (L48014); "Loss of connection renders the failure banner of `STATE-12`" (L48196); degrade to last‑loaded figures with a freshness marker, write controls disabled not queued (L27004, L27568). **Recommend a split rule, which is the only reading that satisfies all three:** content already loaded → **STATE‑08** with the freshness marker and the as‑of time; a read that fails outright → **STATE‑12** naming what failed and whether anything was written; every write control → **DISABLED with a named reason, never queued**; reconnection → **STATE‑13**, and the Hub refetches tenant state *before* re‑enabling any write control (L27006). The reason for the never‑queue half is stated in the source and is the best sentence in the chapter: "a queued clearance would be a safety control with no audit entry" (L27568).

**D8 — Permission status vocabulary: nine tokens or six.** Nine at L10238 (adds `Cached read-only while offline`, `Queued while offline`, `Client Decision Required`); six at L1200. **Recommend nine.** The six‑token set cannot express `Client Decision Required`, and AC‑RBAC‑602 (L23110) requires that token to exist at runtime: "Every Client Decision Required cell denies at runtime and names its decision identifier in the denial." That is a live requirement in slice 4 — `MTX-TEN-02a`'s Worker column for MOD‑DOH‑04 reads `Client Decision Required` (see D11). Under D7's ruling, `Queued while offline` is unreachable on this surface and `Cached read-only while offline` collapses into STATE‑08; keep the tokens, expect them unused here.

**D9 — May a Tenant Admin enter a qualification.** **Resolved by direct reading, and one reader got this wrong.** The MOD‑DOH‑04 matrix at L27466‑L27484 has all five columns and gives Tenant Admin `Allowed` on "Enter a qualification" and "Record a recertification". The claim that "the matrix contains no Tenant Admin row at all" is false. L10345, L23624, L52756 and L29345 agree. Only L33638 dissents. **Recommend the module matrix; record L33638 as an erratum in the spec.**

**D10 — May a Tenant Admin grant a clearance.** The matrix says no — `Explicitly prohibited` on all three clearance rows (L27472‑L27478) — while broad statements elsewhere imply the Tenant Admin can do anything a Supervisor can. **Recommend the matrix, and render the three controls DISABLED with their reason**, not absent, because they exist on the same screen for the Supervisor and Quality Manager and FB‑QUAL‑005 (L64415) says the disabled control teaches the rule at the moment it binds. This is deliberate design, not drift: the most privileged tenant role is placed outside the safety‑exception path.

**D11 — Does a Worker get a Hub screen at all.** DEC‑WKRVIEW‑001, open (L23067). The MOD‑DOH‑04 matrix grants Worker "own record only" and "own certifications only" (L27472), and MOD‑DOH‑03 grants "own assigned shift only" (L27297); against that, §1.2 excludes Workers from Hub primary users, and §5.18 and Part VII confine workers to SURF‑FL. The source states the consequence plainly: it "determines whether hourly floor workers need web accounts and browser access at all, which changes the login model's surface area, the training burden, and the **attack surface**" (L23067). *Options:* (a) build the Worker Hub view; (b) render Worker as `Unavailable` throughout and rely on SURF‑FL. **Recommend (b).** The worker already meets their own certification alerts on the device (L19523, SCR‑FL‑DENY‑01), the recommendation on file is Frontline‑only, and building a screen that must not exist is more expensive than not building it. The prototype's role switcher shows Worker → "not a Hub user"; the cost is that a worker without a device in hand cannot check their own expiry, which the spec must state.

**D12 — Who may press End‑session.** **Resolved by direct reading (L29195‑L29205):** Tenant Admin `Allowed`; Supervisor, Quality Manager and Read‑only Auditor `Allowed with conditions` — "any signed-in web user seeing the banner may end it, because the control belongs to the tenant"; Worker `Not applicable — no Hub web session`. L29199 confirms the widening is deliberate. **Recommend the widest set.** Exclude L21449, which grants the platform‑side Support role the tenant's own control and contradicts the whole premise.

**D13 — Does End‑session exist on the compliance‑emergency banner.** L51712 says the control ends "an in-session support **or compliance-emergency** access session"; L64810 says flatly that it does not exist for that class, "because an emergency access the tenant could terminate would not be an emergency access". DEC‑EMEREND‑001 (L14878) records that §8.15.1 attaches banner and control explicitly to the *normal support session* and says nothing about the other two classes. **Recommend banner on all three classes, End‑session on support only**, with the compliance‑emergency class carrying the automatic post‑session report instead (L19780, L64828 — "the control to suppress the tenant report does not exist"). This satisfies the mirroring gate (AC‑DOH‑13‑1, L29284) without granting a termination the emergency path cannot survive.

**D14 — Where Platform Access History reads from.** The screen is MOD‑DOH‑13's (L14852, L26073, L48116); the control rows are tagged MOD‑DOH‑11, slice 10 (L58075, L97134). AC‑SA‑18‑06 (L46193) and L110975 require it to read *the same audit records* rather than a separate view — "one audit truth per tenant". **Recommend build it as a read‑through view over a seeded audit fixture and declare the slice‑10 dependency explicitly.** Do not build a second store to make slice 4 self‑contained; that is precisely the defect the gate forbids, and it would be invisible until slice 10 tried to reconcile.

**D15 — Is a tier upgrade available under soft suspension.** **Silence, and a material one.** Soft blocks "all configuration edits including tenant settings" (L26919); the tier upgrade is a self‑service Tenant Admin write; neither the blocked nor the open enumeration names tier change, and the soft banner's disabled list (L65039) does not include it. *Options:* (a) block; (b) allow, on the grounds that an upgrade is a commercial act, not master data, and soft suspension exists to stop the account *growing* while letting it *operate* (L64897). **Recommend (a) block**, banner naming the reason and routing to platform support. Soft suspension's default trigger is 30 days of non‑payment (L26919); letting a non‑paying tenant self‑service a higher commercial ceiling is the riskier default, and L26547 instructs the stricter interpretation where tenant state governance is ambiguous. Record the counter‑argument — this is a coin‑flip the client should settle.

**D16 — Does recertification stay open under hard suspension.** Soft explicitly keeps it open, with the reason stated (L26919). The hard enumeration (L26920) names only step execution, capture, sync, substitution‑to‑complete, summaries, notifications and audit — recertification and clearances are absent. **Recommend block**, because the hard list is stated "exactly" and the stated remedy for a qualification problem mid‑hard‑suspension is substitution. **Flag to the client**: a certification expiring during a 60‑day hard suspension has no renewal path at all, only substitution, which can strand a line. This is the single most operationally dangerous silence in the slice.

**D17 — The compliance‑suspension worker message.** Two wordings, both called verbatim‑fixed: *"Operation suspended. Contact your supervisor. Your work has been saved."* (§4.2.3/§7.11, L19690, L50064, L110776) versus *"Operation suspended — your work has been saved."* (§8.9.2, L44923, L71171, L114674). AC‑CMD‑007 (L12692) forbids rewording, so the string cannot be paraphrased into agreement. Decision identifiers conflict too: DEC‑MSG‑001 (L5263, L44923) versus DEC‑SUSPMSG‑001 (L114674), with L100694 noting "proposed identifier not yet assigned". **Recommend the Part IV three‑sentence form** — the short form drops the only actionable instruction, and a locked‑out worker with no instruction is the failure this message exists to prevent. Record the chosen decision id.

**D18 — The support banner string.** "viewing your **tenant**" (§4.12.2, L29168 and SB‑DOH‑025 at L29274) versus "viewing your **workspace**" (§8.15.1, L14851, and the hard gate at L23801). **Recommend "workspace"** — it is the form carried by the hard gate and by the tenant‑facing vocabulary elsewhere. Same no‑reword constraint applies.

**D19 — How many tenant states.** Five on the MOD‑DOH‑01 card (L26875); six on the OBJ‑TENANT card, adding `pilot` (L7643, L4645); and two more nobody enumerated — `draft` and `awaiting administrator` from SEQ‑004 (L61336, L61340), where L75096 makes a hard gate of the draft state. **Recommend: five operating states in the Hub enum; `pilot` as an orthogonal flag** — §4.2.5 says a pilot tenant is "functionally identical to a paying tenant" (L26971), which is a flag, not a state; **`draft` and `awaiting_administrator` owned by SURF‑SA and never rendered in the Hub**, because in draft "no user can authenticate" (L75096) so no Hub screen can exist to render it.

**D20 — Two feature numbering schemes.** `FEAT-DOH-01-1/-2/-3` (L26979‑L26995) and `FEAT-DOH-0101/0102/0103` (L47222‑L47224) both claim MOD‑DOH‑01; the same doubling hits 04 (three features versus five, L27537 versus L47231), 13 and 14. The blueprint never states they are the same features. **Recommend the four‑digit catalogue (L47222‑L47268) as the traceability key** — it is the only scheme covering all nineteen modules in one table, which is what a traceability matrix needs. Map the chapter scheme to it once, in one table, and never mix them in a ticket title.

**D21 — Object state vocabularies.** Every object in the slice has three to ten rival sets. Worker: `active/archived/reactivated` (L27460) versus `created/updated/archived` (L22389) versus `none/active` (L61474) versus a five‑state credentialing chain (L59956). Qualification: six sets, including a ten‑state one at L19452. Site/Area: five, including `scope-pending` (L52555) and `Created/Unbound/Operational/Archiving/Archived` (L52606). **Recommend the module identity cards as governing** (L27460, L27106‑L27107, L27280‑L27281, L28512), for a reason the source itself supplies: state names are classified **Derived Clarification**, i.e. renameable, while the behaviours they describe are SoW Fact (L27636). The card sets are the smallest that cover the stated behaviours. **But note what is lost and record it**: `scope-pending`, `Unbound` and `Archiving` are operationally distinct — scope‑pending excludes a Site from role‑assignment pickers, Unbound blocks Job creation, Archiving holds the cascade. Model those three as flags on the card's `active` state rather than discarding them.

**D22 — Who creates a certification type.** **Total silence.** "Certification type" is an input to every qualification record (L27457) and a filter dimension on the Calendar (L29346), and L61500 says qualification types "become available to authors" — but no line states who creates one, on which screen, under which module, or whether the platform seeds any. Compare Job Type and Service Type, where creation authority, tier behaviour and seed counts *are* all stated (L27654). **Recommend: seed a fixture list, build no CRUD screen, and raise it as a client blocker.** Inventing a certification‑type admin screen would be the largest invented feature in the slice.

**D23 — Where a clearance is granted.** The Hub owns the record; the granting act is Client Command Center action number 10 (L27431, and that control row is surface‑tagged SURF‑CC). DEC‑SEAM‑001 (L13314) names the collision: "rows 3 and 9 describe the same clearance under two producers", against a one‑producer‑per‑record discipline. **Recommend the catalogue A access note as decisive** (L26059): "`Read-only` in the Hub; granting is a Client Command Center action." Slice 4 builds the clearance **register**, read‑only, with the full grant metadata and the command state; it builds **no grant control**. The three grant rows in the MOD‑DOH‑04 matrix (L27472‑L27478) then describe authority the Hub *renders* and the Command Center *exercises*.

**D24 — Calendar roles.** Seven conflicting `roles_allowed` lists exist across restatements. **Resolved by direct reading (L29343‑L29350):** QM `Allowed` tenant‑wide; Tenant Admin and Auditor `Read-only`; Supervisor `Read-only` filtered to own Area; Worker `Unavailable`; recertification from the Calendar is TA and Supervisor through the linked record, QM `Explicitly prohibited`. **Recommend the matrix over every restatement**, including the ones that omit the Quality Manager entirely (L99412).

**D25 — Is a Site mandatory.** DEC‑SITE‑001 is an *adopted working position awaiting ratification*, recorded at 21 points with seventeen different status strings. The adopted position is the stricter one: Site mandatory, a default Site auto‑created at provisioning, renameable, and no configuration path removes the Site level (AC‑WF‑ORG‑001‑04 at L52569, AC‑51‑12 at L113054 — the default Site exists *before any Tenant Admin signs in* and the admin is prompted to rename it). **Recommend building the adopted position, and keeping the Site‑optional path reachable by configuration rather than by code change** — an explicit instruction already on the record at L61533.

**D26 — Escalation with nobody on shift.** DEC‑NOSHIFT‑001, Client Decision Required (L27314, L27390): the fallback is the tenant's Quality Manager role irrespective of shift, with the delivery visibly marked as a fallback. DEC‑QMNONE‑001 escalates it — the fallback target is a *role* which may itself be empty, so the "escalation never resolves to no one" guarantee has a hole exactly where a Severity 1 needs a decider; RISK‑019 is the one register entry where residual risk equals inherent. **Recommend: slice 4 builds the on‑shift roster resolution (FUNC‑DOH‑03‑2.2.1, L27352) and the marked‑fallback flag, and builds no delivery** — delivery is MOD‑DOH‑10, slice 10. The empty‑role hole is a client decision, not an engineering one.

**D27 — DEC‑DEVLOST‑001 blocks the whole device family.** Its impact is recorded as "Blocks WF‑DVC‑001 to WF‑DVC‑006" (L56662) — including the two workflows slice 4 would build — and the source has no lost/stolen classification at all (L53160). *Options:* read "blocks" as design‑blocking (build nothing) or acceptance‑blocking (build, cannot sign off). **Recommend acceptance‑blocking**, and ship mark‑lost as a **state plus a request record only**, since L103830 already states the control "wipes nothing itself". Nothing in the classification gap changes the shape of a request record.

---

## 5. THE HONEST RISK LIST

**R1 — Someone codes a screen identifier from the wrong catalogue and wires the tenant administration area to Platform Access History.** Highest‑probability defect in the slice, because both literals look correct and the collision is silent: `SCR-DOH-23` and `SCR-DOH-023` are different screens (L48117 versus L26073), as are `SCR-DOH-09`/`SCR-DOH-009` and `SCR-DOH-13`/`SCR-DOH-013`. *Mitigation:* D1, and a lint that rejects the three‑digit form anywhere in the codebase.

**R2 — The Worker column gets built.** MOD‑DOH‑04 grants the Worker "own record only" (L27472) and MOD‑DOH‑03 grants "own assigned shift only" (L27297), so an implementer working from the matrices alone will build a Worker Hub view without ever encountering DEC‑WKRVIEW‑001 (L23067). The cost is not a wasted screen — it is a login model, a browser session and an attack surface for the platform's least‑privileged population. *Mitigation:* D11 decided before the matrices are transcribed.

**R3 — A per‑worker behavioural cut ships because the data model permits it.** The Worker record lives on this surface, so the hazard is direct. Clearance frequency is exactly the shape that invites a per‑worker cut and is exactly the cut that is Explicitly prohibited (M‑A5, L101535; AC‑SCHED‑254, L101565). Expiry frequency is the same trap on qualification data (M‑A4, L101532). The source is candid that policy, not architecture, closes the last gap: "the platform can make surveillance hard, it cannot make it impossible" (L101583). *Mitigation:* the standing data‑model assertion at L101581 — no persisted table has a worker identifier as a grouping key for a behavioural measure — run as a schema lint, not a code review habit. Escalation keys on (Area, Shift), never (Worker), per L27434.

**R4 — Suspension is enforced in scattered conditionals and drifts out of the enumerations.** The blocked and open sets are stated "exactly" (L26919‑L26921) and the corresponding acceptance criteria (AC‑DOH‑01‑5/‑6/‑7, L27043‑L27045) test the *exactness*, not the spirit. Two known drifts already exist in the source itself: the soft banner disables device enrolment (L65039) though the exact list does not name it, and the source contradicts itself on where suspension sits in the authorisation order — first of five (L20702), second of six (L20841), or twelfth of fourteen (L46550). *Mitigation:* encode the write‑class table as data, one table, tested against the enumerations verbatim.

**R5 — A control renders as disabled where the source requires it absent, or vice versa.** The distinction is load‑bearing and the source says why in three places: a disabled custom‑role button "would imply a roadmap promise" (L23918); a disabled never‑held‑clearance button "teaches the rule at the moment it binds" (L64415); AC‑4871 requires that in a support session "every mutating control is **absent** rather than disabled-with-a-tooltip" (L107884). Getting this backwards is invisible in testing and wrong in review. *Mitigation:* the token→rendering table in section 1, applied mechanically.

**R6 — MOD‑DOH‑03 ships with a cardinality nobody decided.** §19.5 (L27272‑L27410) states "Bind a Shift to one or more Areas" four times and never once mentions that DEC‑SHIFT‑001 exists; the decision appears only outside the module chapter (L112897‑L116590) and is **absent from `source-reconciliation.json` entirely**, including its residual‑contradictions list. An implementer reading the module chapter and the reconciliation artefact — the two most authoritative‑looking sources — would never learn the question is open. *Mitigation:* D6, and ship the deferred‑cardinality mitigation the source already wrote.

**R7 — The prototype claims a capability it only simulates.** Specific hazards on this surface: the SSO section looks like it connects to an identity provider; the End‑session button looks like it terminates something; the device retire and wipe‑request controls look like they reach a device; the clearance panel looks like it reaches a tablet. The source forbids exactly this class of dishonesty for real reasons — AC‑STU‑118 (L33769): "No surface shows a clearance as effective before its command reaches applied on the device", and L48015: an accepted action renders in its true command state and never as done. *Mitigation:* every one of these renders in a seeded command state, and the wipe request carries the CLASS BADGE.

**R8 — Recertification is blocked or permitted under hard suspension by accident.** D16 is a silence, not a conflict, so nothing in the source will fail a test either way — and the operational consequence (a line that cannot re‑qualify a worker for sixty days) only appears in production. *Mitigation:* D16 as an explicit, visible decision with the client counter‑signature.

**R9 — Acceptance criteria are assumed to exist because identifiers do.** `identifier-index.json` lists `AC-DOH-13-1`…`-7` at L29284‑L29290 and eleven MOD‑DOH‑13 tests at L29296‑L29306, and **zero** were captured as extracted rows; MOD‑DOH‑01 has three of twelve. Every `FUNC-DOH-01-x.y.z` and `FUNC-DOH-13-x.y.z` identifier exists with no name, statement or behaviour recorded anywhere in the extract. A team estimating from the registry will size a test plan against identifiers that carry no content. *Mitigation:* re‑read L29284‑L29306 and L27039‑L27068 from the blueprint directly before writing any test plan; do not size from the extract.

**R10 — Cross‑slice seams get stubbed silently and diverge.** Four are real and named: MOD‑DOH‑01's Worker‑Shift meter consumes MOD‑DOH‑07 assignment events (slice 6); MOD‑DOH‑02's archival cascade enumerates Jobs from MOD‑DOH‑05 (slice 6); MOD‑DOH‑03's digest‑time field registers against the MOD‑DOH‑10 digest service (slice 10); Platform Access History must read MOD‑DOH‑11's audit store (slice 10, and the gate at L46193 forbids a separate view). MOD‑DOH‑04 is the worst case — two of its three enforcement points (assignment and run start, L28214) land in slice 6, so slice 4 owns the record and the evaluator while slice 6 owns two‑thirds of the enforcement. *Mitigation:* each seam ships as a named interface with a seeded fixture behind it and an entry in the slice‑6/slice‑10 handover list, never as an inline stub.

**R11 — Two features that look like slice 4 are not.** The MOD‑DOH‑01 "onboarding role‑mapping worksheet" row (`SCR-DOH-ONBOARD-MAP`, L18024) carries id MOD‑DOH‑01 but is classified **"Recommendation - Research and Development"** while every other MOD‑DOH‑01 row is SoW Fact, and job‑title‑to‑role mapping is MOD‑DOH‑09 subject matter besides. The MOD‑DOH‑03 row at L99408 renames the module "Delivery Operations Hub digest module" with a digest‑assembly purpose that belongs to MOD‑DOH‑10. Both will be picked up by name‑matching. *Mitigation:* neither is built; both are recorded as excluded with their line and their reason.
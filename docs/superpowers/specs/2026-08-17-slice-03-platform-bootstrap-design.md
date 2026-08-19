# Slice 3 — Platform Bootstrap (SURF-SA): Design Specification

**Status:** APPROVED (client delegated the design decision, 2026-08-17: *"pick by yourself what suited for the business but before choosing make sure it cover all the usecase, workflows and story like each and everything"*)
**Builds on:** Slice 2c, Candidate `02bccf3383995c2c`, merged to `main`, 771 tests, `pnpm verify` exit 0
**Census:** `docs/census/2026-08-17-surf-sa-build-map.md` — 10 agents, 19/19 modules, 25 conflicts, 9 risks
**Frozen source:** sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27` (no drift across four slices)

---

## 1. What this slice builds

The Super Admin platform console — **nineteen capability modules across two navigation
bands** (`AC-SA-000-02`, L42880). Band A is the **definition layer**, §8.1–§8.7,
`MOD-SA-01`…`07`. Band B is the **operations layer**, §8.8–§8.19, `MOD-SA-08`…`19`
(L2470, L4560). Seven plus twelve is nineteen, and the per-module band tags
independently corroborate that split.

`MOD-SA-20` is **not built.** §8.20 is a diligence narrative, and the source states
"Nineteen module identifiers; §8.20 Fundability Surface deliberately excluded" (L4567).
The string exists in the frozen source only in prose refusing it — an alias-by-denial.

### The tier-1 role of this surface

Tier 1 **defines**; the Studio configures, the Command Center runs, the floor executes,
against the Hub as the record of truth. Everything below follows from that: this console
sets what is possible, and has almost no authority to act inside a tenant.

---

## 2. The spine — decided once, binding on every module

### 2.1 The six ENFORCED invariants

The evaluation gate · sandbox-before-publish · encryption at rest · encryption in transit ·
cross-tenant analytics anonymisation · the one-transaction audit guarantee (L2143).

They render **locked with no off position for any account including the root**
(`AC-GOAL-051`, L2181), and `AC-SA-INV-003` (L47849) forbids an off control, an approval
path **and** a configuration key on any screen.

### 2.2 The three named access classes — the only route to tenant content

The normal support session · the compliance-emergency path · the JBS access grant
(L4612, L14777). **No ambient browsing exists anywhere on the console** (`AC-SA-005`,
L11710). A normal support session is **read-only without exception** — "a data repair is
not support" (L16022) — and the tenant ends it from its own banner (L9966). Every
platform-side access appears in that tenant's own audit stream and its Platform Access
History screen (L6983).

### 2.3 The four platform roles

`ROLE-PLAT-ROOT` (exactly one account) · `ROLE-PLAT-ADMIN` · `ROLE-PLAT-ENG` ·
`ROLE-PLAT-SUP`. Console roles hold **no tenant operational authority outside a named
access class** (`AC-AUTH-006`, L10429).

### 2.4 Closed sets that are build inputs

Only these are counted on screen, because only these are sets the source closes **and**
whose enumeration matches the stated count:

| set | count | line |
|---|---|---|
| ENFORCED invariants | 6 | L2143 |
| named access classes | 3 | L4612 |
| data-access layers | 3 | L21378 |
| device command states | 15 | L42846 |
| notification channels | 2 | L45684 |
| platform floor register rows | 8 | L4562 |
| governed settings | 17 | L46318 |
| typed memory stores | 5 | L2139 |
| tier bands | 3 | L2195 |
| Overview aggregate elements | 8 | `AC-SA-01-01`, L43068 |

The fifteen device command states, in order (L42846): created · authorized · queued ·
available for delivery · delivered · downloaded · validated · applied · acknowledged ·
rejected · failed · expired · cancelled · superseded · reconciled. One shared
`CommandState` component; `MOD-SA-07`, `MOD-SA-09` and `MOD-SA-13` consume it.

**Everything else is an extraction tally, not an inventory.** 282 workflows, 167 controls,
485 gates are counts of extracted entries with heavy duplication. They appear in no UI.

---

## 3. Decision 1 — how a prohibition renders

This is the single most load-bearing decision in the slice, and the source contradicts
itself: L60704 and L44041 render the invariants "locked and unpressable" with an ENFORCED
badge; L87376, L46121, L65361 and L97560 say the opposite — "an absence of control, not a
disabled control".

**Three renderings, applied by rule, never by taste:**

**ABSENT** — the action does not exist for anyone, including the root. Nothing is drawn; a
one-line note sits where a control would be. Applies to: the six invariants (L47849), atom
creation (L43253), audit edit/delete (L46193), de-anonymisation (L97560), delete or purge
on any storage surface (L46074), pausing the deterministic layer (L65614), adding an
outbound integration destination (L95576), per-tenant region control (L97239).

**DISABLED WITH A NAMED REASON** — the action exists on this platform but not for this role
or not in this state. Drawn, inert, reason in text. Precedent: "Create user" disabled for
Admin with "User creation is root-only" (L76133).

**CLASS BADGE REPLACING THE ACTION BAR** — for a critical-class action viewed by a non-root
role, the whole action bar becomes "Critical class — root approval required", so no control
can be mistaken for approval (L23707).

**A third case the first draft of this rule missed.** ABSENT and DISABLED were
split on "does anyone hold it?", and a cross-module review found two screens
rendering the same `D17` prohibition two different ways under that rule — both
defensibly. The split is finer:

| the action | rendering |
|---|---|
| exists for no one, including the root | **ABSENT** |
| exists for others, and a rule **categorically** forbids it to this role | **ABSENT** |
| exists for others, and this role simply is not granted it here or now | **DISABLED WITH A NAMED REASON** |

The middle row is the one that was missing. `D17` says the Platform Engineer
"may not enter tenant context under any access class" — that is categorical, so
nothing is drawn for that role even though root, Admin and Support open sessions
freely. A disabled control says *you could hold this under some condition*; a
categorical prohibition says *you never can*, and drawing it inert states the
opposite of the rule. The census applied the same reasoning to incident close
for Support ("absent, not disabled, because Support holds no incident ownership
anywhere in the source").

**The collision resolves structurally:** the ENFORCED badge is a **status chip, not a
control** — not focusable, no pressed state, no tooltip implying an approval path. That
satisfies L44041's badge and L87376's absence at once.

> **Risk R2, guarded:** the obvious design is a lock icon on a switch, and it is what two
> passages literally say. A disabled toggle implies an enabled state exists somewhere. A
> gate asserts that no invariant renders as a `<button>`, `<input>` or `[role=switch]`.

---

## 4. The remaining decisions

Each was a conflict or silence in the source. None is resolved silently in code; each is
rendered with its decision reference where a reviewer can see it.

| # | Conflict | Decision |
|---|---|---|
| D1 | Two incompatible `SCR-SA` numbering schemes (26 at L42793 vs 22 at L48730); only `SCR-SA-08` agrees | **Names are canonical; numbers appear only as annotations.** Routes are named, never numbered. Guards risk R6. |
| D2 | Prohibition rendering | §3 above. |
| D3 | Three audit-entry vocabularies; "parked" contradicts FB-SA-03 (L46191) | **`committed` alone** (L46141) — no other state exists by construction, and parked cannot coexist with the one-transaction guarantee. |
| D4 | Audit class count 20 (L46178) vs 22 (L47835); the class list is nowhere | **Data-driven from a fixture**, seeded with the classes actually named, labelled provisional. **The count appears nowhere in the UI.** |
| D5 | Three incident vocabularies + a *proposed* severity scheme | **`OBJ-SA-INCIDENT`** (open→acknowledged→investigating→mitigated→resolved→closed, L42991). L107949's fields become **attributes**, not states. **Incident levels are not rendered — they are proposed.** |
| D6 | `WF-PLT-009` claimed by two modules | **`MOD-SA-01`** — the outage's console home is the health view. Cross-linked. |
| D7 | `WF-FEAT-002`/`005` have no owner | Per-tenant feature override → **`MOD-SA-11`** (it is a flag on the tenant record, L45342). Global feature control stays in `MOD-SA-07`. |
| D8 | `DEC-PAUSE-001` open; four incompatible readings of who may pause | **Admin proposes, root approves** — the only reading consistent with "no fallback depends indefinitely on one person". Platform Engineer's control renders DISABLED, "proposal only — pending DEC-PAUSE-001". The runaway-loop kill switch is **not built**; the source warns it must not be conflated with the pause. |
| D9 | Trace Viewer at V1: six sources say no, four describe one | **No viewer screen.** `DEC-SEC-020` (L104506) independently warns an unqualified viewer "becomes the ambient-browsing path the source forbids". Built as an honest absence carrying the decision record. |
| D10 | `DEC-AUDIT-001` — immutability claimed, tamper-evidence deferred | The UI **never** uses *tamper-evident*, *chained*, *signed* or *verified*. "Append-only" is permitted as a stated design property, always with the prototype qualifier. |
| D11 | Audit immutability vs erasure and anonymisation | **Anonymisation operates on the identity-resolution layer, never on audit rows** (L8368) — the only reading keeping `AC-SA-17-06` and `AC-SA-18-04` both true. Stated on screen. |
| D12 | Critical-class list says ten, enumerates eleven (L55942) | **Build the eleven**, flag the discrepancy. A list short by one drops a root approval. |
| D13 | `DEC-ROOTSUCC-001` — root approves its own critical actions; root unavailability freezes seven capabilities | **Root-unavailable is a first-class, visible screen state** on the approval queue: "critical class frozen — no second approver exists". The most honest thing this prototype can show about the design. |
| D14 | `DEC-FEAT-001` — two readings of who approves enablement | **Split by kind** (L46668): capability-level controls follow Engineer→Admin; commercial entitlement controls are Admin actions. |
| D15 | `MOD-SA-04` has zero controls; `MOD-SA-06` zero; `MOD-SA-01` one; `MOD-SA-11` one; `MOD-SA-16` one | **Build the minimum the acceptance criteria force, and render an explicit "unspecified in source" panel** naming each missing affordance. Inventing a plausible control ships a fiction that reads back as a requirement. |
| D16 | `roles_allowed` is inconsistent for every module | **Module-level `roles_allowed` is authoritative nowhere.** Every affordance is driven by per-control allowed-roles; all four console roles get **read** access to every screen unless a control or rule says otherwise (L42742). |
| D17 | Platform Engineer and support sessions — direct conflict (L20740 forbids vs L65401 allows) | **The prohibition holds.** Band A/Band B separation is the stronger, more restated principle, and the narrower grant is the safer prototype. Renders ABSENT with a note naming the conflict. |
| D18 | Support session extension and export both open | **No extension** (a new session with a fresh reason, L56107) and **no export from inside a session** — the only reading keeping the mirroring guarantee intact. |
| D19 | Compliance-emergency time box unstated | Rendered as **required-and-unset**: "Not yet set — `DEC-SEC-017`". Not hard-coded to the one-hour suggestion. |
| D20 | Tenant detail: "eight tabs", seven enumerated | **Build the seven named** — Overview, Operations (read-only), Agents, Memory, Devices, Metrics, Logs and Audit — and flag the eighth unresolved. Do not guess it. |
| D21 | `MOD-SA-07` is "ten categories" but has fifteen AC sub-groups | **Ten navigable categories**; severity catalog, locale packs, invariants-and-floor-register, and emergency pause render as cross-cutting sections with their own screens (L42801). |
| D22 | `MOD-SA-07` scheduled-work and feature material is "User-Mandated Product Extension", not SoW Fact | **Built visibly separated and labelled**, so contract and extension are distinguishable on screen. |
| D23 | The eight per-surface access classes are named once and never defined | **Not used anywhere in this slice.** Any mapping onto the three named classes would be an inference the source does not make. |
| D24 | Permission-matrix cell status set varies from five to nine tokens | **The nine-token cut** (L10238) — the most frequently restated, and already the closed `PermissionOutcome` set shipped in slice 2a. |
| D25 | Band split | Bands are **navigation only**, labelled by meaning — "Definition layer" and "Operations layer" — with both stated as V1. The split "sequences the build and carries no commercial or acceptance meaning" (L2397). |

---

## 5. Module-level requirements that bind every screen

- **`AC-SA-000-09` (L42887):** with every artificial-intelligence model unavailable, **all
  nineteen modules remain operable and the emergency pause remains exercisable.**
  `STATE-11` is therefore not decoration — it is a tested requirement on every module.
- **`AC-SA-000-04` (L42882):** every critical-class action is blocked until the root
  approves, and **the blocked attempt is itself an audit event.**
- **`AC-SA-01-03` (L43070):** a degraded aggregate renders **stale with its age**; a wholly
  unavailable one renders **unavailable**; **neither renders as zero or blank.**
- **`AC-SA-01-08` (L43075):** incident state transitions are written to the platform audit
  log **in the same transaction as the transition** — the one-transaction guarantee this
  build already enforces in `PersistenceCoordinator`.
- **`AC-SA-01-02` (L43069):** no control on the Overview, or on any screen one click from
  it, performs a tenant operational action.
- **`AC-SA-09-14` (L45105):** a flat prohibition on operational action from the tenant
  detail page for any console role.

---

## 6. Support-not-surveillance on this surface

Two modules are where this goes wrong, and it goes wrong through a metric, not a feature.

`MOD-SA-12` meters **Worker-Shifts**: one worker attached to work in one calendar shift
meters exactly one Worker-Shift regardless of run count (`AC-GOAL-060`, L2241). That is a
**billing unit**. It renders as a count on a commercial ledger — **never a rate, never a
per-worker series, never a comparison between workers.**

`MOD-SA-10` renders cross-tenant comparatives, and anonymisation **precedes** aggregation
as an enforced invariant (L45179). For every console role including the root, tenant memory
content reads "Unavailable — counts and volume only" (L97152). `AC-SA-04-05` (L43627): an
individual-level profile record **cannot be created**.

**The line to hold is at the tenant.** No time series below tenant-month. No rate. No
comparison of people. A gate asserts it.

---

## 7. The no-link rule

Every module screen has a plausible reason to link to a tenant record — an incident to its
run, a metric to its data, an audit row to the object it names. `AC-SA-000-07` (L42885) and
`AC-SEC-801` (L104316) forbid all of it outside a named session.

**Rule for the build: on SURF-SA, no link ever resolves to record-level tenant content. It
resolves to a session-request form.** This is a gate, not a convention.

---

## 8. The prototype boundary

No backend. Every state below is a **seeded fixture the user steps through**, not a computed
transition. The role selector is a view-switcher, not a login. "Applied", "delivered",
"acknowledged", "committed" are rendered labels on fixture data.

`AC-SA-13-05` (L45570) is the sharpest case: **no console view renders an unreached device
as wiped.** A fixture that flips to "applied" on click violates the very criterion it
demonstrates. So device fixtures **advance through** states on explicit user action with the
state name always visible.

Every screen carries the prototype disclosure. `AC-SCOPE-033` (L2612) forbids describing the
audit log as tamper-evident, chained or signed; in a prototype that extends to not
describing it as append-only-enforced either.

---

## 9. What this slice does NOT build

The Studio authoring chain (slice 5). Hub Job/Run (slice 6). Frontline execution and offline
sync (slices 7–8). The Command Center (slice 9). A Trace Viewer screen (D9). The runaway-loop
kill switch (D8). `MOD-SA-20` — it is not a module.

---

## 10. Testing

Every decision in §4 is a test. Every gate proven able to fail by planting a violation, **on
the axis the gate is for** — this build has shipped a gate defeated by letter casing, one
blinded by a regex literal, one that matched its own denial, an inert exhaustiveness check,
and an approval gate that missed every word form but the past tense.

Specific gates this slice adds:

1. No invariant renders as a `<button>`, `<input>` or `[role=switch]` (guards R2).
2. No link on SURF-SA resolves to record-level tenant content (guards R4, §7).
3. No metric below tenant-month, no rate, no per-worker series (guards R5, §6).
4. The words *tamper-evident*, *chained*, *signed*, *verified* appear nowhere in SURF-SA
   copy (D10).
5. No route is keyed on a bare `SCR-SA-NN` number (D1, guards R6).
6. All nineteen modules render with every AI model unavailable, and the emergency pause
   remains exercisable (`AC-SA-000-09`).
7. Every aggregate renders an as-of timestamp and degrades to stale-with-age or unavailable,
   never zero, never blank (`AC-SA-01-03`).
8. The eleven critical-class actions each route to root approval, and a blocked attempt
   writes an audit event (D12, `AC-SA-000-04`).

Carried from slice 2c, non-blocking: `stripComments` over-strips a JSX text run that
*begins* with `//` (zero live loss); `source-reconciliation.json`'s `extracted: 36` is
hand-maintained.

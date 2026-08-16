# Slice 2a — Contracts, Primitives and Persistence: Design Specification

**Status:** DRAFT — awaiting design approval
**Builds on:** Slice 1, Product Candidate `ffe0f802acce93df`, `pnpm verify` exit 0, 225 tests
**Umbrella spec:** `docs/superpowers/specs/2026-08-16-aviixa-interactive-storyboard-design.md`
**Frozen source:** sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27` (no drift)

Slice 2 was split into 2a and 2b on client instruction. **2a is this document:** the
contracts and storage every later slice consumes. **2b** is the reviewer-facing layer
built on top — review shell, scenario controls, review package import/export, evidence
capture — and gets its own design, plan and review cycle after 2a's contracts freeze.

The sequencing is deliberate. Slice 1's cross-tenant defect was only found after
everything had been built on the defective contract. 2a freezes before 2b consumes.

---

## 1. Amendment to a slice-1 frozen contract

Slice 1 froze a six-member `PermissionOutcome` taken from the master prompt's wording.
The complete source read afterwards showed the master prompt was incomplete here.

**Frozen source, L10238, verbatim:**

> Every cell in every permission matrix carries an explicit status from the closed set:
> `Allowed`, `Allowed with conditions`, `Read-only`, `Cached read-only while offline`,
> `Queued while offline`, `Unavailable`, `Explicitly prohibited`, `Client Decision Required`,
> or `Not applicable` with a stated reason. Blank cells are prohibited, because a blank
> cell is an unanswered question that an implementer will answer privately and
> inconsistently.

Four of those nine had no runtime representation. They are not labels — they describe
genuinely different behaviour, and slices 7 and 8 (offline execution, synchronisation)
cannot be built without them.

### 1.1 `PermissionOutcome` — closed at nine, source-exact

| Outcome | Meaning |
|---|---|
| `allowed` | The actor may proceed. |
| `allowedWithConditions` | Permitted, but a stated condition applies and must be surfaced. |
| `readOnly` | The record is visible and cannot be changed, with the cause named. |
| `cachedReadOnlyOffline` | A cached copy is readable; its age and origin must be shown. |
| `queuedOffline` | The action is accepted locally and will take effect later; it must render in its true command state, never as complete. |
| `unavailable` | Genuinely unavailable now — suspension, connectivity, or object state. |
| `explicitlyProhibited` | The source explicitly prohibits this actor. Audited as a refusal. |
| `clientDecisionRequired` | An open client decision governs this; the storyboard will not guess. |
| `notApplicable` | Carries a **required** reason string. A reasonless `notApplicable` fails the type. |

`explicitlyProhibited` replaces slice 1's `blocked`. The rename is deliberate: "blocked"
described a UI outcome, "explicitly prohibited" is the source's term for a governed denial
that must be audited.

**A blank cell fails the build.** A matrix cell with no status is a build failure, not a
default — enforced by a test, per the source's own reasoning that a blank cell is an
unanswered question an implementer will answer privately and inconsistently.

### 1.2 `FieldTreatment` — orthogonal, three values

`visible` · `redacted` · `hidden`.

Slice 1 carried `hidden` and `redacted` inside the permission union. They do not belong
there: they describe how a **field renders**, not whether an **action is permitted**. A
field can be `redacted` on a screen the actor is fully `allowed` to use. Conflating the
two is what made the six-member version ambiguous.

`hidden` is reserved for the case where revealing a control's existence would itself
disclose unauthorised information. Everything else is `redacted` or a governed denial.

### 1.3 The enforcement rule this design must not violate

Frozen source, §25 preamble: *"taking a button off the screen does not stop anyone. The
stopping has to happen on the server."*

In this prototype there is no server, so the equivalent is: **the decision comes from
`evaluateAccess`, never from whether a component chose to render a control.** A component
may not compute its own permission. Enforced by review and by the no-duplicate-policy
test.

---

## 2. The thirteen screen states

Frozen source, §25, L48014: *"Rather than writing the same thirteen paragraphs
seventy-nine times, this section writes them once as a contract every screen must honour."*
**Every screen renders all thirteen.**

| ID | State | Contract |
|---|---|---|
| `STATE-01` | Empty | Frame plus a plain sentence naming what would appear and what creates it, plus the creating action where the role holds it. **Never a blank panel, never confused with a failure.** |
| `STATE-02` | Loading | Skeleton of the eventual layout, progress indicator, the object being fetched named. **Loading never renders a zero** — a count that has not arrived is a placeholder, not `0`. |
| `STATE-03` | Success | Content with its as-of timestamp where aggregate, and its freshness class. |
| `STATE-04` | Validation | The invalid field marked, the broken rule stated in words, the permitted range or format stated. |
| `STATE-05` | Permission-denied | Plain statement that this identity's roles and scopes do not carry the action, and the name of the role that does. |
| `STATE-06` | Read-only | Every input disabled with **one** banner naming the cause. |
| `STATE-07` | Offline | **Only the Frontline Worker Application has a true offline state.** The other four surfaces must not fake one. |
| `STATE-08` | Stale-data | Age and origin explicit. |
| `STATE-09` | Queued | Shown in its **true command state** — created, authorised, queued, available for delivery, … — never as applied or complete. |
| `STATE-10` | AI-degraded | The agent's area states it is degraded, what is missing, what remains available. Deterministic behaviour continues. |
| `STATE-11` | AI-unavailable | Unavailability with its cause where known. |
| `STATE-12` | Failure | What failed, **whether anything was written**, and the next step. |
| `STATE-13` | Recovery | What is being replayed or recomputed, how much remains. |

The four distinctions the contract exists to protect, in the source's words: *nothing
exists yet, we are fetching, we cannot fetch, and we fetched something old* — plus queued
versus applied, and degraded versus unavailable.

`STATE-07` is a genuine scope limit, not an omission. A non-Frontline surface rendering an
offline state is a defect.

---

## 3. Design-system primitives

One primitive layer, documented in every state the umbrella spec §4 requires, and capable
of expressing all thirteen screen states.

`Button` · `LinkButton` · `Field` (label, description, error, required) · `Select` ·
`Checkbox` · `Table` (sort, density, empty, no-match, loading skeleton, error) ·
`Dialog` · `Drawer` · `Tabs` · `Breadcrumbs` · `StatusPill` · `Banner` ·
`Toast` · `LiveRegion` · `SkeletonBlock` · `EmptyState` · `FreshnessLabel` ·
`PermissionNotice` · `ScreenStateBoundary`.

`ScreenStateBoundary` is the one that carries the contract: given a `ScreenState`, it
renders the default treatment for that state, and a screen overrides only where it
genuinely differs. That is the source's own mechanism — write the thirteen paragraphs
once, record only the differences.

**Non-negotiables.** Status colour is never load-bearing alone: every state carries an
icon and a text label. `StatusPill` cannot be constructed without both. Disabled controls
carry an accessible description giving the reason. No control renders without an
accessible name.

---

## 4. Registry loading with runtime validation

`registries/generated/` holds source-derived data. Compile-time typing is insufficient —
umbrella spec §3.2 requires runtime validation before use.

Zod schemas for every registry record. The loader validates on read and **rejects unknown
fields** rather than ignoring them, because an unknown field is the signature of a version
mismatch.

Only the allowlisted, data-minimised subset ships to the browser: stable IDs, non-sensitive
heading locators, classification, and short approved paraphrases. Raw extraction stays
build-time input. The slice-1 release gate already fails on a blueprint filename or an
absolute path anywhere under `out/`, and that gate now also runs post-build.

---

## 5. Persistence

### 5.1 Storage bootstrap state machine

`uninitialized → client-mounted → opening → reading → runtime-validating →
checksum-verifying → migrating (when required) → ready-durable`

Failure exits: `upgrade-blocked` · `persistence-denied` · `quota-limited` ·
`corrupt-quarantined` · `migration-failed-read-only` · `ephemeral-preview`.

**No default-persona flash.** Static HTML and first client paint render a neutral locked
shell — no default role, tenant, work item, metric, notification, or confidential-looking
fixture value. Role-aware content renders only after validation, migration, integrity
checks and atomic store installation. Tested against first load, hydration, slow open,
corrupt state, migration, private mode, blocked upgrade and reload.

### 5.2 Atomic commit

Implements `MOD-DOH-17` and the source's **one-transaction audit guarantee**, which is one
of the six enforced platform invariants locked with no off position for any account
including root: *"an action that cannot be audited does not happen."*

A state-changing action commits the next domain snapshot **plus** every required audit,
capture, queue, command, notification, schedule and idempotency record in **one IndexedDB
transaction** before publishing `CommittedTransition`.

If the transaction aborts, visible domain state remains exactly the prior state and the
caller receives a typed persistence failure. Partial in-memory success is never published.
Durability is never inferred from a resolved promise.

### 5.3 `PersistenceCapability` action matrix

`ready-durable` permits state-changing canonical story actions.

`ephemeral-preview` permits navigation, read-only fixture inspection, presentation changes,
failure previews, and clearly labelled non-credit sandbox demonstration. It **blocks** every
action representing durable evidence, required audit, capture acceptance, queue or command
acceptance, approval, publication, release, hold, synchronisation, authoritative lifecycle
change, or checkpoint credit.

A persistence failure during an allowed canonical action keeps prior visible truth and
refuses the action. It never falls back to a partially successful in-memory mutation.

### 5.4 Data classes

The source closes this at seven, and every persisted field belongs to exactly one:
operational records · configuration · evidence media · audit · telemetry · memory ·
personal data.

**Memory has no export path at V1.** This constrains slice 2b's review package export and
is recorded here so 2b inherits it rather than rediscovering it.

---

## 6. What slice 2a does NOT build

Review shell, scenario controls, review package import/export, evidence capture — all 2b.
Module screens — slices 3–13. The scenario command gateway and client store are 2b, because
they consume the persistence coordinator this slice freezes.

Deferred with reasons recorded: deep-freezing domain state at runtime (types plus review
carry it); full build-manifest path allowlisting in the no-network gate (needs the release
slice's manifest generation, and the deferral is commented in the test rather than silently
absent).

---

## 7. Testing

Every primitive: all documented states, keyboard operation, accessible name, focus
behaviour. Every screen state: rendered and asserted. The permission amendment: all nine
outcomes reachable and tested, `notApplicable` without a reason failing at the type level,
and a blank matrix cell failing the build.

Persistence: bootstrap through every success and failure exit; atomic commit proven by
forcing a mid-transaction abort and asserting the prior state survives intact with no
partial write; `ephemeral-preview` proven to block each class of durable action.

Every gate must be proven able to fail by planting a violation, per the discipline slice 1
established after a gate was found passing on an accident of letter casing.

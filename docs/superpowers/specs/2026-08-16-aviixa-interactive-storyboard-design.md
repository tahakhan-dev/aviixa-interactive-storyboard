# AVIIXA Interactive Storyboard — Umbrella Design Specification

**Status:** DRAFT — awaiting design approval (Section 23.3 S1 gate)
**Lifecycle evidence mode:** `NATIVE_GIT_LIFECYCLE` (APP-001)
**Frozen source:** `AVIIXA_Production_Product_Blueprint.md`
sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`
18,565,031 bytes · 122,241 lines · 1,160 headings

This is the umbrella design. It freezes the cross-cutting contracts that every
subproject must obey. It does not pre-approve any subproject's own design; each
of the thirteen slices re-enters brainstorming for its own approval, per
master prompt Section 23.3 S2.

---

## 1. What is being built

A browser-only Next.js static-export application that lets a client walk through
the entire AVIIXA platform before implementation is approved. Five product
surfaces, nine human security roles, every source-defined module reachable, every
visible control behaviourally meaningful, one continuous factory story from
platform bootstrap to tenant archival.

It is a client-validation prototype. It has no backend, makes no network call
after its own assets load, and never claims a production control exists.

### 1.1 What it is not

It does not implement the production platform, finalise open client decisions,
prove security or compliance, or use real data. Every product action is a
simulation over local fixtures.

---

## 2. Frozen source facts this design is built on

These were extracted from the frozen source, not assumed. Each carries its line
locator. The master prompt supplied validation *candidates*; where the frozen
source disagreed, the frozen source won and the delta is recorded in Section 12.

### 2.1 Surfaces — exactly five

| ID | Surface |
|---|---|
| `SURF-SA` | Super Admin platform console |
| `SURF-DOH` | Delivery Operations Hub |
| `SURF-STU` | Standards and Operations Studio |
| `SURF-CC` | Client Command Center |
| `SURF-FL` | Frontline Worker Application |

Tenant Administration is part of `SURF-DOH`, not a sixth surface.

### 2.2 Modules — exactly 81, canonical ranges stated at L1089

`MOD-DOH-01`…`MOD-DOH-19` (19) · `MOD-STU-01`…`MOD-STU-18` (18) ·
`MOD-CC-01`…`MOD-CC-13` (13) · `MOD-FL-A1`…`MOD-FL-A7` + `MOD-FL-B8`…`MOD-FL-B12` (12) ·
`MOD-SA-01`…`MOD-SA-19` (19). Total **81**.

A raw grep finds 82 `MOD-*` tokens. The 82nd is `MOD-SA-20`, which occurs only
inside `TEST-COV-111` (L4736) — an assertion that *no module inventory row
carries that identifier*. `AC-COV-112` states plainly: *"module identifiers run
only from `MOD-SA-01` to `MOD-SA-19`"*. §23.20 "Requested Super Admin Extensions
Beyond the Statement of Work" is deliberately mapped without a module ID. The
canonical count is 81 and the deduplication rule is "exclude negative-assertion
tokens".

Module identifiers in their identifier form are `Derived Clarification`; the
underlying requirement sentences are `SoW Fact`.

### 2.3 Roles — nine human security-role types in two domains

Platform (4): Root Super Admin · Admin · Platform Engineer · Support.
Tenant (5): Tenant Admin · Supervisor · Quality Manager · Read-only Auditor · Worker.

`MOD-DOH-09` requires "exactly five fixed tenant roles". `MOD-SA-08` requires
"exactly one backend-created root account with client custody, four fixed console
roles, maker-checker". There is no Tenant Super Admin. Job Owner is an object
field. Plant Manager and Quality Director are occupational personas under
`DEC-ROLE-001`, not security roles.

`DEC-COUNT-001` records the source's unqualified five-versus-combined-nine
wording as a residual contradiction and is preserved, never resolved.

### 2.4 The eight adopted working positions (§51.0)

Adopted 2026-08-14 by JBS as builder, ahead of client ratification. Every one is
classified `Derived Clarification — adopted working position`, never `SoW Fact`.
The application implements the adopted position and simultaneously exposes the
original contradiction and the "if the client rules otherwise" consequence.

| Decision | Adopted position |
|---|---|
| `DEC-CAP-001` | Option B — seven capture types: measurement entry, photo capture, barcode/QR scan, checkbox confirmation, digital signature, free text, dropdown selection |
| `DEC-GATE-001` | Option C — gating declared per agent in the agent record's governance-binding field |
| `DEC-CONTLAUNCH-001` | Option A — the device launches the containment checklist locally from the pinned package at classification; the agent enriches afterwards and never triggers |
| `DEC-SUSP-001` | Option C — soft-suspension release is an explicit Super Admin operator signal; no payment integration exists |
| `DEC-SYNC-001` | Option C — stop-class commands first, then capture upload, then enabling commands |
| `DEC-AREA-001` | Option A — a Job anchors at the deepest parent node the tenant configured |
| `DEC-SITE-001` | Option C — Site is mandatory; a default Site is auto-created at tenant provisioning |
| `DEC-TAX-002` | Interim — the seeded catalogue ships empty; the sixteen names are owed and are not invented |

Six items remain owed by the client: `DEC-REPORT-001`, `DEC-DEVICE-001`,
`DEC-SCAN-001`, `DEC-CERT-001`, `DEC-DELETE-001`, `DEC-SADRAFT-001`.
`DEC-UNIT-001` is a JBS engineering dependency, not a client item.

### 2.5 The Command Center closed action set of ten (`MOD-CC-13`, L38645)

Governing sentence: *"the Command Center is the cockpit, never the engine"*
`[SoW Fact — §6.14.1, §3.5]`. Every action is a command against a
Delivery-Operations-Hub-owned record, executed through the owning DOH service,
written to the DOH audit trail.

| # | Action | Authority |
|---|---|---|
| 1 | Acknowledge an alert or escalation | Supervisor, Quality Manager |
| 2 | Approve / adjust-within-bounds / decline a gate item | Quality Manager |
| 3 | Approve or decline a learned-change proposal | Quality Manager |
| 4 | Release a lot hold, including automatic Severity 1 holds | Quality Manager only; Supervisor requests with a note |
| 5 | Resolve or Resolve All sync conflicts | Quality Manager; Supervisor view-only |
| 6 | Acknowledge and annotate the shift handoff brief | Supervisor, Quality Manager |
| 7 | Mark evidence reviewed | Quality Manager |
| 8 | Reassign a run mid-shift | Supervisor, Quality Manager |
| 9 | Request an agent re-check | Supervisor, Quality Manager |
| 10 | Grant a qualification clearance | Supervisor (expired only, QM notified); Quality Manager (any) |

Tenant Admin is **explicitly prohibited** on all ten rows. Read-only Auditor
performs no action and holds no access. Worker holds no access.

`DEC-PLUS-001` reading used throughout: *"and above" is an enumerated grant,
never an inference from rank*. "Supervisor and above" = Supervisor + Quality
Manager and does **not** include Tenant Admin.

Four absolute exclusions for every role: cannot override a specification or
evaluation gate; cannot pause or stop a run; cannot edit any record or
configuration; cannot create Jobs or runs.

`DEC-CCWRITE-001` covers report-format authoring, which originates on the surface
but sits outside the closed in-shift list.

### 2.6 The three governance gates

Specification gate — hard, always. Evaluation gate — hard, always, including for
the root account. Qualification gate — the only configurable gate, with
notify-only as the floor, and the only one carrying a governed clearance path
(action 10). `MOD-STU-05` / `MOD-SA-05` / `MOD-FL-A5`, §3.1.

### 2.7 Detection is deterministic; interpretation is agentic

`MOD-SA-02`, §3.2: *no artificial-intelligence model sits in the
deviation-triggering path*. Detection is rule-based and reproducible on the
device. Artificial intelligence runs only afterwards and can never trigger or
classify a deviation.

### 2.8 Severity 1 floor

One platform-side severity catalogue, tenant action bundles above the floor, one
fixed Severity 1 floor (`MOD-SA-07`, §3.3). Immediate local freeze or hold,
containment, escalation, Quality-Manager-only release. A tenant may make it
stricter, never weaker.

### 2.9 Frontline information architecture — six destinations

`MOD-FL-A2`, §7.4: a deliberately shallow application with six destinations, the
Run Player dominant. Capture, coaching, deviation, handover, evidence and
sign-off are Run Player states, not additional destinations.

Login · My Runs · Run Player · Notifications and Sync Inbox · Training Library
(online-only) · Profile-lite.

### 2.10 Other load-bearing source facts adopted into the design

- `MOD-DOH-08` — the three closing run states submitted / complete / finished,
  with finish as **the platform's one automatic transition** after a
  tenant-configurable window. No other automatic transition is invented.
- `MOD-STU-17` — per-locale authored variants inside one Workflow, **no runtime
  translation anywhere**, a publish-time locale completeness check that blocks
  publication.
- `MOD-STU-11` — three-stage approval chain, the Reviewer cannot edit, enforced
  separation of duties.
- `MOD-STU-12` — semantic versioning, author classification validated by the
  Reviewer, mandatory republish description, patch auto-adoption.
- `MOD-STU-14` — the complete work package delivered at run assignment and
  pinned per run; Training Library content excluded from the package.
- `MOD-SA-15` / `MOD-SA-16` — exactly three named access classes; read-only,
  reason-required, time-boxed, tenant-visible, tenant-terminable, mirrored into
  the tenant's own audit log.
- `MOD-SA-18` — append-only immutable platform audit under the one-transaction
  guarantee, twenty-one named event classes.
- `MOD-SA-12` — the Worker-Shift usage metric: one worker attached to work within
  one calendar shift counts once regardless of run count.
- `MOD-DOH-17` / `MOD-DOH-18` — the audit log commits **in the same transaction
  as the action**. This is the source of the atomic-commit requirement in
  Section 5.4 below.

---

## 3. Architecture

### 3.1 Dependency direction

```
Route and screen components
        ↓ read only through role-aware selectors
Surface feature controllers
        ↓ dispatch only through
ScenarioCommandGateway
        ↓ invokes
Pure transition kernel + policy evaluators      (no React, no DOM, no storage)
        ↓ returns immutable ProposedTransition
PersistenceCoordinator                          (one IndexedDB transaction)
        ↓ publishes CommittedTransition
Scenario store + append-only simulated ledgers
        ↓ notify
Five surface projections + review/impact projections
```

Only `ScenarioCommandGateway` may request a domain mutation. Components,
fixtures, selectors and visualisations never mutate. The kernel is pure,
framework-independent and deterministic.

### 3.2 State partitioning — four separate domains

| Domain | Cardinality | Participates in product hashes/audit? |
|---|---|---|
| `ScenarioDomainState` | exactly one per `ScenarioRunId`, containing one `PlatformPartition` + a `TenantPartitions` map keyed by `TenantId` | yes |
| `IdentitySimulationState` | one per simulated product session/persona | relevant inputs only |
| `PresentationState` | one per product session/persona, transient | no |
| `ReviewState` | one per named review workspace + reviewer | no |

A persona switch clears unauthorised selectors, rendered projections, query
results, transient caches and presentation state. It never clears, forks or
rewrites shared domain truth, product audit, or the review workspace. Tenant A
actions can never affect or appear in Tenant B.

### 3.3 Demo controller vs product session

`DemoControllerContext` (reviewer tool: scenario, checkpoint, persona, viewport,
failure fixtures) is strictly separate from `ProductSessionContext` (the
simulated signed-in identity used for permissions and audit attribution).

Changing the demo persona never executes a product command, approves work,
changes business state, or alters the actor on an existing product audit event.

### 3.4 Effective-access evaluation order

One `PermissionDecision` union — `allowed` · `blocked` · `hidden` · `redacted` ·
`unavailable` · `decisionRequired` — carrying reason code, plain-language
explanation, source/decision IDs, scope, evaluated conditions and audit
expectation.

Evaluated in order: authenticated session → tenant isolation → base-role union
and explicit deny → scope intersection (Tenant/Site/Area/Shift/object/temporary
grant) → feature enablement, entitlement, platform floor, tenant effective value,
suspension → object lifecycle and version → worker qualification and assignment →
device trust, connectivity, package, offline authorisation → segregation of
duties, maker-checker, approver availability, human-decision gate.

Explicit deny wins. Scopes intersect. Unauthorised values are absent from the
rendered DOM and accessibility tree, never merely hidden with CSS. The earliest
failing stage wins, so a denial never leaks information from a later stage.

#### 3.4.1 Rules learned the hard way — all five were real defects

An earlier version of this design shipped an evaluator that passed 71 tests and
was still wrong in five ways. Every rule below exists because the absence of it
was a working exploit, not because it seemed prudent.

1. **Stage 2 checks the RESOURCE's tenant, not the actor's.** An access request
   carries `resourceTenant`. Checking only "does the actor's own tenant exist"
   is a liveness check wearing an isolation check's name — under it, a Quality
   Manager in one factory could release another factory's quality hold, with the
   audit written under the attacker's tenant so the victim's trail stayed empty.
2. **A null tenant is a denial, not a skip.** Stage 2 reads
   `RoleDefinition.domain`. A tenant-domain role with a null tenant is refused;
   a platform-domain role holding a tenant is also refused, because a platform
   role reaches tenant data only through a named access session. Skipping the
   stage on null made a null-tenant role *more* privileged than a correct one —
   it bypassed isolation and suspension together.
3. **Every stage fails CLOSED.** A constraint that is declared but
   under-specified must deny. Declaring `allowedObjectStates` without supplying
   the object's state, or setting `makerCheckerOf` with an unknown actor, must
   never be weaker than declaring nothing at all.
4. **An unregistered feature is OFF.** Absent platform registration is a floor,
   not a blank cheque. Otherwise a tenant enables a feature the platform never
   registered — including a typo'd or unreleased one — by tenant config alone.
5. **A prohibition is explicit, not an absence.** A role the source explicitly
   prohibits is listed in `deniedRoles`, producing `EXPLICIT_DENY` with
   `RECORDED_AS_REFUSAL`. Merely omitting it from the allow-list yields a
   generic reason and, critically, **no audit record** — so a Tenant Admin could
   probe all ten Command Center actions and leave zero trace.

A state that cannot be canonically serialised returns a typed denial. The kernel
never throws: an unhashable state is exactly when it must degrade to a refusal.

### 3.5 Transition result contract

The kernel returns an immutable `ProposedTransition`: status, reason codes,
child-simple explanation, prior/next state hashes, object versions and
transitions, domain events, device commands, notifications, schedules, audit
records, correlation/causation/idempotency IDs, actor, tenant, scope, device,
logical time, device time, monotonic sequence, affected surfaces, projection
refresh states, active failure injection, first fallback, fallback failure,
terminal safe state, recovery and reconciliation requirements.

Illegal transitions return a typed denial with evidence. They never throw an
unhandled user-facing exception and never partially mutate.

---

## 4. Screen construction — hand-authored per module

Per the client's selected approach, every one of the 81 modules gets a bespoke
screen written against that module's own source content. There is no shared
screen-archetype layer.

What **is** shared is the design-system primitive layer mandated by master prompt
Section 20.1 — button, link, table, dialog, drawer, form field, status pill,
tab, breadcrumb, toast, live region, focus manager — each documented in default,
hover, focus, active, selected, disabled, loading, invalid, warning, stale,
offline, queued, pending, conflict, failed, fallback, safe-stop, recovered and
success states. Primitives carry accessibility and interaction behaviour;
modules carry meaning.

### 4.1 Every module screen must contain

The role's specific goal or inspection task · source-specific objects, fields,
states, relationships and terminology · authoritative-vs-projection truth and
freshness · at least one meaningful authorised interaction, governed denial, or
read-only investigation path · the business consequence and next step ·
realistic fixture data sufficient to exercise every rendered control.

### 4.2 Two automated gates enforce substance

**Substance gate.** For each module screen, a test asserts the body references
module-specific object types, field names and action IDs drawn from that module's
source record. A screen whose body remains semantically valid after its module
binding is swapped fails.

**Fixture-adequacy gate.** For every search, filter, sort, pagination, chart,
bulk action and transition, a `FixtureAdequacyRecord` proves a positive result,
an empty/no-match result, a boundary condition, and an observable before/after
difference. No pagination without enough records; no bulk action without
selectable records; no filter that leaves results unchanged.

---

## 5. Runtime constraints proven against official documentation

Verified 2026-08-16 against Next.js official docs and source
(`docs/01-app/02-guides/static-exports.mdx`, `packages/next/src/server/config.ts`,
`packages/next/src/export/index.ts`) via Context7.

### 5.1 Static export

`output: 'export'`. Every dynamic segment has `generateStaticParams` or an
equivalent finite build-time inventory. `images.unoptimized: true` with local
assets only. Explicit tested decisions for `basePath`, `assetPrefix`,
`trailingSlash`. Generated accessible not-found page.

### 5.2 What the build itself forbids

Server Actions **throw** under export. Intercepting routes **throw**. The default
image loader **throws** unless unoptimized. The no-backend boundary is therefore
enforced by the build, not merely by policy — a release gate in its own right.

### 5.3 i18n is a hard architectural constraint

`i18n` config **throws** under `output: 'export'`. English and Spanish
demonstration is therefore implemented as application-level authored content
dictionaries selected from `PresentationState`. This matches `MOD-STU-17`'s "no
runtime translation anywhere" and avoids multiplying the static route census.
No `next-intl`, no routing-based locales, no translation service.

`rewrites`, `redirects` and `headers` only warn and do not take effect.
Security headers and CSP are therefore **deployment-dependent**, shipped as host
recipes and labelled as such — never claimed as application-enforced.

### 5.4 Persistence and atomic commit

IndexedDB for versioned scenario snapshots, append-only ledgers, review records
and review packages. `localStorage` only for theme, locale, last safe route.

A state-changing action commits the next domain snapshot **plus** every required
audit, capture, queue, command, notification, schedule and idempotency record in
**one IndexedDB transaction** before publishing `CommittedTransition`. This
implements `MOD-DOH-17`'s "commits in the same transaction as the action".
If the transaction aborts, visible domain state remains exactly the prior state
and the user receives a typed persistence failure. Partial in-memory success is
never published; durability is never inferred from a resolved promise.

Storage bootstrap state machine:
`uninitialized → client-mounted → opening → reading → runtime-validating →
checksum-verifying → migrating → ready-durable`, with failure exits
`upgrade-blocked`, `persistence-denied`, `quota-limited`, `corrupt-quarantined`,
`migration-failed-read-only`, `ephemeral-preview`.

Static HTML and first client paint show a neutral locked shell with no default
role, tenant, work item, metric or fixture value. Role-aware content renders only
after validation and atomic store installation. No default-persona flash.

`ephemeral-preview` permits navigation, read-only inspection and labelled
non-credit sandbox demonstration; it **blocks** every action representing durable
evidence, required audit, capture acceptance, approval, publication, release,
hold, synchronisation, authoritative lifecycle change, or checkpoint credit.

### 5.5 No-network proof

An end-to-end request-interception test builds and serves `out`, records every
request, and permits only same-origin `GET`/`HEAD` reads whose normalised path
appears in the frozen build manifest. It fails on every external origin,
non-read method, `/api` path, unknown dynamic endpoint, domain-data request,
mutation, analytics or telemetry request.

### 5.6 Source confidentiality

The blueprint is confidential build-time input. The raw file stays outside `app`,
`src`, `public`, fixtures, generated source, source maps, screenshots and `out`.
The client bundle carries only an allowlisted, data-minimised source-reference
registry: stable IDs, non-sensitive heading locators, classification, and short
approved paraphrases. A release scan over `out` fails on the blueprint filename,
absolute author paths, unique canary excerpts, secret patterns, or process-ledger
payloads.

---

## 6. Determinism

Fixed canonical epoch, time zone, locale, DST gap/fold fixtures and calendar
boundary fixtures. Seeded identifiers. Stable sorting and canonical
serialisation. No ambient `Date.now()`, `new Date()`, `Math.random()` or
uncontrolled timers in the transition engine. Separate injected clocks for
fictional scenario time and real local review metadata.

Replay proof: identical baseline plus identical ordered commands produces a
byte-identical canonical snapshot hash.

A scenario restart or checkpoint restore never rewrites or deletes a prior run.
The prior `ScenarioRunId`, its immutable snapshot and its append-only audit
ledger are preserved. Replay from earlier time always creates a new lineage
branch or a read-only reconstruction.

---

## 7. Technology decisions

Resolved 2026-08-16 from the npm registry and official documentation. Full
evidence in `docs/process/ledgers/research-ledger.json`.

| Concern | Choice | Version | Why |
|---|---|---|---|
| Framework | Next.js App Router | 16.3.1 | Static export target required by the master prompt |
| UI | React / React DOM | 19.2.8 | Satisfies next@16 peer range |
| Types | TypeScript strict | 7.0.2 | Fallback to newest 5.x/6.x recorded if strict-mode incompatibility appears |
| Styling | Tailwind CSS | 4.3.3 | CSS-first `@theme` token layer; no runtime style service |
| Runtime schemas | Zod | 4.4.3 | Section 3.2 mandates runtime validation, not compile-time typing alone |
| E2E / a11y | Playwright + @axe-core/playwright | 1.62.1 / 4.13.0 | Runs against the served `out`, not the dev server |
| Unit / component | Vitest + Testing Library | 4.1.10 / 16.3.2 | Kernel and component behaviour |
| Lint | ESLint | 10.8.1 | Prohibited-pattern enforcement |

Rejected with reasons recorded: `next-intl` (i18n throws under export),
Redux Toolkit (kernel is already a pure reducer), Storybook (the delivered
storyboard *is* the application; a second catalogue risks fixture divergence),
charting libraries (Section 14.1.1 requires accessible SVG with synchronised
text equivalents, which a canvas library would need rebuilt anyway), service
worker / PWA (Section 4.1 makes it a separate client decision), any CDN asset
(Section 4.3 forbids external-origin requests).

Node v24.12.0 · npm 11.17.0 · git 2.46.0 · darwin 25.6.0.

---

## 8. Visual direction — clean enterprise SaaS

Light neutral base, blue primary, conventional enterprise density. Semantic
token layers for colour, typography, spacing, radius, elevation, density,
z-index, breakpoint, focus, motion, status, chart and print.

Surface shells differentiate by density and chrome rather than by unrelated
branding — one AVIIXA design language across five surfaces.

Frontline retains its own treatment because Section 20.2 makes it an ergonomic
requirement rather than a style preference: large gloved-touch targets, high
contrast, shallow full-screen execution, persistent worker/device/run/package/
connectivity state, no precision or multitouch dependency, and no
productivity-surveillance visuals.

No client logo is invented. A neutral text wordmark plus local abstract
manufacturing illustrations are used.

Status colour is rationed and never load-bearing alone: every state carries an
icon and a text label as well as a colour, satisfying the non-colour-only rule
and forced-colours mode.

---

## 9. Accessibility acceptance

WCAG 2.2 Level AA for every in-scope route and state, with exact documented
exceptions rather than "oriented" language.

Landmarks, skip links, unique page titles, one clear primary heading, logical
heading order, route-change focus. Visible unobscured focus. Dialog and drawer
focus trap, Escape, return focus, history behaviour. Status live regions for
save, validation, offline, queue, command, notification, AI and recovery
changes. Error summary plus field-level association. Keyboard alternatives for
Workflow Builder drag-and-drop, diagrams, tables, timelines and reordering.
Target size, text spacing, zoom and reflow, forced colours, reduced motion.
English and Spanish accessible-name validation. Automated checks plus a
documented manual keyboard and screen-reader matrix.

---

## 10. Support-not-surveillance invariant

No worker pace timers, worker ranking or comparison, worker walls, per-worker
performance analytics, coaching or dismissal profiling, suitability scores, or
inferred productivity. Operations views default to cells, lines, Runs, shifts,
risk, work state, quality state and freshness. Worker identity appears only in
purpose-bound, role-authorised drill-down. Telemetry uses bounded counts and
states with no high-cardinality worker, run, lot, evidence or free-text labels.

Enforced as an automated adversarial gate, not a guideline.

---

## 11. Client-review mode

Separate from product UI and never presented as a committed production feature.
Story navigator, persona and surface switcher, source classification and stable
IDs, business-rule and cross-surface impact panel, approve / needs-change /
question / comment states stored locally, bookmarks, versioned review-package
export and import, printable summary, unresolved-decision register, coverage and
orphan dashboard, and a reset that removes only local review data after
confirmation.

A review action creates a `ReviewEvent` only. It can never create a product
`DomainEvent`, `AuditEvent`, notification, command, schedule or business-state
transition. Labels are "Approve storyboard behavior" / "Accept for client
review" — never anything resembling Workflow approval, Job approval, Quality
release, or production authorisation.

Review packages carry a payload-file manifest sorted by normalised relative path
with per-file byte length and SHA-256, hashed excluding the manifest's own
checksum field. Labelled as accidental-corruption and integrity detection —
never cryptographic authenticity, signer identity, or non-repudiation.

---

## 12. Inventory reconciliation

**Status: CLOSED.** The complete frozen source was read in 36 lossless chunks
(37 agents, zero errors, 122,242 lines covered exactly once). Full evidence:
`registries/generated/source-reconciliation.json` — 13 reconciliation rows,
66 invariants, 32 closed action sets, 42 state vocabularies, 45 residual
contradictions, 25 implementation risks.

Four of the master prompt's validation candidates turned out to be wrong. Per
Section 2 of the master prompt, the current frozen source wins.

| Inventory | Prompt candidate | Frozen source | Verdict |
|---|---|---|---|
| Surfaces | 5 | **5** | ✅ **CONFIRMED.** `AC-PROD-040` makes it build-blocking: *"exactly five surfaces exist; the tenant administration area is not presented as a sixth"* (L1614) |
| Human security role types | 9 | **9** (5 tenant + 4 platform console) | ✅ number confirmed, but **DERIVED, not SoW Fact**. Appendix L: *"Arithmetic over §3.5 and §8.8.2; the source states no combined figure"* (L119302) |
| Modules | 81 (19/19/18/13/12) | **81** canonical; 82 numbered `MOD-*` strings; 87 raw tokens | ✅ **CONFIRMED.** `MOD-SA-20` is an *alias-by-denial* — the string exists only in prose refusing it. §8.20 Fundability is *"a diligence narrative rather than a capability module… Counting it as MOD-SA-20 would put a slide deck in the build plan"* (L46330) |
| Business objects | 41 | **99** (`OBJ-001`…`OBJ-099`); 382 assembled `OBJ-*` strings | ❌ **CANDIDATE WRONG, NO SOURCE BASIS.** No count of forty-one objects exists anywhere. Every "forty-one" is something else — 41 tables (L3143, later corrected to 39), 41 captures in a fixture (L6182), 41 users in a blast-radius example (L46662) |
| Workflows | 81 | **644** `WF-*` strings (Appendix L: 642); ~118 parents | ❌ **CANDIDATE HAS NO REFERENT.** 81 is the module total and nothing else; no sentence in 122,241 lines assigns 81 to workflows. Build no "81 workflows" register |
| Events | 30 | **378** `EVT-*` strings; 29 numeric | ❌ **UNSOURCED.** Appendix L: the source enumerates operational events only in the Functional Specification, so this is the blueprint's derived set (L119320) |
| Command classes | 5 | **5**, closed | ✅ **CONFIRMED.** `AC-PROD-051` (L1680). One open edge: `DEC-CMDCLASS-001` — device wipe `CMD-SUSP-005` reaches the device but is not one of the five |
| Notification types | 15 | **19** states · **87** categories (`NOTIF-001`…`087`, 13 families) · 2 channels | ❌ **CROSS-REGISTER LEAK.** Fifteen is the *command* state count (L1632), not a notification number |
| Offline scenarios | 70 | **70** (`UC-OFF-001`…`070`) | ✅ **CONFIRMED.** Only 12 carry their own diagram; the other 58 name a representative |
| AI / fallback storyboards | 30 | two registers of 30: `SB-001`…`030` and `SB-AI-01`…`30` | ⚠ **AMBIGUOUS, must disambiguate.** The candidate names a count two distinct registers both satisfy |
| Anchored timer rows | 35 | **35** discovery findings; **24** buildable obligations | ⚠ **BOTH TRUE AT DIFFERENT SCOPES — BUILD 24.** 35 findings = 22 mapped + 13 non-obligations, + 2 independent = 24 deployable |
| Do-not-use-cron controls | 22 | **22** (`DNC-01`…`22`) | ✅ **CONFIRMED.** All 22 must still hold with every scheduler disabled |
| Mandatory candidate groups | 13 | **13** | ✅ **CONFIRMED** (L98544, `AC-SCHED-005-01`) |

### 12.1 Count-scope rules that must never be violated

- **81 is the module count and nothing else.** Minting an "81 workflows" register
  invents a deliverable the source does not have. The two numbers are never
  conflated and neither is evidence for the other.
- **Never mint `MOD-SA-20`.** A naive grep-driven scaffolder will create it,
  because the identifier does appear — inside the sentence that refuses it.
- **Never present the Studio 18 as source-backed.** `DEC-STUDIO-001` makes every
  Studio module count `Derived Clarification`. The honest statement is
  "19 + 13 + 12 + 19 SoW-Fact + 18 Derived = 81".
- **Eight role-adjacent registers must never be summed:** 9 role types · 1 root
  account · 10 personas · 14 non-human identity types · 9 temporary-grant types ·
  5 delegation-shaped mechanisms · 4 emergency mechanisms.
- **Band A / Band B splits inside DOH and SA are not separate modules,** and no
  interface may label the split.

### 12.2 Closed sets the interface must respect

Command Center operational actions — **ten**. Command Center absolute exclusions
— **four**. Command channel classes — **five**. Critical actions needing Root
approval — **ten**. Enforced platform invariants — **six**, locked with no off
position for any account including root. Named platform access classes —
**three**. Permission-matrix cell statuses — **nine**, and a blank cell fails the
build. Offline capability classes — **seven**. Capture types — **seven** plus
"none". Artificial-intelligence operating modes — **sixteen**. Artificial-
intelligence prohibitions — **twelve**. Fallback prohibitions — **twelve**.
Agent governance-binding values — **three**.

### 12.3 State vocabularies (exact, never collapsed)

Capture **13** · command **15** · notification **19** · handoff **12** ·
occurrence **15**. `AC-4830` asserts the word "synced" appears as a state name
nowhere in the product. "Sent" and "done" are likewise forbidden.

Run closing is `submitted → complete → finished`, and `complete → finished` is
**the one automatic transition on the entire platform**. Hold propagation is
`issued → propagating → in force` **per device**; "in force" is never shown until
every relevant device confirms, and **no force-apply control exists anywhere**.

### 12.4 The highest-risk implementation traps

Rendering an action as applied before device acknowledgement · building an
eleventh Command Center action (Chapter 25's own at-a-glance table already adds
one) · reading "and above" as a rank ordering rather than an enumerated grant ·
implementing lot release as "Quality Manager or higher" instead of Quality
Manager **only** · letting a timer, tier, agent, scheduler or the root produce an
approval — a gate item times out at 10 minutes (Severity 1) or 30 minutes and
then **never executes and never expires**, staying open and human-decided ·
clamping a looser-than-floor configuration value instead of rejecting it at point
of entry · breaking version pinning — a run pins its package at assignment and is
never re-based by any publication, adoption or rollback.

---

## 13. Build order — thirteen dependency-ordered vertical slices

Per master prompt Section 24.2. Each slice re-enters brainstorming for its own
design and specification approval before its plan.

1. Source and traceability contracts, design tokens, route shell, identity, deterministic kernel
2. Review shell, scenario controls, persistence, import/export, evidence capture
3. Platform bootstrap, platform roles, tenant onboarding, configuration
4. Tenant setup, users, Workers, qualifications, devices
5. Studio authoring through publication and package
6. Delivery Operations Hub Job, Run, assignment, official truth
7. Frontline online execution and capture
8. Offline, package, reconnect, command, conflict, convergence
9. Command Center monitoring and the closed action set
10. Notifications, schedules, audit, reports, handoff
11. Artificial-intelligence and no-artificial-intelligence paths
12. Platform controls, suspensions, incidents, support, recovery, archival
13. Exhaustive branch closure, visual baselines, client walkthroughs, release evidence

Slices 1–2 are authored directly by the controller because they freeze the shared
contracts every later slice depends on. Slices 3–13 are executed under
subagent-driven development, one bespoke module implementer at a time against the
frozen contracts, per APP-002.

Delivery is a single release at census close, per the client's selection. Status
remains `conditional` until the full census closes and never silently shrinks.

---

## 14. Binding census-closure commitment

Client instruction, 2026-08-16: *"make sure every user case workflows everything
should be covering"*. This is a scope reinforcement and is binding. Nothing below
may be sampled, represented, or deferred silently.

Every one of these inventories must close. "Close" means each entry is either
(a) reachable and behaviourally implemented, or (b) carries an explicit
`decision-blocked` or `not-applicable` record with reason, owner, and source or
decision evidence. A row in a coverage table is not implementation.

| Inventory | Extracted count | Closure requirement |
|---|---|---|
| Surfaces | 5 | all five, each with own shell, IA, navigation, landing per role |
| Human security roles | 9 | each with a complete login-to-logout journey, its landing route, every visible navigation group, every allowed and denied action |
| Modules `MOD-*` | 81 | each reachable, each with a bespoke module-specific screen body |
| Features `FEAT-*` | 534 | each reachable within its module |
| Sub-features `SUB-*` | 526 | each reachable |
| Functions `FUNC-*` | 990 | each with function card: purpose, actors, permission, validation, state transition, five-surface effect, happy path, applicable denied/failure/fallback/fallback-failure/safe/recovery paths, example, visual, acceptance, test |
| Business use cases `UC-*` | 330 | each with actor, goal, numbered user and system steps, object/state transitions, five-surface effects, branches, postconditions, and a linked executable workflow |
| Workflows `WF-*` | 118 | each with its own step-through storyboard entered from the Workflow Index, satisfying the story-step contract at every step. Membership in the 28-step spine never by itself counts a workflow as covered |
| Storyboards `SB-*` | 613 | each reachable |
| Screens `SCR-*` | 272 | each with a ScreenDefinition and every applicable state variant |
| Business objects `OBJ-*` | 99 | each with owner, states, relationships, projections, lifecycle |
| Events `EVT-*` | 28 | each emitted and traceable on the timeline |
| Commands `CMD-*` | 17 | each with full per-device delivery and acknowledgement lifecycle |
| Notifications `NOTIF-*` | 205 | each with trigger, recipients, channel, and its nineteen distinct states |
| Offline scenarios `UC-OFF-*` | 70 | each with five-surface knowledge, fallback, fallback failure, recovery. **Corrected from 99 on 2026-08-22.** Line 570 of this same document already said 70 and `registries/generated/offline-scenarios.json` computes 70 (`UC-OFF-001`…`070`, of which 12 carry their own diagram and 58 name a representative). The 99 was a stale census row contradicting this document's own reconciliation table, and it had to go before slice 8's coverage claims were computed against it. The identifier family is `UC-OFF-*`, not `OFF-*` |
| Scheduled work `SCHED-*` | 67 (35 anchored timer rows) | each through normal, missed, duplicate, late, DST, failure, recovery |
| Do-not-use-cron controls `DNC-*` | 22 | each rendered as a control that must not use a scheduler |
| Fallbacks `FB-*` | 671 | each with owner, exit condition, recovery |
| Failures `FAIL-*` | 87 | each with injection point and expected five-surface reaction |
| Audit classes `AUD-*` | 418 | each producing an audit event under its exact policy |
| Decisions `DEC-*` | 433 | each classified, none silently resolved |
| Acceptance criteria `AC-*` | 5,709 | each with a test or a source-linked decision-blocked record |
| Tests `TEST-*` | 5,700 | each mapped to a requirement |
| Validation dimensions `VD-*` | 31 | each a dimension an action is validated against — `VD-01` is "Required fields | Content | The action carries every field without which the record would be meaningless" (L71782). **Corrected from "Visual definitions … an interactive, keyboard-operable, source-linked application view" on 2026-08-22.** They are not views and nothing named "visual" should be built from this row; the interactive diagram catalogue is a separate obligation |
| Risks `RISK-*` | 85 | each in the readiness registry |

Two bidirectional closure gates run as automated tests:

- **Registry → application.** Zero entries without either a reachable rendering
  or an explicit decision-blocked / not-applicable record.
- **Application → registry.** Zero rendered routes, screens or controls that do
  not appear in the census.

The actionable-item census of master prompt Section 13.1 closes both ways.
Every inventory gets a browsable registry index screen with live counts and
per-item implementation status, drilling into the item's card, linked from the
coverage dashboard. A count that exists only in a report, without a browsable
index behind it, does not satisfy this section.

Status remains `conditional` until every row above closes. It is never reduced
to fit time or context.

## 15. Enterprise SaaS product quality

Client instruction, 2026-08-16: *"it should be like the saas enterprise
product"*. Binding. The storyboard must feel like a real shipped enterprise
product, not a wireframe walkthrough or a slide deck in a browser.

### 15.1 Product chrome, per surface

Persistent top bar with product wordmark and surface identity · tenant and
environment context · role-derived primary and secondary navigation with active
state · breadcrumbs · global search with a keyboard-invoked command palette ·
notifications bell with unread count and acknowledgement state · user menu
showing the simulated identity, role, scope and sign-out · contextual help.

Where a capability is not authorised for the current role, the chrome shows the
governed denial rather than an inconsistent partial hide.

### 15.2 Worklist and collection patterns

Saved views · column management with show/hide and reorder · density toggle ·
multi-select with bulk actions and a selection summary bar · sort · filter chips
with clear-all · faceted filtering · pagination or virtualisation sized to real
fixture volume · export simulation · row-level quick actions · keyboard row
navigation.

Every collection ships the full state set: loading skeleton, empty-with-guidance,
no-match-after-filter, populated, partially-selected, error, stale, offline,
permission-limited.

### 15.3 Object page patterns

Identity header with object name, stable ID, status pill, freshness and version ·
primary and overflow actions · tabbed or sectioned detail · related objects ·
activity and audit timeline · version history with comparison · inline
provenance showing authoritative owner versus projection.

### 15.4 Form and authoring patterns

Inline field validation with accessible error association · error summary at
submit · dirty-state navigation guard · explicit draft and save states ·
optimistic versus pessimistic feedback chosen per action and stated in the
ControlDefinition · confirmation dialogs naming the affected fictional objects
and the resulting simulated state · undo where the source permits it.

### 15.5 Feedback and motion

Toasts for transient confirmations, inline banners for persistent conditions,
live regions for assistive technology. Skeleton loaders rather than spinners for
structured content. Progress for multi-step operations. Motion is subtle,
purposeful, and fully disabled under reduced-motion.

### 15.6 Data realism

No lorem ipsum. No "Item 1 / Item 2". Fixture volumes large enough that
pagination, filtering, sorting and charts are genuinely exercised. Manufacturing
names, part numbers, lot codes, shift names, qualification codes and timestamps
that a plant person would recognise as plausible. The recurring Bright Bikes /
Riverside / Assembly cast runs continuously from platform bootstrap to archival.

### 15.7 Visual craft

A 4px spacing rhythm, a defined type scale, restrained elevation, and alignment
discipline. Clean enterprise SaaS: light neutral base, blue primary,
conventional density. Status colour rationed and never load-bearing alone —
every state carries icon and text as well as colour.

Frontline keeps its distinct large-target high-contrast treatment because
Section 20.2 makes gloved-touch ergonomics a requirement, not a style choice.

### 15.8 What enterprise polish must never buy

Polish never substitutes for behaviour. A control that looks production-grade but
does nothing is a defect, not a demo. Every visible control still satisfies the
no-dead-controls rule. The prototype-versus-production disclosure stays visible
and is never softened because the interface looks finished.

## 16. Honest limits

The Frontline surface rendered in Next.js is a client-review simulation of a
future native experience. It is not evidence that a native application, real
device commands, or operating-system-level offline controls exist.

Role simulation is a user-experience demonstration, not production security
enforcement, because all fictional fixture data ships to the browser.
Unauthorised values are nevertheless absent from the DOM and accessibility tree.

Browser persistence is best-effort. The exported review package, not browser
storage, is the portable review record.

No service-level agreement, production recovery objective, cryptographic audit
strength, native durability, server availability, production tenant isolation, or
regulatory compliance is claimed because a corresponding visual state was
simulated.

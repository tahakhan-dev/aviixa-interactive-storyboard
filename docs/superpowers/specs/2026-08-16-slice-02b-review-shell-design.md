# Slice 2b — Scenario Engine and Review Shell: Design Specification

**Status:** DRAFT — awaiting design approval
**Builds on:** Slice 2a, Candidate `b82d17a98a539730`, merged to `main`, 349 tests, `pnpm verify` exit 0
**Umbrella spec:** `docs/superpowers/specs/2026-08-16-aviixa-interactive-storyboard-design.md`
**Frozen source:** sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27` (no drift across two slices)

Slice 2a froze the contracts and storage. 2b builds the layer that drives them: the
one mutation entry point, the client store, scenario controls, and the client-review
shell. After this, slices 3–13 add product surfaces on a complete foundation.

---

## 1. The distinction this slice exists to protect

The frozen source has a review concept: the product's three-stage authoring chain,
Author → Reviewer → Release Authority, where the Reviewer must differ from the Author
and cannot edit, and nothing reaches a worker without explicit human sign-off at each
stage.

**This slice does not build that.** That is product behaviour, and it lands in slice 5
with Studio authoring.

What this slice builds is **client-review mode** — prototype tooling that lets a
stakeholder walk the storyboard and record what they think of it. It comes from the
master prompt, not the blueprint. The blueprint knows nothing about it.

Conflating the two would be the worst defect this slice could ship, because both are
called "review" and both have "approve". The separation is therefore not a convention
but an enforced invariant with its own gate:

> A client-review action creates a `ReviewEvent` and nothing else. It can never create
> a product `DomainEvent`, an `AuditEvent`, a notification, a command, a schedule, or
> a business-state transition.

Labels follow: **"Accept for client review"**, never "Approve". Nothing in review mode
may read like Workflow approval, Job approval, Quality release, or production
authorisation.

---

## 2. Architecture

```
Route and screen components
        ↓ read through role-aware selectors
ScenarioStore  (subscribes to CommittedTransition)
        ↑ publishes
PersistenceCoordinator            ← slice 2a, atomic single-transaction commit
        ↑ commits ProposedTransition
ScenarioCommandGateway            ← THE ONLY mutation entry point
        ↓ invokes
reduce()  (pure kernel)           ← slice 1
```

Review runs entirely beside this, never through it:

```
ReviewShell → ReviewStore → review object stores (separate from product stores)
```

`ScenarioCommandGateway` is the only path to a domain mutation. Components dispatch
through it and never call `reduce` or `commitTransition` directly. A gate enforces
this the way slice 2a's no-policy gate does — by forbidding the imports under `src/ui/`,
matching against comment-stripped source so prose naming the forbidden call cannot
trip it.

---

## 3. Scenario controls

Start clean · load the canonical story · previous and next step · jump to a phase or
stable ID · pause and resume autoplay · replay the current action · reset presentation
state only · simulate connectivity (online, slow, flapping, offline, dependency-down,
recovering) · advance the simulated clock · compare before and after · branch from a
checkpoint.

**Restart and checkpoint restore never rewrite history.** A restore creates a new
`ScenarioRunId` carrying explicit parent lineage. The prior run's immutable snapshot
and its append-only audit ledger survive as historical demo evidence. Replaying from
an earlier point always produces a new branch or a read-only reconstruction — never an
edit.

This mirrors the source's own evidence rule, which slice 2a already honours in the
persistence layer: immutability is established at the point of capture rather than
audited on afterwards, and every correction is an appended record that never alters an
original.

Presentation reset clears view state only. Review reset clears review records only.
Neither touches domain truth.

---

## 4. Review records

`ReviewRecord` carries: stable ID, anchor type and ID, surface, module, function,
route, screen, story state, reviewer label, status, severity, comment, requested
change, created and updated local-review times, disposition, response, source
fingerprint, scenario version, application build hash, supersession.

Statuses are `accepted-for-review` · `needs-change` · `question` · `comment`. None of
them is "approved".

Review records live in their own IndexedDB stores — `reviewRecords` and `reviewEvents`,
which slice 2a created and then removed as unwired. This slice restores them **with
writers**, which is why they were dropped rather than kept speculatively.

---

## 5. Review package export and import

A versioned package carrying the source hash, prompt hash, application build hash,
scenario schema and seed, fixture references, review records, decisions, bookmarks,
a coverage snapshot, and screenshot references.

Its canonical payload-file manifest is sorted by normalised relative path and records
each payload's byte length and SHA-256. The manifest is hashed **excluding its own
checksum field**, so the hash scope is never self-referential.

**Labelled honestly.** The checksum detects accidental corruption. It is not
cryptographic authenticity, not signer identity, and not non-repudiation. The interface
must say so rather than implying more.

**Memory has no export path at V1.** The source closes the data classes at seven and
states this plainly. The exporter must be structurally incapable of including memory
data, not merely omit it by convention.

Import validates before it previews: archive limits, normalised paths, content types,
runtime schemas, per-payload hashes, the non-self-referential package checksum, and
source/application/scenario compatibility. A mismatch **quarantines the original bytes**,
reports the exact failing entry with expected and actual values, and blocks preview,
merge and replace. A valid import still previews, deduplicates, offers explicit merge
or replace into the selected review workspace only, reports conflicts, and never
executes content or mutates domain state.

---

## 6. Evidence capture

After a successful commit, pure selectors derive an `ImpactProjectionDefinition` and an
`InteractionEvidenceRecord` candidate from the committed result, for reviewer inspection.

These are **read-only projections**. They are not product events, and they do not mutate
`ReviewState`. Only an explicit reviewer action creates a `ReviewRecord`.

---

## 7. Coverage made browsable — registry indexes and the Workflow Index

Client instruction, 2026-08-16: *"make sure it cover everything every workflow use
cases each and everything"*. Binding, and it changes this slice's scope.

The umbrella spec §14 already binds census closure across all 26 inventories. What was
missing is the layer that makes closure **visible** rather than asserted in a report.
Master prompt §9.6 is explicit: a count that exists only in a report, without a
browsable index behind it, does not satisfy the requirement.

These screens are reviewer-facing, so they belong here rather than deferred to slice 13.

**Registry index screens**, each with live counts and per-item implementation status,
drilling into that item's card: modules · features · sub-features · functions ·
workflows · business use cases · business objects · events · commands · notifications ·
offline scenarios · artificial-intelligence storyboards · scheduled-work items ·
actionable controls.

**The Workflow Index** lists every workflow with its stable ID, plain-language name,
owning surface and module, initiating and participating roles, primary objects,
implementation status, and variant coverage summary — filterable by each of those
dimensions. Its count reconciles to the umbrella spec §12 table.

**The coverage dashboard** carries separate counts for source-defined, derived,
recommended, illustrative, unresolved, implemented, intentionally not-applicable, and
decision-blocked. It links to every index. It never uses a green check to imply a
production control exists.

Every index is populated from the runtime-validated registries built in slice 2a, so a
count on screen and a count in the reconciliation come from one source. Status values
are honest: `demonstrated in storyboard`, `decision blocked`, `not applicable`,
`not represented` — never `implemented` where that would imply production capability.

Today most rows will read `not represented`, because slices 3–13 have not run. That is
the point: the dashboard shows the true state of the build from the first day rather
than appearing complete and quietly filling in.

## 8. Production-grade engineering — what it means, and what it does not

Client instruction, 2026-08-16: *"make sure it should be production level
implementation"*. Binding, with one boundary that is not mine to move.

**What is required, and is the standard for every line in this build:** exhaustive
error handling with typed failures rather than thrown exceptions; every failure path
tested, not just the happy one; no silent catch, no swallowed rejection; strict typing
with no `any` and no suppressed diagnostics; WCAG 2.2 AA on every route and state;
deterministic, reproducible behaviour; atomic persistence; every gate proven able to
fail; comments that state only what the code delivers; and no dead controls anywhere.
That standard has been enforced through two slices and does not relax.

**What is forbidden, by the master prompt and not by my choice:** this application has
no backend, and §29.4 prohibits claiming a production capability that was only
simulated. It must never imply a real database, real authentication, real device
commands, real integrations, a real scheduler, real artificial-intelligence providers,
or production audit guarantees. Section 4 makes the absence of a backend a hard,
testable constraint — the static-export build itself fails if a Server Action or API
route appears.

So the two readings of "production level" resolve cleanly and without narrowing scope:
**production-quality engineering, yes — that is the bar. Production-system claims, no —
those would be false.** A prototype that is honest about being a prototype, built to a
standard that would survive a production code review, is exactly what the master prompt
asks for and what a client-validation artefact must be.

Every screen carries the prototype-versus-production disclosure required by §21.2, and
polish never substitutes for behaviour: a control that looks production-grade but does
nothing is a defect, not a demonstration.

## 9. Also in this slice

The residual parked at the end of slice 2a, as the first task: `canonicalSerialize`
rejects a non-index array property with the message "Sparse array in state", which
misnames the cause. `Object.keys` returns three keys against a length of two, so the
hole check fires first. Split the check — non-index keys first, then compare the
remaining index keys against length.

Both live classes are already correctly rejected; this is diagnostic accuracy. It goes
first because it is small, it is in code every later slice depends on, and this project
has repeatedly found messages asserting something the code does not mean.

---

## 10. What slice 2b does NOT build

Product surfaces and module screens — slices 3–13. The product's Author → Reviewer →
Release Authority chain — slice 5. Screenshot generation and walkthrough runners —
slice 13. Service workers or offline shells for the prototype itself — a separate client
decision the baseline must not imply.

---

## 11. Testing

The separation invariant gets a dedicated gate: a review action must be provably unable
to produce a product event, audit record, notification, command, schedule, or state
transition. Proven by executing every review action and asserting the product ledgers
are byte-identical afterwards.

The gateway gate: no component may import `reduce` or `commitTransition`. Comment-stripped
matching, proven both ways — it fails on a real import and stays silent on prose naming one.

Scenario branching: a restore creates a new run ID with parent lineage and leaves the
prior run's snapshot and audit ledger untouched, asserted by hash.

Export and import: a tampered payload, a wrong package checksum, an incompatible source
hash, and an oversized archive each quarantine and block rather than partially apply.
Memory data is structurally unreachable from the exporter.

Every gate must be proven able to fail by planting a violation. This project has found
twelve tests that passed while the property they named was false, an inert
exhaustiveness gate, a gate defeated by letter casing, and a regex literal that blinded
four gates at once.

# Slice 2c — Spec Closure: Design Specification

**Status:** DRAFT — awaiting approval
**Builds on:** Slice 2b, Candidate `4e5d75398281277b`, merged to `main`, 562 tests, `pnpm verify` exit 0
**Closes against:** `docs/superpowers/specs/2026-08-16-slice-02b-review-shell-design.md` §3, §4, §5, §7
**Frozen source:** sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27` (no drift across three slices)

## 1. What this slice is, and what it is not

This slice **invents nothing**. Every item below was specified in the slice 2b
design, approved, and then not built. The final whole-branch review found the gap
and warned that undocumented it "will read to slices 3–13 as done".

So 2c is closure, not design. Each item names the spec section that already
governs it, and the acceptance criterion that proves it closed.

It runs before any product slice because eleven of them build on these contracts,
and because one item — a colour token — would otherwise replicate an
accessibility failure across 81 module screens.

## 2. The gaps, measured

### 2.1 `ReviewRecord` — spec §4

`ReviewRecord` currently extends `CreateReviewRecordInput` and adds `id` and
`createdAtLogical`. Ten of the twenty-one fields §4 names exist.

Missing: `module` · `function` · `route` · `screen` · `storyState` · `severity` ·
`requestedChange` · `updatedAtLogical` · `disposition` · `response` ·
`supersededBy`.

These are not decoration. `disposition`, `response` and `supersededBy` are what
make a review record part of a *conversation* rather than a one-way note — a
reviewer raises a change, someone answers, and a later record supersedes an
earlier one. Without them the export is a list of comments with no resolution
state, and the review lifecycle §11 describes cannot be represented.

**Acceptance:** all twenty-one fields present; `severity` is a closed set;
`supersededBy` referencing a record that does not exist is refused;
`updatedAtLogical` never precedes `createdAtLogical`.

### 2.2 Review package payload — spec §5

Four of eleven elements exist. Missing: `promptHash` · `scenarioSeed` ·
`fixtureRefs` · `decisions` · `bookmarks` · `coverageSnapshot` · `screenshotRefs`.

`coverageSnapshot` matters most: without it an exported package records what a
reviewer said but not what the build claimed at the time, so a package reviewed
against one coverage state cannot be told apart from one reviewed against another.

**Acceptance:** all eleven present and inside the manifest hash scope; the
checksum still excludes its own field; memory still structurally unexportable.

### 2.3 Import dedupe, merge, replace and conflict reporting — spec §5

Import validates and previews. It does not deduplicate, offer merge or replace,
report conflicts, or have any interface — while §5 repeatedly describes "the
interface".

**Acceptance:** a package containing a record already present is reported as a
duplicate, not silently doubled; merge and replace are explicit reviewer choices;
a record whose id matches but whose content differs is reported as a conflict with
both versions shown; rejected bytes are preserved.

### 2.4 Coverage dashboard count classes — spec §7

§7 requires eight: source-defined · derived · recommended · illustrative ·
unresolved · implemented · not-applicable · decision-blocked. Only the four-value
implementation-status vocabulary is counted.

These are **orthogonal** to implementation status: the first five classify what the
*source* says about an item, the last three what the *build* did with it. An item
can be source-defined and not-represented at once. Conflating them would lose the
distinction between "the source never specified this" and "we have not built it
yet" — which is the distinction a client most needs.

**Acceptance:** eight classes counted and rendered separately from the four-value
status; a zero renders as a zero; no class label implies production capability.

### 2.5 Scenario controls — spec §3

Missing: `startClean` · `loadCanonicalStory` · `compareBeforeAndAfter`.

**Acceptance:** `startClean` produces a new run id with no parent lineage and
leaves prior runs intact; `loadCanonicalStory` is deterministic — same seed, same
resulting state hash; `compareBeforeAndAfter` is pure and mutates neither side.

### 2.6 Workflow Index filters — spec §7

§7 requires the index filterable by each named dimension. The original deferral was
justified **because the index was empty**; 432 rows now render, so the
justification is gone.

**Acceptance:** filterable by surface, actor, status and collapsed-or-not; filters
compose; a filter that matches nothing renders the no-match state, distinct from
the empty state; filter state is presentation-only and never touches domain truth.

### 2.7 Composite registry keys — carried residual

The workflow registry deduplicates on the extractor's `id`. 325 of 725 raw entries
collapse into 32 rows — 199 behind a single `unnumbered` row. Slice 2b added an
honest on-page disclosure; it did not fix the collapse.

**Acceptance:** rows keyed on a composite of id plus source line, so two distinct
workflows at different source lines stop collapsing; the shipped row count rises
and is still labelled *extracted records*, never a workflow total;
`workflows.expectedCount` stays `null`; the disclosure adjusts to the new figures
rather than being deleted.

### 2.8 The `attention` token contrast defect — carried residual

Measured precisely. `StatusPill` renders its label in the tone colour on a
**10 % tint of that same colour over white**, not on white:

| tone | on white | on the rendered tint |
|---|---|---|
| `attention` | 5.02:1 | **4.39:1 — fails** |
| every other tone | passes | passes |

`--color-status-attention: #b45309` needs ≥ 4.5:1 at 12 px and delivers 4.39:1
where it actually renders. Slice 2b worked around it by using the `info` tone at
one site; that workaround is invisible and does not travel.

Slices 3–13 will use `attention` constantly — held, blocked, needs-decision — the
states where legibility matters most.

**Acceptance:** the TOKEN is darkened until it passes on the rendered tint, not the
call site; a test computes contrast against the composited background for **every**
tone, so this cannot regress silently; the slice-2b workaround is reverted to
`attention` once the token passes.

### 2.9 `/review/` page title — carried residual

The route is a client component and cannot export `metadata`, so it inherits the
layout's default title.

**Acceptance:** a server wrapper exports `metadata` around the client child; the
tab title names the page.

## 3. What this slice does NOT build

Product surfaces and module screens — slices 3–13. The product's Author → Reviewer
→ Release Authority chain — slice 5. Screenshot generation and walkthrough runners
— slice 13.

## 4. Testing

Every acceptance criterion above is a test. Every gate proven able to fail by
planting a violation.

Two lessons from earlier slices are binding here. **Probe the axis the contract
spans, not the one the implementation suggests** — this project has shipped four
defects found only because a later probe changed axis: synchronous versus
asynchronous, one argument position versus four, volume versus reload lifecycle,
and colour measured against the wrong background. **And compute a property
generically rather than enumerating known instances** — scoping the workflow
collapse fix to the two placeholder ids someone had already found would have left
thirty further collapses shipping undisclosed behind well-formed ids.

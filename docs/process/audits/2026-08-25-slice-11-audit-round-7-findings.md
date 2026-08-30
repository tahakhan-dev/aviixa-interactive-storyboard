# Slice-11 audit — round 7 findings

Authority APP-016 item 1. Candidate `SLICE11-3ee592fe2eac068e`, clean tree, chain exit 0:
typecheck 0 · lint 0 · gate-ordering 33/33 · freshness 3/3 · unit 6280/182 · component 3054/108 ·
build 102/102 · release 1000/33 · playwright 548. Frozen source re-hashed at session entry,
`47bd18db…`, unchanged.

Rounds 1-6 found 144 and the disposition record enumerates 141 rows, 140 CLOSED and one PARTIAL.
**The loop ends when a round finds nothing. It has not.**

**28 findings: 10 (stream A) + 13 (stream B) + 5 (stream C). Two Critical, both stream B.**
Counted from the headings below, not from a stream's header — round 6 got that wrong three times
in one register.

**Three of round 7's findings convict the controller's own work of this session**, and one convicts
the wave that was closing round 6 of re-committing the defect it was fixing. That is the round's
shape and it is worth stating before the findings: **the fix wave and the record-keeping around it
are now the densest source of defects in this build, and neither had a gate pointed at it until
round 6 built one.**

Every figure below was re-measured by the controller before this register was written, except where
a line says otherwise.

---

## Stream A — the round-6 wave, and the eighth stale dependent

**All seventeen round-6 findings verified closed on the product**, by an auditor who opened each
fix and re-derived its figures: the two split sentences and their derivation, the 2:1 disclosure
against L46193/L46178/L47835, the census exclusion against L13538/L41894/L42209/L73228, the
override record against L98508 and L98483-98506, the ownership scan replayed twice through the real
generator (raw 69/10/2, stripped 68/11/2, single mover `MOD-FL-A1`), both manifests re-hashed
1050/1050 and 87/87 clean with the file set equal to `git ls-files` minus the evidence roots in both
directions, the AC ratio re-derived at 799/440, and the not-real statement present on all 103 pages
with an empty exemption list. **One verdict does not survive: `R6-B03` is PARTIAL, not CLOSED.**

### R7-A1 · Important · the resealed manifest names the wrong commit, and the commit message says it names the right one

`product-candidate-manifest.json` records `git_commit 4b5caa3598f496d1`, which is HEAD's
**grandparent**. Commit `03453029`'s message states the field "names the commit the bytes were
measured against, which is this commit's parent". Both halves are false. Re-hashing the 1,050
certified entries against each candidate tree: `4b5caa35` match 1025 / differ 21 / missing 4;
`44e05412` match 1050 / differ 0; `03453029` match 1050 / differ 0.

Nothing asserts the field — `seal-manifests.mjs:162` writes `rev-parse HEAD` unconditionally and
`process-evidence.test.ts` cases 1-5 check paths, hashes, digests and ids, never the commit pointer.
**`R6-B04` was Critical because a manifest named a candidate that no longer existed; the reseal
fixed the hashes and left the locator wrong.**

### R7-A2 · Moderate · a paragraph saying two findings are open and unowned, two lines above the table recording them closed and owned

`2026-08-25-slice-11-audit-dispositions-rounds-1-6.md:307-310` reads "`R6-T01` and `R6-T02` … are in
no brief and nobody owns them … so they are recorded `OPEN` with `unassigned`". The table below
records both `CLOSED | MEASURED | controller`. Counted from the row grammar the gate itself uses:
141 rows, 140 CLOSED, 1 PARTIAL, zero OPEN.

This is the file master prompt §29.4 conditions 5 and 6 are evaluated from, and the gate cannot see
it: cases 6-12 parse the table rows, never the prose around them.

### R7-A3 · Moderate · `R6-B03` is closed on a third of its subject

The finding's subject was 210 source-derived records reaching nothing, measured as verbatim presence
in the payload-stripped export. Re-measured over all 103 pages: invariants 0/66 (gated by citation
instead, which is a legitimate substitute), closed action sets **0/32**, state vocabularies **0/42**,
residual contradictions 14/45 with 31 more disclosed as decision records, implementation risks
**0/25**. `grep -rn "closed_action_sets\|state_vocabularies\|implementation_risks" src app tests
scripts` finds no reader and no gate — only the zod field declarations.

**99 of the 210 records are in exactly the state the finding described**, and the disposition record
says CLOSED / MEASURED with no residue noted.

### R7-A4 · Moderate · the wave shipped R6-A01's own defect, on a client page, while closing R6-A01

`census-status-overrides.json`'s reason field, rendered on `/coverage/actionable-controls/`, states
"The register's **seven** columns are Functionality, Where it lives, Why a scheduled sweeper is the
wrong mechanism, The correct mechanism, What a sweeper may still legitimately do, and Source."
**Six named against a stated seven.** The frozen source at L98483 carries seven; the omitted one is
the `DNC-` identifier column, and the separator at L98484 is `|---|` seven times.

The sentence is new — `git show 4b5caa35:` has no "seven columns" clause. Fix stream T wrote it while
closing the two findings whose shape is a stated split that does not total the enumeration beside it.
The conclusion it supports ("not one of them is a control label") survives; the arithmetic a reader
checks does not. RESUME §8 repeats the phrasing.

### R7-A5 · Moderate · the eighth stale dependent, in a schema comment and a gate header

`src/registry/schemas.ts:123` and `tests/coverage/reconciliation-table.test.ts:32` both carry
"**3,010 of the build's 5,018 census rows**". Both figures moved with the census: functions 990 +
actionable-controls 627 + business-use-cases 330 + features 534 + sub-features 526 = **3,007**, and
the fourteen-registry total is **5,015** — confirmed by replaying the generator unmodified, which
prints "total 5015", and by the built page, which renders 5015 because it derives it.

A full-export scan for the stale figures returns zero hits, so no reader sees them; the next author
does, in both places.

### R7-A6 · Moderate · a manifest that declares it supersedes itself

`supersedes: "SLICE11-3ee592fe2eac068e"` is this manifest's own `candidate_id`.
`seal-manifests.mjs:169` reads `previous.candidate_id` with no guard, so any second seal on unchanged
bytes overwrites the predecessor with itself. The real predecessor, visible at `4b5caa35`, was
`SLICE04-b82f66e93567c0a5` — **the candidate `R6-B04` existed to retire.** The envelope has the
opposite defect: a hardcoded `'c276164c9eb96503 (slice 2b)'` that will never move.

### R7-A7 · Minor · the round-7 brief published a split it did not count

The brief states "143 CLOSED, one PARTIAL, none OPEN". The table holds 141 rows, 140 CLOSED, 1
PARTIAL. 143 + 1 = 144, the declared total — so the split was back-derived from the total rather than
counted. **Controller defect, and it is round 6's arithmetic shape for the fourth time.**

### R7-A8 · Minor · a gate that reds on the remedy its own subject prescribes

`process-evidence.test.ts` case 12 asserts `measured === 59` and `register === 82`. The disposition
file's closing section names the remedy for a `REGISTER` row: "re-measure and change the basis to
`MEASURED`". Doing that reds the gate. The same wave solved the identical problem correctly
elsewhere — `reconciliation-table.test.ts:1134` publishes its open bucket as a ceiling "that can
only be lowered deliberately".

**Round 6's gate-reds-on-success shape, third instance, in the file that repaired the first two.**

### R7-A9 · Minor · a ledger row citing a file that now says the opposite

`VER-S11-039`'s status reads "thirteen of round 6's fifteen [remain open], per
…dispositions-rounds-1-6.md". That file enumerates seventeen round-6 rows and zero open, and the row
also names candidate `SLICE11-7839aea4d840fdd1`, which exists in no manifest. The row is an honest
record of an interrupted moment; its citation points at a live file rather than a dated one.

### R7-A10 · Minor · a citation to a spec section that disagrees with the figure citing it

`build-registries.mjs:2241`, the generated `dedupRule`, and `descriptors.ts` all cite "spec §2.10"
for 605. §2.10's availability table reads `| actionable controls | semantic extraction | 608 keyed |`
and says nothing about excluding rendered messages. The next author reconciling the two re-derives
608.

---

## Stream B — the client-facing deliverables, never audited before

**Both Criticals in this round are here, and both are in the document a client is handed.**

### R7-B01 · Critical · the guide tells the client not to review eleven shipped screens

`docs/client-review-guide.md:78-82`: "`/command-center/` is a placeholder and one screen — the
sync-conflict review panel — is built. Its remaining twelve modules are the next body of work. **Do
not review the Command Center as a design; review the one built screen.**"

Measured: twelve route directories under `out/command-center/`; module statuses
`CC: {demonstrated-in-storyboard: 11, mounted-in-another-screen: 2}` — **zero unbuilt**.
`out/command-center/index.html` renders a twelve-screen rail and the word "placeholder" appears on it
zero times.

**This is the only instruction in the deliverable that tells the reviewer not to look at something,
and it withholds the live shift board, the governance gate queue and the agent activity panel from
the review they exist to receive.**

### R7-B02 · Critical · the guide's headline honesty figure, refuted by the page it cites

`:62` — "The blueprint's fourteen inventories hold **4,970 rows**. **237 of them are demonstrated by
a shipped screen today**, and seven more modules are mounted inside another module's screen."

`/coverage/` renders "Demonstrated in storyboard : 12 of 14 registries — **299 of 5015 items**" and
"Mounted in another module's screen : … **10** of 5015". Summing the fourteen registries directly
gives 5,015. **All three numbers are wrong, and the guide sells the paragraph as "the honest measure,
computed rather than asserted".** It is hand-typed.

### R7-B03 · Important · the by-surface table overstates unbuilt work seventeen to two

Measured against the guide: SA 19/0/0 (guide correct); DOH 17 demonstrated + 2 not-represented
(guide: 15, "four unbuilt"); STU 16 + 2 mounted (guide: "one unbuilt"); FL 6 + 6 mounted (correct);
CC 11 + 2 mounted (guide: "twelve unbuilt"). **The only unbuilt modules in the build are two** —
`MOD-DOH-17` Regulated-Industry Mode and `MOD-DOH-18` Standard Report Data Sets. The guide's table
sums to seventeen.

### R7-B04 · Important · the stated reason a walkthrough does not exist is false

`docs/walkthroughs.md:113` — "**The Client Command Center's other twelve modules.** `/command-center/`
is a placeholder. Twelve of its thirteen modules have no screen, so there is no walkthrough of a
supervisor's shift on the surface built for supervisors." Refuted by R7-B01's measurement. The two
client documents also contradict each other: `walkthroughs.md:56` calls Super Admin "the only surface
that is complete" while `client-review-guide.md:73` says Frontline is "all twelve built".

### R7-B05 · Important · three documents publish an 85-page export

Measured: `find out -name index.html | wc -l` → **102**; 668 files; 47MB; 102 PNGs at 243.7MB.
`client-review-guide.md:14` says 85 pages; `deployment.md:17` says "85 pages, roughly 24MB across 485
files"; `screenshots/README.md:20` says "173MB across 85 files". The manifest itself is current
(`capturedRoutes: 102`) and its gate is green — **round 6 fixed the artefact and left every sentence
describing it behind.**

### R7-B06 · Important · the README's own argument that its empty rows are benign is stale in every term

It says thirteen pages name no identifier, ten of them `/coverage/*`, and "`/command-center/` is the
one to watch: it is still the surface placeholder". Measured from the manifest: **eleven** pages,
**seven** `/coverage/*`, and `/command-center/` names 23 identifiers. `/review/` names none and the
accounting has no slot for it.

### R7-B07 · Important · a walkthrough step counting three prohibitions where the page renders six

`walkthroughs.md:63` sends the reviewer to `/super-admin/support-access/` for "**three prohibitions
on what support may never do**", and the walkthrough's closing line says "Step 4 is the one to read
slowly". The page renders six, each with its blueprint line, including the two strongest — the tenant
post-session report (L64828) and the tenant's inability to end a compliance-emergency session.

### R7-B08 · Moderate · the guide quotes a UI string no page renders

`:43` — "A tablet that has not reported in shows `Unknown while offline`, never `0`." Zero of 102
rendered pages contain that string. It is the **blueprint's** token, L35967, correctly cited in
`src/surfaces/cc/live/model.ts:485`; the shipped wordings are "pending captures unknown" and "unknown
as at the last successful sync", both on `/command-center/live-shift-board/` — the surface R7-B01
tells the reviewer not to review. It is the guide's own worked example of the honesty rule it asks
the client to police.

### R7-B09 · Moderate · the two client documents disagree about which surfaces are complete

`walkthroughs.md:56` — "the only surface that is complete". Measured, DOH at 17 of 19 is the sole
incomplete surface.

### R7-B10 · Important · the screenshot manifest carries one of §27.2's sixteen required fields

Present: `route`. Partial: `heading` (an h1, not a `SCR-*`), one global viewport rather than per row,
`identifiersOnPage` (read from the page, not the source IDs the capture evidences, and the 289 `AC-*`
are merged with 84 `MOD`, 124 `SCR`, 860 `FUNC`, 479 `FEAT` rather than carried as their own field).
**Absent: screenshot ID, persona, scope, story step, state, locale, theme, test, source hash, build
hash, baseline hash.** The file is `manifest.json`, not `screenshot-manifest.json`, and §27.2's
ordered canonical-story set — before, action, after, affected-surface, failure, fallback,
fallback-failure, safe-state, recovery — does not exist.

### R7-B11 · Important · the walkthroughs carry one of §27.2's thirteen required per-step fields

Every step is a two-column `| go to | look for |` row. Present: route. Partial: what the client sees.
**Absent: reset/checkpoint, persona, scope, action, expected validation, result, cross-surface
effect, decision prompt, failure branch, recovery, screenshot link** — `grep -c 'screenshots/'
docs/walkthroughs.md` → 0, so the 102 committed captures are reachable from no step. Of the
walkthrough types §27.2 names, absent are the executive walkthrough, the complete functional
walkthrough, the nine per-role login/landing walkthroughs, the per-surface module walkthroughs, the
one end-to-end continuous story, and seven of the eight branch walkthroughs. No
`WalkthroughDefinition`, no runner, no "Prepare client demo" control exists.

**This is slice-13 scope per RESUME §5 — and neither client document says so.**

### R7-B12 · Moderate · nothing asserts the walkthroughs run from cleared persistence

§27.2 requires every walkthrough tested from cleared browser persistence against the served export,
including refresh recovery and keyboard-only completion. No test reloads a page and no test walks a
walkthrough's ordered steps. What does hold: `axe.spec.ts` asserts per route that the first Tab press
focuses the skip link, and proves `/review/`'s controls keyboard-operable. **`/review/` is the one
route that persists to IndexedDB and is walkthrough 5 step 1** — exactly where cleared persistence
and refresh recovery would diverge in front of a client.

### R7-B13 · Moderate · the root cause: the one gate over these documents checks route strings

`walkthrough-routes.test.ts` is a sound gate with recorded plants, and all 21 routes it checks exist.
Its subject is route strings; it says so itself. **`client-review-guide.md` and
`screenshots/README.md` have no gate at all**, and nine stale claims accumulated in them under a
green chain. Round 6's shape at document scale: the gate is scoped to exclude the defect the artefact
actually has.

---

## Stream C — slice 11's product substance

**The absolute rule holds.** L89439 — cached guidance and deterministic rules never described as live
artificial intelligence — was checked three ways: every provenance mark emitted across the export is
`PROV-3` (31), `PROV-4` (18) or `PROV-6` (2), and **`PROV-1` is never emitted at all**; all six
rendered occurrences of "live artificial intelligence" are negations; and `resolveProvenance` puts
AC-42-403's fail-closed rule (L89480) inside the resolver so `PROV-1` is unreachable without both
identifiers. The twelve prohibitions transcribe verbatim from L87952-L87963 and
`prohibitionsWithoutRefusalEdge()` returns exactly `[3, 10, 11, 12]`, matching the eight refusal edges
at L87977-L87984.

**Verbatim transcription was swept mechanically at 1,900+ cells and is clean:** 570 storyboard card
fields, 130 of 150 five-surface cells verbatim with the 20 absence collapses already recorded in the
build, 900 failure-catalogue cells, 168 ability attributes, 144 mode-matrix and transition cells, the
17-line console authority table, and 174 of 175 `L<n> "quote"` pairs across `src/ app/ tests/
scripts/` (the one miss a false positive). **Master prompt §8.6.1's label-swap test passes with wide
margin:** across 21 screen pairs the maximum body overlap is 11% and most are 0-1%, and the shared
lines are the five-surface criteria and the degradation overlay, which are shared by design.

### R7-C01 · Important · a structural claim about the failure catalogue that the source refutes twice

`/coverage/` renders "The source spreads these across five registers in two zero-padding
conventions." Measured: all 214 `FAIL-AI-` tokens are two digits — **one convention** — and the
catalogue lives in **six** sections, §43.2.1 (L90100) to §43.2.6 (L90706), eighteen attribute tables.

**The two facts belong to the sibling family.** `FB-AI-` really does carry two paddings — 32
two-digit plus 18 three-digit = 50 distinct literals, which is the figure the `FB-AI-` row beside it
publishes, and §38.4.4 (L83755) confirms `FB-AI-001…010`. It is the neighbouring row's reasoning
pasted onto this one, and the round-6 common brief carries the same conflation.

### R7-C02 · Important · a separately classified extension rendered as V1 module content

`/hub/execution-summary-review/` mounts `QueuedRequestSurfaceMatrix` and `StateMachinePanel` — the
twelve-state worker-initiated artificial-intelligence-help request machine and its 12×5 surface
matrix. The frozen source classifies that state set at **L89727**: "The state set is
`User-Mandated Product Extension`", and the channel it presumes is itself an open decision
(`DEC-ASK-001`, L92730/L92732, option (a) being no channel at all).

Master prompt §18.3 requires those modes in a separately labelled extension preview, excluded from
implemented V1 coverage. Measured on the export: no page carries the words "extension decision
preview"; the Hub route names neither `DEC-ASK-001`, nor `DEC-AIHELP-001`, nor the classification;
and no `LIM-*` record covers it. **The storyboard cards on `/workflows/ai-and-its-absence/` do
disclose it** — `SB-AI-01` renders "this storyboard presumes a worker-initiated question channel,
which the Statement of Work does not describe" — so the same extension is honest on one surface and
undisclosed on another.

### R7-C03 · Moderate · a bilingual gap reported at one message where the chapter pins twelve

`/workflows/ai-and-its-absence/` renders a disclosure headed "TEST-44A-004 and the Spanish message
set" and reports a single gap, `SCR-FL-LOCK-01`. TEST-44A-004 (L92757) requires every storyboard's
worker-facing message set complete in both locales before release. Twelve of the thirty cards quote a
verbatim worker-facing string (L92797, L92880, L92964, L93045, L93133, L93225, L93734, L94572,
L94667, L94829, L94911, L94995) and **the source carries no Spanish for any of them**. The build
models the bilingual structure for one, so the gate's Spanish arm runs over a population of 1 of 12.

What is not wrong: pinning only `SCR-FL-LOCK-01` is correct — the paraphrase prohibition is stated
exactly once, at L94829/L94876/AC-44A-25-2.

### R7-C04 · Minor · markdown emphasis markers rendered to a reader

`/command-center/agent-activity-panel/` renders `**Deterministic safety is untouched.**` inside a
bare span, not a quotation — the four asterisks reach the reader. The sibling entry in the same
two-element array carries none, so the array disagrees with itself. C-41 established that a card
printing text strips markdown; this is that defect on the most consequential sentence on the screen —
what the deterministic layer still does during a platform pause.

### R7-C05 · Minor · two round-6 brief claims the source refutes

The common brief says `AIMODE-03`/`-15` and `-01`/`-16` are byte-identical across all five contract
columns. Reconstructing all sixteen rows from the build and comparing against L89356-L89371 — 16
byte-identical, 0 problems — **only 13/14 match on all five columns**: `-03` reads `Unavailable`
under Agent invocation where `-15` reads `Allowed with conditions`, and `-01`/`-16` differ on
Classification. The build already carries the correction and the brief does not. Its `FAIL-AI-`
bullet is R7-C01's defect in the brief that seeded it.

---

## What round 7 says about this build

Rounds 1-5 found defects in the product. Round 6 found that nothing was reading the evidence layer.
**Round 7 found that the fix wave and its record-keeping are now the densest source of defects** —
ten of the twenty-eight are provenance, arithmetic or citation defects in artefacts written during
the last two rounds, three of them by the controller, one of them a re-commission of the very shape
being fixed.

And the two Critical findings are in the document a client opens first. **The product held; the
paperwork describing it did not.** Both Criticals were invisible to a green chain for the same reason
`R6-B08` and `R6-B02` were: nothing derived the figure, so nothing could contradict it.

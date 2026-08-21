# Slice 6 — verification

**Verdict: GREEN on `pnpm verify`, with four open findings this verification found and nobody
had recorded, and seven of twenty-five declared traps carried by per-module tests rather than
by a gate.**

| | |
|---|---|
| Branch | `slice-05-studio-authoring` |
| HEAD measured | `8e1208c` — *chore: the browser suites serve a snapshot, not the live export* |
| Tree at measurement start | clean — `git status --porcelain` empty, 2026-08-21 11:46 UTC |
| Clean rebuild window | 2026-08-21 **11:47:06 → 11:56:12 UTC** |
| Registry regeneration | 2026-08-21 **12:05:44 UTC** |
| Citation re-measure | 2026-08-21 **11:58 UTC** |
| Tree at report time | `?? src/frontline/` — the concurrent `SURF-FL` agent, first seen 12:05 UTC. **Nothing measured below includes it.** |

**Source of truth, re-hashed rather than carried:**

```
$ shasum -a 256 ../AVIIXA_Production_Product_Blueprint.md
47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
$ wc -c  → 18565031      $ wc -l  → 122241
```

Matches the frozen record on all three: **no drift.**

Nothing in this verification was fixed. Two ambiguities in the brief are reported as
discrepancies rather than resolved silently (§7.1, §10).

---

## Check 1 — clean rebuild

```
$ rm -rf out .next && pnpm verify
...
=== VERIFY EXIT: 0 ===
```

| step | result |
|---|---|
| `pnpm typecheck` | clean |
| `pnpm lint` | clean |
| `pnpm check:gate-ordering` | clean |
| `pnpm test:freshness` | 1 file, **2 passed** |
| `pnpm test:unit` | 76 files, **2655 passed** |
| `pnpm test:component` | 55 files, **1954 passed** |
| `pnpm build` | exit 0, full static export |
| `pnpm test:release` | 12 files, **462 passed** (45.8 s) |
| `pnpm test:e2e` | **443 passed** (7.0 m wall, 4 workers) |

**Verdict: PASS.** Nine minutes end to end, zero failures, zero retries, no flake. The
`slice-2b-gates` timeout the closure task root-caused did not recur; neither did the
slice-03/04/05 timeouts. This ran while another agent was working in the tree, which is the
load condition under which those failures were originally seen.

---

## Check 2 — every Hub route in the export, exactly one `<h1>`, authored set = built set

```
$ find app/hub -name page.tsx  | sed 's|app/hub/||;s|/page.tsx||'   → 18
$ find out/hub -name index.html| sed 's|out/hub/||;s|/index.html||' → 18
$ diff  → the two sets are equal (the /hub/ root appears as page.tsx / index.html)
```

| route | `<h1>` | text |
|---|---|---|
| `/hub/` | 1 | Delivery Operations Hub |
| `/hub/devices/` | 1 | Device enrollment |
| `/hub/execution-summary-review/` | 1 | Execution Summary review |
| `/hub/integration-surface/` | 1 | Integration Surface (Tenant Side) |
| `/hub/job-approval-queue/` | 1 | Job Lifecycle and Approval — Job approval queue |
| `/hub/job-lifecycle-and-approval/` | 1 | Job Lifecycle and Approval |
| `/hub/journey/` | 1 | Job Lifecycle and Approval |
| `/hub/location-configuration/` | 1 | Location Configuration |
| `/hub/multi-area-job-pairing/` | 1 | Multi-Area Job Pairing — the paired scheduling view |
| `/hub/parts-registry/` | 1 | Parts registry |
| `/hub/permissions-roles-and-access/` | 1 | Permissions, Roles and Access |
| `/hub/qualification-calendar/` | 1 | Qualification Calendar |
| `/hub/run-scheduling-and-execution-oversight/` | 1 | Run Scheduling and Execution Oversight |
| `/hub/shift-management/` | 1 | Shift Management |
| `/hub/tenant-lifecycle-and-tier-operations/` | 1 | Tenant Lifecycle and Tier Operations |
| `/hub/tenant-view-of-platform-administration/` | 1 | Tenant View of Platform Administration |
| `/hub/worker-assignment/` | 1 | Assignment and substitution |
| `/hub/worker-lifecycle-and-qualifications/` | 1 | Worker Lifecycle and Qualifications |

**Verdict: PASS.** Eighteen of eighteen, one `<h1>` each. Two suites assert the same facts
independently and both are green: gate 6's *"the authored route tree and the built route tree
are the same set"*, and `axe.spec.ts`'s *"exposes exactly one level-1 heading"* over all 79
exported routes.

**One observation, not a failure.** `/hub/journey/`'s `<h1>` is *Job Lifecycle and Approval* —
byte-identical to `/hub/job-lifecycle-and-approval/`'s. The heading is derived from the step's
owning module and the page opens on step 1, so two distinct routes present the same page title
to a screen reader and to a browser tab. The check as written ("exactly one `<h1>`") cannot see
this; distinctness across routes is not asserted anywhere.

---

## Check 3 — coverage delta, MEASURED

Counted off the registry rows with one script on both sides. **Before** is `5d8b402`, the last
commit before slice 6's wave 0 (`acf9097`); **after** is a clean regeneration on `8e1208c`.

```
$ AVIIXA_REGISTRY_OUT=<scratch> pnpm build:registries
Demonstrated-in-storyboard rows: modules 50, features 1, sub-features 0, functions 14,
workflows 80, business-use-cases 2, business-objects 7, events 0, commands 0,
notifications 2, offline-scenarios 0, ai-storyboards 68, scheduled-work 2,
actionable-controls 4
```

| inventory | before (`5d8b402`) | after (`8e1208c`) |
|---|---|---|
| modules | 43/81 | **50/81** |
| ai-storyboards | 64/613 | **68/613** |
| workflows | 73/724 | **80/724** |
| functions | 13/990 | **14/990** |
| business-objects | 7/99 | 7/99 |
| actionable-controls | 4/630 | 4/630 |
| business-use-cases | 2/330 | 2/330 |
| notifications | 2/261 | 2/261 |
| scheduled-work | 2/67 | 2/67 |
| features | 1/534 | 1/534 |
| sub-features · offline-scenarios · events · commands | 0 | 0 |
| **TOTAL** | **211 / 4,970** | **230 / 4,970** |

**Numerator +19. The denominator did not move**, so unlike slice 5's delta these two fractions
are directly comparable: 4.25% → 4.63%.

The nineteen rows that flipped, all `not-represented` → `demonstrated-in-storyboard`:

```
modules         MOD-DOH-05 -06 -07 -08 -15 -16 -19      (the seven slice-6 Hub modules)
workflows       WF-AUT-010 WF-EXE-001 WF-EXE-002 WF-EXE-003 WF-EXE-005 WF-ORG-004 WF-QLT-005
ai-storyboards  SB-DOH-005 SB-DOH-017 SB-DOH-019 SB-DOH-028
functions       FUNC-DOH-07-2
```

### The committed artefacts are not stale

Verified twice and the tree was never edited to make it true. The in-tree `pnpm build` inside
`pnpm verify` ran `build:registries` at 11:52 UTC; `registries/` hashed byte-identical to its
pre-run state. A second, independent generation into scratch at 12:05:44 UTC via
`AVIIXA_REGISTRY_OUT` produced **all sixteen files byte-identical** to the committed ones.

```
same ./actionable-controls.json   same ./ai-storyboards.json   same ./business-objects.json
same ./business-use-cases.json    same ./commands.json         same ./doh/module-reach.json
same ./events.json                same ./features.json         same ./functions.json
same ./modules.json               same ./notifications.json    same ./offline-scenarios.json
same ./scheduled-work.json        same ./stu/module-reach.json same ./sub-features.json
same ./workflows.json
```

**Verdict: PASS**, and the generator is deterministic across two runs and two output roots.

**One thing that sits in `registries/generated/` and is not generated by that command.**
`source-reconciliation.json` is untouched by all three scripts (mtime 2026-08-20 21:25, while the
other sixteen are 2026-08-21) and is exempted **by name** three times in
`tests/coverage/slice-2c-gates.test.ts` (`:129`, `:208`, `:348`). A hand-maintained file living in
a directory whose name promises the opposite. Reported, not touched.

---

## Check 3b — the near-miss carried forward: does anything else in this slice fake a presence?

The closure task recorded that writing an honest disclosure paragraph flipped `WF-ORG-002` to
`demonstrated-in-storyboard`, because `scripts/build-registries.mjs:342` adds **every
identifier-shaped token a route screen names** to `citedTokens`.

**The fix holds.** `WF-ORG-002` reads `not-represented` today. The mechanism is verified rather
than trusted: the disclosure now names the workflow by its line, and the remaining string
`AC-WF-ORG-002-04` is swallowed whole by the token regex
`/[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+/g`, which is greedy from its capital.

**The mechanism is still live elsewhere, and it is worse than the report describes**, because
the walk reads **raw file text with no comment stripping**. An identifier named only in a JSDoc
comment marks its registry row demonstrated.

Measured. Of the **230 rows** reported `demonstrated-in-storyboard`, the id of **16** appears on
**no built route page** (62 route pages scanned; `/coverage/**` and `/workflows/` excluded
because they render the registry itself and the comparison would be circular):

```
ai-storyboards  SB-DEC-03  SB-DOH-017  SB-STU-06  SB-STU-11  SB-STU-14  SB-STU-16
                SB-STU-19  SB-STU-20
functions       FUNC-DOH-12-3  FUNC-DOH-13-1  FUNC-DOH-13-2
workflows       WF-EXE-002  WF-EXE-003  WF-EXE-005  WF-QLT-005  WF-SA-JBS-GRANT
```

**Five are slice 6's**, and each is the honest-sentence shape:

- **`SB-DOH-017`** — its only two mentions anywhere under `app/` are JSDoc comments:
  `app/hub/journey/composition.ts:367` and
  `app/hub/job-approval-queue/JobApprovalQueueScreen.tsx:38`, the second of which says the
  storyboard *"describes the queue and then describes what is NOT"* there. Comments do not
  render. The row is demonstrated on the strength of two code comments.
- **`WF-EXE-002`, `WF-EXE-003`, `WF-EXE-005`** — cited once, at
  `app/hub/journey/effects.ts:233`, as `workflowRef: 'WF-EXE-002 into WF-EXE-003 and
  WF-EXE-005'` on journey **step 6**, whose `ownerModule` is `MOD-FL-A3` and whose note opens
  *"Nothing on this step is an act of the Delivery Operations Hub."* An honest disclosure that
  three workflows belong to a surface this build has not shipped is the reason the coverage
  registry reports them as demonstrated on this one.
- **`WF-QLT-005`** — `effects.ts:340`, the same shape.

`JourneyScreen.tsx:167` holds the current step in `useState`, so the static export carries step
1's detail only; steps 2-9 are reachable in a browser and absent from the artefact. That is why
these four never appear in any `index.html`.

**And one token-truncation artefact.** `FUNC-DOH-07-2`'s only mention under `app/` is
`FUNC-DOH-07-2.2.1`, inside a comment at `app/hub/worker-assignment/fixtures.ts:167` that says
that function **prohibits** something. The token regex stops at the dot and cites
`FUNC-DOH-07-2` — a different row; the registry separately carries `FUNC-DOH-0702` and
`FUNC-DOH-07020001`. Unlike the five above, this id does happen to appear on the built page for
other reasons, so it is not "renders nowhere"; the *citation that produced the status* is still
a truncated read of a comment.

**Verdict: the specific near-miss was closed; the class was not.** Grade C2. This is the same
defect the generator's own `dedupRule` already admits — *"Naming includes naming an identifier
to record that the screen does NOT act on it, which this build has no structural marker to
separate"* — measured, and now with a count.

---

## Check 4 — accessibility, counted both ways

### Rule sets

`tests/accessibility/axe-policy.ts` passes **no `withTags`**. Every rule axe enables by default
runs — WCAG 2.0/2.1/2.2 A and AA **and** `best-practice` — and the split is made on the
*result*, into two separately-asserted buckets, plus `incomplete` asserted unconditionally as a
third. A best-practice violation is a real finding and is asserted; it is never reported to a
client as a WCAG 2.2 AA failure. Both harnesses import the one policy.

### What was covered

**By route, at the default state** — `axe.spec.ts`, 240 tests:

| | routes |
|---|---|
| Hub | 18 |
| Studio | 18 |
| Super Admin | 20 |
| everything else | 23 — `/`, `/404/`, `/_not-found/`, `/command-center/`, `/frontline/`, `/review/`, `/workflows/`, `/no-such-place/`, and 15 `/coverage/*` |
| **total** | **79** |

Three checks on each — axe scan, exactly one `<h1>`, skip link on the first Tab press — plus the
pin-still-present case, the list-is-not-a-stub case, and the `/review/` keyboard case.

**By driven state** — `axe-states.spec.ts`, **107 tests, all green**, three surfaces, three
blocks. Counted from the harness's own per-test log in this run, not carried:

| block | Studio | Hub | Super Admin | total |
|---|---|---|---|---|
| viewer-role scans | 126 | 72 | 54 | **252** |
| screen-state scans | 24 | 71 | 198 | **293** |
| toggle scans (flipped state + act outcome) | 13 | 28 | 4 | **45** |
| **driven subtotal** | **163** | **171** | **256** | **590** |
| positive-control clean scans | 2 | 2 | 2 | **6** |
| | | | | **596** |

Surfaces: Studio (8 personas), Hub (5 tenant roles), Super Admin (4 platform roles, in either of
two id schemes). States driven: Studio 9 of 12 declared, Hub 10 of 12, Super Admin 12 of 12.

> **The 584 figure is not reproducible, and the arithmetic behind it does not close.** The
> widening report's own breakdown (252 + 293 + 30 + 13 + 6) sums to **594**, not the 584 it
> states. Re-measured here: **596**. The stable part is 252 + 293 = 545; the variable part is
> the toggle block, where a toggle whose effect is visible on the page costs one scan and one
> whose effect appears only in an act's outcome costs two — 13 act-outcome scans in that run,
> **15** in this one. Nothing is wrong; the number simply is not a constant, and it was quoted
> as one.
>
> **The 23.1-minute figure is a sum of durations, not wall time.** `axe-states` logged
> **1,351.9 s** of test time across 106 timed cases here; the whole 443-test e2e suite finished
> in **7.0 minutes** wall on 4 workers.

### What was NOT covered — stated separately, and never as passing

- **25 of the 79 routes are driven on none of the three blocks** and are scanned at their
  default state only: the 23 non-surface routes above, plus the two Super Admin routes recorded
  in `unreachedRoutes` — `/super-admin/` and `/super-admin/trace-viewer/` — which carry no viewer
  control, so `proveLive` has nothing to prove the page live with. Both carry a written reason
  and the list is compared for **equality**, so a third such route goes red rather than emitting
  no test.
- **24 of the 54 driven routes carry no screen-state select** (state selects: Studio 3, Hub 9,
  Super Admin 18). They are scanned in every viewer role, in their default screen state only.
- **37 of the 54 carry no simulation toggle** — 17 do (Studio 6, Hub 9, Super Admin 2).
- **Five declared states are unreached**, recorded per surface with a reason each and asserted
  by equality in both directions, so a state cannot be quietly absorbed into the excuse list nor
  removed from the model to shorten it:
  - Studio — `STATE-09`, `STATE-10`, `STATE-11`
  - Hub — `STATE-10`, `STATE-11` (all nine Hub state selects omit them, while nine built Hub
    pages *name* them inside an applicable-states list)

  All five are driven on Super Admin, so the renderings exist in this build and two surfaces do
  not offer them. **A state that cannot be reached is unreached, not passing**, and this file
  carries that structurally.
- **`color-contrast` is allowed everywhere in the `incomplete` bucket.** This is the stated
  ceiling and it is a real one: a future colour pair axe also declines to compute would be
  allowed here too, and only `tests/unit/token-contrast.test.ts`'s numeric measurement would
  catch it. It is *not* a jsdom artefact — these scans run under real Chromium.
- **One pinned best-practice violation**: `heading-order`, one node, `/studio/training-library/`.
  The per-scan check is a **subset** rather than an equality, which is a genuine weakening; it is
  there because the defect is absent in two of eight personas (`StudioShell` renders an `h2`
  ahead of the module content for the Read-only Auditor and the Worker, completing a ladder the
  screen's three `h3`s skip). The equality lives at the route default instead, so the pin cannot
  outlive the defect. Repair is one `h3`→`h2` at `TrainingLibraryScreen.tsx:219`.
- **Keyboard operability is asserted on `/review/` only.** Every other route gets the skip-link
  check and nothing further.
- **`/frontline/` is scanned at its default state and is not in the driven surface model.**
  SURF-FL is being built concurrently.

**Verdict: PASS on the scans; the headline count was overstated and is corrected above.**

---

## Check 5 — the citation split, re-measured

```
$ npx vitest run --project release tests/coverage/locator-fidelity.test.ts \
    --reporter=verbose --disable-console-intercept
[locator-fidelity] 13594 citations in 327 files
  strong, verbatim quotation   853
  loose, absence checked only  21
  strong, identifier anchor    1960
  anchored but unproven (weak) 109
  weak, plausibility only      10781
Tests  91 passed (91)
```

| bucket | wave-0 close | measured 2026-08-21 |
|---|---|---|
| citations | 11,899 in 262 files | **13,594 in 327 files** |
| strong, verbatim quotation | 744 | **853** |
| loose, absence checked only | — | **21** |
| strong, identifier anchor | 1,806 | **1,960** |
| anchored but unproven (weak) | 100 | **109** |
| weak, plausibility only | 9,349 | **10,781** |

**+1,695 citations. Strong share 21.43% → 20.69%.** Every bucket grew; the proven fraction fell.

### The finding: the ratchet was not re-set, and it is 0.26 points from red

`BASELINE` at `tests/coverage/locator-fidelity.test.ts:1280` still holds the wave-0-close values.
The file's own rule, eighteen lines above it, is *"When a bucket genuinely grows, raise the
baseline in the same commit that grows it — that is the ratchet."* Slice 6 grew every bucket and
raised nothing. Measured consequences:

- With `EROSION_BAND = 0.005`, strong-by-quotation could fall from **853 back to 740** and the
  floor case would stay green — the whole of slice 6's gain, plus four.
- The proven-share check compares against `(744 + 1806) / 11899 = 21.43%` less a one-point band,
  i.e. a floor of **20.43%**. Today's share is **20.69%**. **Headroom: 0.26 percentage points.**

The doc comment at `:20-49` also still prints the wave-0 figures — the precise staleness the
comment two lines above it warns against (*"RE-DERIVED, never carried: the figures in this
comment were stale by 5,388 citations for two days"*).

**Verdict: PASS on the gate, C2 finding on the ratchet.** Not corrected here; correcting a
baseline during verification would be a fix nobody reviewed, and the number is the evidence.

---

## Check 6 — the three open decisions

`RUN_DECISIONS` (`src/surfaces/doh/modules/doh-06/matrix.ts:667`) = `DEC-RUNSTATE-001`,
`DEC-STUCK-001`, `DEC-FINISH-001`. Gate 2 asserts the length is three.

**Every reading renders on the built artefact.** Measured independently of the gate, by pulling
each reading's `text` out of the source and searching the exported HTML:

| decision | readings | renders |
|---|---|---|
| `DEC-RUNSTATE-001` | 3 | 3 of 3 — `out/hub/run-scheduling-and-execution-oversight/index.html` |
| `DEC-STUCK-001` | 2 | 2 of 2 — same page |
| `DEC-FINISH-001` | 2 | 2 of 2 — same page |

**No gate asserts a contested word as settled.**

- The contested words come from the data, not from a hand list: gate 2 asserts
  `CONTESTED_WORDS === ['submitted', 'complete']` and that the only undisputed row of the
  closing-state table is `finished`.
- `closingPosition` (`doh-06/matrix.ts:713`) returns `{ kind: 'disputed' }` for the span where
  the source's three Parts disagree. **There is nowhere in that function to put either word**,
  which is what stops a later consumer growing one.
- No assertion of the form `toBe('submitted')` or `toBe('complete')` exists for a run position
  anywhere in `tests/`. The single textual hit — `tests/component/sa-core-agents.test.tsx:170` —
  is a Super Admin *review* state in a different vocabulary.
- Gate 2 also holds the **bite site**: `SEEDED_RUNS` must still contain a hand-closed run, or
  `DEC-STUCK-001`'s disclosure would render nowhere and the gate goes red rather than the
  disclosure quietly dying.

**Verdict: PASS.** All three open, all seven readings on the built pages, nothing settled.

---

## 7. The twenty-one traps — how many are gated

### 7.1 The count in the brief does not reconcile, and the report says so rather than picking one

The plan's slice-6 **Traps.** block
(`docs/superpowers/plans/2026-08-21-replan-slices-05-13.md:471-562`) declares **26** traps —
**16 C1, 9 C2, 1 C3**. One C1 (MOD-DOH-18 rows 2/3/7) is marked *"Carried to slice 10 with the
module"*, leaving **25 in slice**.

The brief's "twenty-one" matches commit `54be047`'s subject line — *"twenty-one falsified
statements"* — which is the prose task's count of **on-screen statements**, a different set with
a different owner. Two numbers, one word. This report uses the plan's 26/25.

### 7.2 The gates

`tests/coverage/slice-06-gates.test.ts` — **10 `describe` blocks, 50 cases, 17 `PLANT` cases.**
Nine are the numbered gates; the tenth (*"one canonical tenant, several Area-id vocabularies"*)
is the detector the closure task added for the Area-vocabulary and fixture-clock drift. Task 14
reported 9 gates / 48 cases / 18 plants; the file has since gained one `describe` and two cases.

### 7.3 The mapping — **17 gated, 1 partial, 7 not gated, 1 out of slice**

Derived, not asserted: gate 1's subject is the union of three axes, and membership was checked
row by row against the shipped matrices.

**GATED (17)**

| # | trap | gated by |
|---|---|---|
| 1 | MOD-DOH-08 lot-hold release `Allowed` for QM (L28307) | gate 1 token axis (`release-a-severity-1-lot-hold` is `another-surface`) + gate 8 `CONTRADICTION-LOT-RELEASE-SURFACE` |
| 2 | …Supervisor "may request release with a note" | gate 8, same record — verified rendering on `/hub/execution-summary-review/` |
| 5 | MOD-DOH-06 close-a-stuck-run states Reading A (L27917) | gate 2 |
| 6 | MOD-DOH-06 closing-state table states Reading B as settled | gate 2 |
| 11 | catalogue B narrower than the matrices | gate 5 — derived, five screens / six narrowings |
| 12 | MOD-DOH-08 anomaly reclassification on the Hub (L28304) | gate 1 token axis + gate 8 |
| 13 | MOD-DOH-08 `Unavailable` means ABSENT (L28301) | gate 5 clause two, pinned by mutation |
| 16 | catalogue A gives "Job Owner" as a Primary role | gate 3 (22 references, four plants) |
| 17 | MOD-DOH-07 reassign from the Command Center | gate 1 token (`reassign-from-command-center`) |
| 18 | MOD-DOH-05 tag-to-qualification-set mapping | gate 1 token + divergence entry 1 |
| 19 | MOD-DOH-06 record-finish window / run-extension cap | gate 1 divergence entry 2, resolved **by locator** |
| 20 | MOD-DOH-06 pause or stop a run (L27916) | gate 1 held-by-nobody — verified: 4× `explicitly-prohibited`, Worker `not-applicable` |
| 21 | MOD-DOH-05 row 5 negative restatement (L27698) | gate 1 held-by-nobody — verified: `kind: 'restatement'`, five prohibitions |
| 22 | MOD-DOH-07 rows 6/8, no grant table (L28124/L28126) | gate 1 held-by-nobody (`check-availability`) + gate 4 |
| 23 | three sources disagree on how a deferral renders | gate 4 + gate 8 `DEFERRAL_RENDERING` (ruling, adopted, both not-adopted) |
| 25 | MOD-DOH-19 inline part add is a Studio act (L30071) | gate 1 token (`add-a-part-inline-during-authoring`) |
| 26 | catalogues A and B swap the queue and the detail | gate 8 `DOH_CATALOGUE_AB_SWAP` + gate 9 three-digit ban |

**PARTIAL (1)**

| 24 | MOD-DOH-06 auto-close scheduler: Hub dependency vs Super Admin column | The **control** half is gated — `Force a run to \`finished\` early` is prohibited in all five columns and so sits in gate 1's held-by-nobody axis. The **disclosure** half is not: `CONTRADICTION_AUTOCLOSE_OWNER` is not in gate 8's subject. It does render (measured), but nothing would notice if it stopped. |

**NOT GATED (7)** — real coverage, but per-module rather than surface-wide, and it rots with the
module rather than with the rule:

| # | trap | grade | pinned instead by |
|---|---|---|---|
| 3 | MOD-DOH-08 correction annotation gives the **Worker** `Allowed with conditions` (L28309) | C1 | `tests/unit/doh-summary.test.ts`, `tests/component/doh-summary.test.tsx`, and the route registry refusing the Worker |
| 4 | MOD-DOH-06 row 2 / MOD-DOH-07 row 7 — the same D11 breach (L27910, L28125) | C1 | `doh-run`, `doh-assignment`, and `HubShell` dropping the Worker |
| 7 | MOD-DOH-05 row 11 carries **two statuses in one cell** (L27704) | C1 | `tests/unit/doh-job.test.ts:128`, `tests/component/doh-job.test.tsx:127` |
| 8 | MOD-DOH-05 row 4 is a prohibition with a permissive escape (L27697) | C1 | `tests/unit/doh-job.test.ts:208` |
| 9 | **MOD-DOH-16 rows 4 and 5 contradict each other on the Tenant Admin** (L29616/L29617) | C1 | `tests/unit/doh-pairing.test.ts:256`, `tests/component/doh-pairing.test.tsx:100` — **and see §9: the disclosure renders on no built page** |
| 10 | MOD-DOH-07 "Supervisor and above" against DEC-PLUS-001 (L28122) | C1 | `tests/unit/roles.test.ts:42`, `tests/unit/evaluate.test.ts:314` |
| 14 | MOD-DOH-08 review toggle, forced on in Regulated-Industry mode (L28313) | C1 | per-module only; not in gate 1's subject (the row has an acting cell) and not in either disclosure register gate 8 reads |

**All seven ungated traps are C1.** That is the shape of the gap: the gates were written for the
rules that span the surface — a control drawn for an act met elsewhere, a decision left settled,
a role invented — and the traps that live inside one module's cell are held by that module's own
suite.

---

## 8. Which gates read the built artefact, and which read source text

Classified case by case over all 50 cases.

| what the case reads | cases |
|---|---|
| **only** the built artefact (`out/hub/**`, JSDOM-parsed) | **23** |
| **only** authored source text (walks `src/`, `app/`, comment-stripped) | **7** |
| **both** | **5** |
| **neither** — in-memory TypeScript registries and folds, or the real generator forked into scratch | **15** |

| gate | reads |
|---|---|
| 1 — no Hub control for an act met elsewhere | **built only**, 4 of 4 cases |
| 2 — the three open decisions stay open | built (5), built+source (2) |
| 3 — Job Owner is a field, never a role | built (3), source (3), in-memory (2) |
| 4 — no matrix-axis capability renders disabled | built (4), in-memory (2) |
| 5 — reach is derived, never hand-written | in-memory (4), built (1, the plant) |
| 6 — enumeration complete, registry matches the tree | built (3), built+source (1), source (1), in-memory (1) |
| 7 — the tie rule, both halves | forks `build-registries.mjs` over the real `app/` into scratch; touches neither `out/` nor `registries/generated` |
| 8 — every recorded disclosure renders | **built**, 3 of 3 |
| 9 — no three-digit literal, no blank cell | built (1), source (2), built+source (1), in-memory (1) |
| 10 — Area vocabularies and fixture clocks | source (1), in-memory (1) |

**The two sets do cover different things, and this slice has the worked example.** `DEC-STUCK-001`
was authored, mounted, and behind a branch the shipped fixture never reached: the source read as
if it rendered, and only gate 2's scan of `out/hub/**` could see that it did not. Every
source-only case in this file would have stayed green.

The reverse asymmetry is real too. Gate 3's `JOB_OWNER` ban and gate 9's three-digit-literal ban
each run **twice** — once over authored source (comment-stripped, so a mention inside a comment
stays green, and there is a plant proving that) and once over the built tree — because a token
can be present in one and absent from the other in either direction.

---

## 9. What nobody had: a live false-comfort defect, in a register the ninth gate does not read

The slice recorded that **three false-comfort defects** — a disclosure that exists in the data
and renders nowhere — landed in one slice, and that gate 8 was added to cover that class. Gate
8's subject, read out of `requiredDisclosures()`, is exactly:

```
DOH_08_CONTRADICTIONS      (2 records: CONTRADICTION-LOT-RELEASE-SURFACE,
                                       CONTRADICTION-RECLASSIFICATION-SURFACE)
DOH_CATALOGUE_AB_SWAP      (1 statement)
DEFERRAL_RENDERING         (ruling + adopted reading + 2 not-adopted readings)
```

It reads **one module's** contradiction register. The build has at least six more:

```
src/surfaces/doh/modules/doh-06/matrix.ts   RUN_CONTRADICTIONS          (3 records)
src/surfaces/doh/modules/doh-07/rulings.ts  UNRESOLVED_IN_SOURCE
src/surfaces/doh/modules/doh-16/matrix.ts   UNRESOLVED_IN_SOURCE
src/surfaces/doh/job-owner.ts               MOD_DOH_16_TENANT_ADMIN_CONTRADICTION
app/hub/*/fixtures.ts                       UNRESOLVED_IN_SOURCE × 9    (slices 4-5)
```

Every one of these was checked against the built export. Five of the six slice-6 registers
render in full. **The sixth does not.**

### `MOD_DOH_16_TENANT_ADMIN_CONTRADICTION` renders on no built page

`src/surfaces/doh/job-owner.ts:257`. This is the record for trap #9 — a **C1** — the one that
says MOD-DOH-16 answers the Tenant Admin column twice and the two answers cannot both hold.

```
$ grep -rl "answers the Tenant Admin column twice" out/hub/     → (nothing)
$ grep -rl "the flag routes to the paired Job"     out/hub/     → (nothing)
$ grep -rl "answers the Tenant Admin column twice" out/
  out/_next/static/chunks/0bm8tzrdght6e.js
```

The statement and both readings ship in the client bundle and appear in **no** `index.html`.

**Cause, traced rather than guessed.** `PairedSchedulingScreen.tsx:171` opens the screen as
`useState<TenantRoleId>('SUPERVISOR')`, and `jobOwnerAffordance`
(`job-owner.ts:330-333`) returns the `disclosed` kind only when
`role === MOD_DOH_16_TENANT_ADMIN_CONTRADICTION.column`, i.e. `TENANT_ADMIN`. The static export
renders the Supervisor view. The component tests that cover it call `viewAs('TENANT_ADMIN')`
first (`tests/component/doh-pairing.test.tsx:96`) and pass.

**Severity, stated honestly.** This is *weaker* than the `DEC-STUCK-001` defect it resembles:
that disclosure was unreachable, while this one **is** reachable — a viewer who selects Tenant
Admin sees it, and the driven accessibility sweep does put the browser into that state (it just
asserts nothing about the disclosure). So: **reachable, and absent from the artefact.** It is
also the C1 trap with the thinnest cover — ungated (§7.3, #9), and now shown to be invisible to
the gate that exists for exactly this class.

Reported, not fixed. The fix pattern already exists in this tree: `DEC-STUCK-001` was given a
page-level mount so that it renders at the default state as well as where it bites.

---

## 10. Open findings, by grade, checked against the code as it stands

**The count of reports in the brief is also off.** `.superpowers/sdd/2026-08-21-slice-06/` holds
**19** reports, not eleven — `task-01` … `task-14`, plus `task-axe-widening`, `task-closure`,
`task-debt-a`, `task-debt-b`, `task-prose`. All nineteen were read; every finding raised outside
its author's path list was re-checked against the tree at `8e1208c`, because two waves landed
after most of them were written.

### Closed — verified fixed, 13

| finding | verified by |
|---|---|
| prose §5.1 — `qualification-gate` registered with two owners, one of them false | `ownerModule` is now `DohCanonicalModuleId` and reads `'MOD-DOH-07'`; two owners in one string is a compile error |
| prose §5.2 — `worker-shift-meter` description self-contradictory under a "closed" heading | rewritten in the tense of the seam's status |
| prose §5.3 — `HubChrome.tsx:9` "the eight module screens" | the count is deleted, not corrected |
| prose §5.5 — `composition.ts:82` falsified block | corrected; `ComposedRoute.moduleId` is now `DohModuleId`, so the compiler is the proof |
| prose §5.8 — `/hub/permissions-roles-and-access/` renders `STATE-05` byte-identically to its default | e2e 443/443; the distinctness assertion is untouched |
| task-10 #1 — `SCR-DOH-11` carries two narrowings, the register held one | `NARROWING_ANCHORS` (`screens.ts:395-396`) now carries both, MOD-DOH-05 and MOD-DOH-15 |
| task-10 #4 — no Hub command for the clone act | `DOH_CLONE_JOB` minted |
| task-10 #5 — `JobRecord` carries no recurrence field | `recurrence?: string`, `objects.ts:118` |
| task-10 #6 — `doh-summary.test.ts:52` hardcodes one machine's home directory | resolved from `process.cwd()`; **no `/Users/` path remains anywhere in `tests/ src/ app/ scripts/`** |
| task-11 #1 — `screens.ts` says catalogue B "carries no row for MOD-DOH-16 at all" | corrected in place, with the old wording quoted so the record survives |
| task-11 #2 — no Hub command pairs or unpairs | `DOH_PAIR_JOBS` and `DOH_UNPAIR_JOBS` minted; `HUB_COMMAND_TYPES` is 15, not 12 |
| task-11 #3 — `doh-parts.test.ts` transiently did not compile | `pnpm typecheck` clean |
| task-12 — `src/studio/seams.ts` `parts-registry` still `ownerSlices: []` | the row is no longer unscheduled and says why |

### Open — 12, by grade

**C1 — 1**

- **`MOD_DOH_16_TENANT_ADMIN_CONTRADICTION` renders on no built page.** §9. New in this
  verification.

**C2 — 6**

- **The `another-surface` token still has three readings.** `src/surfaces/doh/modules.ts:88-150`.
  The remedy is written down and explicitly *"NAMED AND NOT TAKEN HERE"* (`:142`): a fourth
  member `another-screen`. Three divergences are registered and gate 1 gates the **consequence**
  on both the token axis and the axis the token gets wrong. Open by decision, with a detector.
- **`AC-WF-ORG-002-04` is unbuilt.** "An Area with no bound Shift cannot receive a Job" (L52600).
  Both halves of the input exist; nothing refuses. Now disclosed at the Job editor — the control
  that would refuse — rather than only next door. Declined as a build, deliberately.
- **Two platform-role id schemes across `app/super-admin/**`.** Nine routes use canonical
  `RoleId`s, nine use blueprint annotation tokens. They map one to one, so no user is harmed.
  Declined as a refactor; the existing "a third scheme goes red" claim was verified live rather
  than trusted.
- **Four Area-id leads and three fixture time bases.** Detected by the tenth gate, fixed by
  nothing. The worst member is `AREA-NEW-${n}`, minted at run time by
  `LocationConfigurationScreen.tsx:1019` — the build does not merely ship several vocabularies,
  it grows one more when a reviewer presses a button.
- **The citation ratchet was not re-set** after +1,695 citations; **0.26 points** of headroom on
  the proven-share floor. §Check 5. New in this verification.
- **Five slice-6 registry rows read `demonstrated-in-storyboard` whose ids render on no built
  route page**, four of them cited from comments or from a journey step the static export does
  not render. §Check 3b. New in this verification.

**C3 — 5**

- **`registries/generated/doh/module-reach.json`'s `doNotEdit` says "the eight module suites in
  tests/unit".** Measured: **9** unit suites read the reach rule (`doh-assignment`, `doh-cloning`,
  `doh-job`, `doh-pairing`, `doh-parts`, `doh-run`, `doh-spine`, `doh-sso`, `doh-summary`) and
  `derivedFrom` lists **15** modules. Emitted from `scripts/build-doh-module-reach.mjs:460`;
  `:12` carries the matching "the eight `app/hub/<module>/fixtures.ts` files" while `derivedFrom`
  now mixes `app/hub` fixtures and `src/surfaces` matrices. A wrong number, regenerated into a
  committed artefact on every build. (prose §5.6, still open)
- **`MODULE_REGISTRY_GAP.reachThisModuleWouldGet`** (`doh-06/matrix.ts:1085`) keeps a
  counterfactual field name for a value the same object's own prose now says is actual, and it is
  rendered indirectly at `RunSchedulingScreen.tsx:250` beside the sentence "so it is the same
  answer by the same rule". Cosmetic. (prose §5.7, still open)
- **"state contract L48007" is the table's `|---|---|---|` separator**; the header is L48006 and
  the section opens at L47996. By the standing rule that a span starts on the table header,
  L48006 is the locator. Left unchanged deliberately, because the string appears in a failure
  message two reports quote verbatim.
- **`FUNC-DOH-07-2` is demonstrated on a truncated token** read out of a comment that names
  `FUNC-DOH-07-2.2.1` and says that function *prohibits* something. §Check 3b. New here.
- **`registries/generated/source-reconciliation.json` is not generated by `build:registries`** and
  is exempted by name three times in `slice-2c-gates.test.ts`, while living in a directory called
  `generated`. §Check 3. New here.

---

## 11. What this slice knows about itself

Carried forward as the slice recorded it, with this verification's own standing beside each.

- **Twenty-two errors in the controlling agent's briefs.** The sharpest is not a miscount:
  `AC-DOH-014-2` at L25935 **constrains** disabled controls rather than permitting them, and the
  brief's "permits" is a contrapositive the sentence never makes — it would have licensed exactly
  the rendering the ruling forbids. Also: **two citations naming a region rather than a line**
  (`SB-DOH-017` given as "the L27840 region" when L27840 is a TEST id and the storyboard is
  L27805; row 4's routing rule given as "the L27676 region" when L27676 is the card's Name row) —
  a region always contains something, which is how a locator becomes unfalsifiable. **A count
  wrong by category** (three Area vocabularies counted as spellings when they are three *kinds*
  of lead, plus a fourth minted at run time; "four fixture clocks" counted files, not clocks —
  there are three time bases and two of the four files agree only by coincidence). **Two rows
  wrongly grouped** — the plan labelled two different MOD-DOH-08 rows "row 7" and two "row 13",
  and MOD-DOH-08 was the first wave-1 task and the largest matrix in the slice. **A correction
  that expired mid-wave** — the catalogue-B narrowing was corrected from four screens to five and
  the five became six narrowings once `SCR-DOH-11` was found to carry two. **A seam mechanism
  that was simply wrong** — the brief said `MOD-DOH-06` owed half of `qualification-gate`; it
  never did, both remaining enforcement points are the device's (L28112, L28136), and the
  difference changes the fix from "record a half-closed seam" to "the row should never have had
  two owners". *This verification confirmed the last one against the code and did not re-derive
  the rest from the blueprint.*
- **Five checks were found blind, every one by planting and not one by review.** Named across the
  reports: the token-trap walk vacuous on the shipped tree (all fourteen `another-surface` rows
  are refusals, so it had nothing to bite on); task 8's plant 4 leaving
  `inlineControlsOnAdjacentCapabilities` green on a row met elsewhere without a pointer; a
  `toContain('')` vacuity in a blank-cell check, written by an agent who had been warned about
  that exact trap; a fixture read from a constant instead of the fold, letting the refusal
  demonstration and the journey diverge; and gate 4's first draft matching `disabled` as a
  **substring**, reading Tailwind's `disabled:opacity-50` class as sixty disabled controls.
  *Reported as five; I verified the mechanism of the last in the code and re-planted none of
  them. See §12.*
- **Three false-comfort defects in one slice** — `DEC_FINISH_001.onScreen` unmounted for a wave,
  a contradiction recorded and surfaced nowhere, and `DEC-STUCK-001` behind a branch the shipped
  fixture never reached. **The gate added for that class reads one module's register.** A fourth
  member of the class is live today: §9.
- **The near-miss: an honest sentence created a false presence.** Closed for `WF-ORG-002`, open
  as a class, with a measured count: §Check 3b.

---

## 12. Unverified, and why

- **No plant was re-run.** Every "the gate goes red under its plant" claim in this slice is the
  authoring agent's measurement, not mine. Re-planting means mutating files another agent is
  building in, and a fix or a mutation made during verification is one nobody reviewed. The 17
  `PLANT` cases do run inside `pnpm test:release`, which passed 462/462, so the plants
  self-execute — what is unverified is only whether each plants what it claims to plant.
- **Gate 1's `held-by-nobody` axis count (18 rows, per task 14) could not be reproduced
  statically.** Several matrices build their cells through helper spreads (`...cells(...)`,
  `PROHIBITED`) rather than literals, so a text parse under-counts — it found 5. Membership was
  verified by inspection for the six rows the traps in §7.3 turn on (`pause-or-stop-a-run`,
  `force-a-run-to-finished-early`, `approve-a-job-the-same-identity-created`,
  `check-availability`, and two more), and the gate asserts the axis non-empty at run time.
- **The "twenty-two errors in the briefs" were not re-derived from the blueprint.** Only the ones
  leaving a trace in the code were checked (§11). Re-reading twenty-two locators in an
  18.5 MB source is a second slice's work, not a verification pass.
- **The nine `UNRESOLVED_IN_SOURCE` registers under `app/hub/*/fixtures.ts` were not checked
  against the built tree.** They are slices 4 and 5's and outside this slice's scope; the same
  method that found §9 would apply to them and may find more.
- **`/frontline/` was scanned at its default state only** and SURF-FL is not in the driven
  accessibility surface model. `app/frontline/page.tsx` is tracked at `8e1208c` as a placeholder;
  `src/frontline/` appeared untracked at ~12:05 UTC, after every measurement above.
- **The 16 rows whose ids render on no built route page (§Check 3b) are a lower bound on false
  presence, not an upper one.** Appearing on a page is necessary and not sufficient: `SB-DOH-005`
  renders on three Hub pages, but only inside a paragraph disclosing that three sources disagree
  about it. Whether that counts as "demonstrated in the storyboard" is a question this build has
  no structural marker to answer, which is the generator's own recorded caveat.
- **`docs/process/2026-08-22-slice-06-verification.md` is dated 22 August by the brief; every
  measurement in it was taken on 2026-08-21** between 11:46 and 12:08 UTC.

# Slice-11 audit — findings register

Authority APP-016 item 1. Round 1. Severity: **Critical** ships a falsehood to a reader or
is a gate that cannot fail · **Important** a real gap or a stale claim · **Moderate** ·
**Minor**.

Every finding below was re-measured by the controller against the frozen source or the
tree before being entered. An agent's count is a hypothesis (§7: three times an agent
checked a controller figure and found it wrong — the converse holds too).

## Round-1 findings

### C-00 · Critical · process — wave 5 closed on a chain that omits `pnpm test:e2e`

RESUME §8 records wave 5's close as "typecheck 0 · lint 0 · gate-ordering 26 of 26 ·
freshness 2/2 · unit 6159 · component 3017 · release 837 in 26 files". **No e2e figure.**
The 535 in the wave-1/2 record predates waves 3-5. Measured this session: **539 tests, 4
failed**. The slice was reported verified on a chain that never ran the suite which catches
route-level defects — and all four failures below are the classes it exists to catch.

Correction: slice 11 is NOT closed. `pnpm verify` chains e2e last; wave 5 ran the steps
individually and stopped before it.

### C-01 · Important · `/super-admin/ai-incidents/` offers no viewer control

`tests/accessibility/axe-states.spec.ts:433`. The gate is an equality both directions and
it is right. Slice 11 shipped the route; every other Super Admin route offers the role
select. Fix is the control, not a row in `unreachedRoutes` — the wave-2 finding of the same
shape resolved that way.

### C-02 · Important · `AiDegradationOverlay` opens at `h3` and assumes an `h2` above it

`src/ai/five-surface/AiDegradationOverlay.tsx:313`, caught at
`tests/accessibility/axe-states.spec.ts:696` as `heading-order` on
`/hub/execution-summary-review/` in role `WORKER`. The overlay is mounted as a page-level
sibling of the screen at all ten of its mounts; in roles where the host screen renders no
`h2`, the document goes `h1` → `h3`.

### C-03 · Important · `StoryboardCard` gives every card two NAMED section landmarks

`src/ui/shared/StoryboardCard.tsx:161` and `:192`, caught at
`tests/accessibility/axe.spec.ts:89` as `landmark-unique` on
`/workflows/ai-and-its-absence/`. "Five-surface reaction" and "Audit trail and
reconstruction" repeat once per card down a thirty-card index. One fix at the shared
component covers all thirty.

### C-04 · Moderate · the Super Admin console gate hardcodes 19 links

`tests/e2e/sa-console.spec.ts:50` expects 19; the console emits 20 since `ai-incidents` —
deliberately a non-module route, per `app/super-admin/ai-incidents/page.tsx` — joined the
index. Derive from the module registry and account for declared non-module routes. Do not
renumber 19 to 20.

### C-05 · Critical · `StoryboardCard`'s stated abstention outlived its truth (audit B)

`src/ui/shared/StoryboardCard.tsx:63-68` reads "Measured on this tree: nothing under `app/`
renders this component… the first route to mount a storyboard closes this paragraph."
Controller-verified: mounted at
`app/workflows/ai-and-its-absence/AiAndItsAbsenceScreen.tsx:392`, route
`app/workflows/ai-and-its-absence/page.tsx:26`, linked from `app/workflows/WorkflowIndex.tsx:210`.
Tasks 16-18 (`efe424a`, `910fdf0`, `1553c2d`) mounted it and none came back for the
paragraph. **This is the ProvenanceMark defect recurring inside the slice that closed
ProvenanceMark**, and nothing gates it: `grep -rn "StoryboardCard" tests/` finds no
reachability assertion.

### C-06 · Critical · a rendered count that is wrong by one, against the source and against the build's own data (audit B)

`src/surfaces/doh/modules/doh-06/matrix.ts:953` renders "Thirty-eight of the sixty cells
carry the token with no qualifying clause", reaching
`app/hub/run-scheduling-and-execution-oversight/`. Controller-measured from the frozen
source, L27909-27920 parsed as a table: **12 rows × 5 roles = 60 cells · 45 carry
`Explicitly prohibited` · 37 bare · 8 qualified.** The build's own transcription agrees at
37 (`grep -c BARE_PROHIBITION` = 38, of which one is the import). Remove the number rather
than renumber it; the screen can derive it.

Scope note, from audit B and worth keeping: this entered in `8a948a8` (slice 6), not slice
11 — slice 11 only renamed a field in the file. It is still a falsehood on screen today.

### C-07 · Important · the Frontline abstention rests on a false premise (audit B)

`src/frontline/ai-degradation.ts:68-73` says "There is no Frontline route among the eight
route directories this task extends, and there is no `app/frontline` module route to hang a
surface overlay on". Measured: `app/frontline` holds **7** `page.tsx` routes, all predating
slice 11, and slice 11 itself hung Frontline AI-degradation content on one of them
(`app/frontline/run-player/page.tsx:9` → `FL_B8_ROUTE_PANEL` → `CoachingPanel.tsx:986`).
The paragraph's second half is true and stands on its own.

### C-08 · Important · the gate over that abstention asserts a banner, not the claim (audit B)

`tests/unit/ai-five-surface-overlays.test.ts:746-749` asserts the file contains the string
`REACHABILITY, STATED`. It passes on any prose under that banner, true or false — which is
how C-07 shipped. Its `describe` title repeats the falsehood. Assert the claim: no file
under `app/frontline/` mounts `AiDegradationOverlay`.

### C-09 · Moderate · two literal counts beside the derived version of the same number (audit B)

`src/ai/requests/StateMachinePanel.tsx:109` and `:183` write "nineteen" while `:138` renders
`{QUEUED_REQUEST_TRANSITIONS.length}`. All three agree today at 19. The defect is
structural: two stored copies of a number the same screen derives.

### C-10 · Minor · the slice-11 orphan sweep's population is narrower than the slice (audit B)

`tests/coverage/slice-11-gates.test.ts:111-129` builds `SLICE_11_FILES` from three swept
roots plus eleven named leaves; four changed `src/` files fall outside it
(`frontline/modules/fl-b8/degradation.ts`, `studio/journey/effects.ts`,
`surfaces/doh/modules/doh-06/matrix.ts`, `ui/shared/journey.ts`). All four are reachable
today, so nothing hides there — but a grading population narrower than its subject is
defect shape 10 waiting for the next file.

## Brief corrections issued by the auditors

- **"Two of the five surfaces have no source table at all"** is wrong as written. All five
  overlays carry at least one table; only the Super Admin console has no transcribed one.
  The Hub carries `DOH_FAILURE_FAMILY_TABLE` with `headerRef: 'L90905'`. Accurate claim:
  *no per-module source table*.
- The slice range `562f89a..HEAD` is **27** commits and **111** files (59 code), and
  `git log --name-only` alone undercounts it by 2 against `git diff --name-only`.

## Round-1 findings, audit C — gate integrity

### C-11 · Critical · the absolute-rule gate passes on the exact sentence it forbids

`tests/component/ai-incidents-console.test.tsx:741-750`. The guard is
`expect(sentence).toMatch(/never|not|no/i)` and **`no` is not word-bounded**.
Controller-verified by execution: `/never|not|no/i.test('Live artificial intelligence is
now monitoring this incident.')` returns `true`. "now", "nothing", "note", "known",
"normal", "diagnostic" and "announce" all satisfy it. This is the gate on L89439 for the one
console whose every cell is a transcribed deterministic rule.

Three further holes in the same eight lines: no positive control that any sentence was
produced; the splitter `[^.]*\.` drops a final run with no trailing period; and
`document.body.textContent` cannot see `aria-label`/`title`/`alt` — the blindness already
recorded against a stale-count gate in this build. Corrected shape: an offender list
asserted `toEqual([])` with a synthesised positive control, which
`slice-11-gates.test.ts:601-614` already uses for this same rule.

### C-12 · Critical · "a close control that cannot close" never looks at the close control

`tests/component/ai-incidents-console.test.tsx:191-203` asserts the checklist exists, two
locators, L89965's text, that nothing operable matches `/close (the )?incident/i`, and that
the text says "outstanding". Deleting the `LockedControl` at
`AiIncidentConsoleScreen.tsx:752-758` leaves it green — and makes its one real assertion
*easier* to satisfy. `RECONCILIATION_CLOSE_CONTROL` is asserted nowhere else. Assert
presence **and** inertness together.

### C-13 · Critical · three drifted copies of one symbol list, and the tree-wide one is missing two

`tests/coverage/slice-11-gates.test.ts:785-792` (6 entries) against
`tests/unit/ai-failures.test.ts:504-512` (7) and
`tests/component/ai-degradation-overlays.test.tsx:367` (2). The tree-wide copy omits
`severityBand` and `SEVERITY_CATALOG_DISTRIBUTION`, and `\bseverityBand\b` does not match
`severityBands`, so the omission is real. Two live components carry the omitted symbols and
score zero hits on the gate's six: `fl-a5/DetectionAndContainmentPanel.tsx:87` and
`platform-settings/PlatformSettingsScreen.tsx`. One exported list, imported by all three.

### C-14 · Important · the hoisted widening-annotation check lost coverage in the move

`tests/coverage/absence-sweep.ts:172`/`:202`. The copy it supersedes
(`slice-2c-gates.test.ts:434-437`) matched `readonly T[]` **and** `ReadonlyArray<T>`; the
hoisted filter is `/: *readonly /`. `export const AI_MODE_IDS: ReadonlyArray<AiModeId> = [`
widens the union and reports zero offenders. This is the obligation that caught a real
slice-11 defect through slice-09's copy (`018b390`).

### C-15 · Important · the import resolver reads single-quoted specifiers only

`tests/coverage/slice-11-gates.test.ts:834`. Direction matters: for gate 12 a missed edge
reds (fail-safe); for gate 6 it shrinks the closure and goes **green**. Gate 6 also enqueues
only `.tsx`, so anything mounted through a `.ts` barrel is outside every closure. The
sibling resolver at `ai-incidents-console.test.tsx:786` uses `['"]` correctly.

### C-16 · Important · gate 4 enforces "labelled", in English, exact case, and states no limit

`tests/coverage/slice-11-gates.test.ts:545-594`. L89439 forbids "labelled **or described**
… **in any locale**". The predicate is `m.text.includes(label)` on two capitalised English
strings. The tree writes the phrase lowercase 26 times and ships rendered Spanish. The
narrowing is defensible — case-insensitivity would convict the 26 negations — but gate 5
asserts its own limit as a live expectation and gate 4 does not.

### C-17 · Important · two membership allowlists with dead entries

`ALLOWED_IMPORTS` (`ai-failures.test.ts:486`) carries `'./catalogue'`, imported by nothing.
`EXEMPT_CLOSED_VOCAB_NAMES` (`slice-2c-gates.test.ts:398`) carries `ROUTES`, which is
`= SURFACES.map(` and so can never match `DECL_RE`'s `=\s*\[` — a permanently dead
exemption. Neither list has a live-check, so both can only grow. The corrected shape ships
five times in this slice (`KNOWN_PARAPHRASE`, `KNOWN_UNREACHABLE`, `STANDING_VIOLATION`,
`STRICT_ANCHOR_ALLOWANCE`, `PROBE_*_EXEMPT`) — equalities that retire themselves.

### C-18 · Moderate · eight gates that pass for a reason other than the one they name

`ai-prohibitions.test.ts:263-270` (asserts prohibition *numbers* unique, never touches
edges) · `slice-11-gates.test.ts:245` (the one closed vocabulary held by a bare
`toHaveLength(21)`, its companion a self-comparison) · `ai-rollback-taxonomy.test.ts:130`
(claims "every spelling JSX allows"; misses a JSX expression child and `title`/`value`/`alt`)
· `ai-and-its-absence-route.test.tsx:162` (iterates only cards that still declare, so a
dropped declaration shrinks the set) · `ai-incidents-console.test.tsx:247` (no non-emptiness
control) · `slice-11-gates.test.ts:1132` (a weaker case wearing a stronger title; the claim
is enforced elsewhere) · `coverage-uninventoried.test.ts:170` (stateful `/g` regex
`.test()`; passes on the disjunct, not the half its message names) ·
`slice-11-gates.test.ts:733` (writes into a real `out/**/index.html` and restores in
`finally` — a crash leaves the shipped export corrupted).

### C-19 · Moderate · a task-scoped gate keyed on a hand-written file list

`ai-degradation-overlays.test.tsx:348-366` hard-codes eleven paths with nothing asserting the
list equals the task's file set. A twelfth file under `src/ai/five-surface/` is silently
unscanned.

## Round-1 findings, audit E — the build's own record of what is outstanding

Of 34 open claims in `RESUME.md`, **8 are already fixed and 7 more carry a wrong figure.**
Eleven of those fifteen have their correction *already written elsewhere in the same file* —
L1113 corrects L868, L1053 corrects L1023, L1069 corrects L1022, L1034 corrects L886. The
pattern is not drift: corrections are appended as new paragraphs while the superseded
sentence is left standing. That is the "renumber instead of remove" failure the file itself
names three times, applied to the sentences that state the rule.

### C-20 · Critical · `RESUME.md` §3 omits APP-016 and states the wrong entry count

§3 (L130) reads "Fourteen entries, APP-000 to APP-013"; the ledger holds **17**, APP-000 to
APP-016. §3's APP-015 bullet still tells the next session that entering slice 12 needs a new
approval entry. It exists — APP-016, written this session.

### C-21 · Critical · `pending_gates[0]` is satisfied and reads `NOT_YET_REQUESTED`

"Slice 4 whole-branch independent review before merge", blocker "Tasks 11 and 12."
Controller-verified: `c65536a fix(slice-04): the whole-branch review's two Criticals, and
twenty-eight routes nobody had scanned`. The review ran, its Criticals were fixed, and seven
slices have merged since.

### C-22 · Critical · three RESUME paragraphs describe finished work as owed

`DEC-AIEMBED-001` and `DEC-AIFALLBACK-001` are recorded at L329 as appearing "nowhere in the
build" and named as the slice's only two real gaps — both ship
(`src/ai/failures/catalogue.ts:495,504`, `src/studio/ai-degradation.ts:201`, first in
`53b1c97`). L974-985 says `SB-AI-*` reads 0 of 48 and the three `SA-0703` rows read
`not-represented` — measured 30 of 48 and all three demonstrated, closed by `0487046`.
L880-884 names three hardcoded counts as "genuinely removable" — all three were removed in
`0de7950`, each with the removal recorded at the cited line. A session trusting §8 rebuilds
work that is done.

### C-23 · Important · the export is 102 routes, and the screenshot manifest is older than three slices

Both L410 and L535 say "a 100-route export". Measured with `exportedRoutes()`'s own walk:
**102**. The manifest holds 85 rows and 85 PNGs, so the gap is **17**, not 15, and every
missing route is a real screen — eleven Command Center module routes, `/hub/notifications`,
`/hub/audit-and-retention`, three `/super-admin/` scheduler and AI-incident routes, and
`/workflows/ai-and-its-absence`. `git log -1 -- docs/screenshots/manifest.json` is `8ed171b`,
**2026-08-22, slice-08 wave 4**. `0de7950`'s own message claims the figure was "removed, not
renumbered"; it renumbered to 100, and 100 is now wrong too.

### C-24 · Important · four wrong figures and one wrong reason, each corrected elsewhere in the file

L1023's "eighty-eight … DEC-AI 16" is **91 and 19** (`src/coverage/uninventoried.ts:33`
already says ninety-one) · L1022's "two aliases needing wiring" are wired at
`src/disclosure/decisions.ts:1190,1222` and four of its "five with no canon record" are
members of `src/surfaces/cc/decisions/register.ts` — only `DEC-AIRTO-001` is homeless ·
L539's "all in slice 5-8 files" is false, at least five of the twelve are slice-03, -04 and
-06 files · L863's `sub-features (0/526)` is **1/526** (`SUB-SA-0703`) · L886's "25 entries
against 25 files" is **26 and 26** · and L1027's stated escape reason for
`SA_MATRIX_ATTRIBUTION` is wrong: the tree's only spelled-numeral gate polices
`records|members`, so "twelve modules" would have escaped it too. The string is unpoliced;
the explanation of why was not.

### C-25 · Moderate · five items are carried in two "open" lists at once

`build-registries` (L1029/L1112) · `PINNED_WORKER_MESSAGES` (L1024/L1114) · `contentOrigin`
(L1025/L1115) · `notShippableLock` (L1026/L1117) · `SA_MATRIX_ATTRIBUTION` (L1027/L1118).
The later list reads as superseding the earlier, but the earlier was never removed, so its
resolved entries still read as owed.

### C-26 · Moderate · two dated measurements have drifted

L820's "583 files in `src`+`app`, 543 reachable, 40 orphaned" measures **612 / 579 / 33**
today, and it is presented as a live measurement rather than a record. L143's census figure
is a quotation of what the client was shown, so it stands as a record.

## Further brief corrections from audits C and E

- **The slice-11 commit range in the brief is wrong.** `562f89a..HEAD` omits 29 test files;
  slice 11 begins at `2d62ee2`, immediately after slice 10's last commit `b77369e`. On the
  correct range the slice holds **68** test files, not 39 — including every wave-0/1/2 unit
  suite for the mode machine, provenance classes and refusal edges. An audit run on the
  brief's range would have reported those as ungated. They are gated.
- **The brief attributed FB-AI's arithmetic to FAIL-AI.** `FAIL-AI-*` is 60 distinct
  literals, all two-digit padded. The 50-literal, two-convention, 39+10+1 description is
  **FB-AI**.
- `expectPopulationFloor(x, 0)` is `toBeGreaterThan`, exclusive — floor 0 asserts non-empty,
  so several cases that read as vacuous are sound.

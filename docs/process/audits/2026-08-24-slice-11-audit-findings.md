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

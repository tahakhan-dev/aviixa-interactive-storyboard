# Fix stream G — round-2 reachability and citation findings

Authority APP-016 item 1, slice-11 audit round 2. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Frozen
source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

Findings numbered `R2-C03`…`R2-C12`. `R2-C01`, `-C02` and `-C04` are another stream's
(`cc-13/rail.ts`, `Cc13ActionRail.tsx`, `tests/unit/cc-13.test.ts`) — **do not touch those three
files.** A third stream owns five `tests/coverage/` gates: `offline-phrasing`, `citation-graph`,
`slice-2b-gates`, `registry-freshness`, `screenshot-manifest`.

## Files you own

```
src/surfaces/cc/actions/ActionRail.tsx
src/surfaces/cc/modules/cc-02/SyncStateChrome.tsx
src/surfaces/cc/modules/cc-06/lane-b.ts
src/surfaces/cc/modules/cc-08/degradation.ts
src/surfaces/cc/fallback/CcFallbackDisclosure.tsx
src/surfaces/doh/modules/doh-18/matrix.ts
src/studio/modules/stu-07/writes.ts
src/studio/modules/stu-12/versions.ts
src/ui/primitives/index.ts
tests/unit/cc-01.test.ts · cc-02…cc-12 (NOT cc-13) · doh-18.test.ts · stu-*.test.ts
```

## The shape all of these share

Six of the ten are **an abstention or a measurement that has outlived its truth**. This build has
already corrected that paragraph shape twice — `DeterministicBoundary.tsx` and `ProvenanceMark.tsx`
— and a gate found the second one, not a reader. The lesson recorded there is the one to apply:
**an abstention has to red when it stops being true, or it rots.** Prefer a derived assertion over
a restated sentence, and where you keep a sentence, put something beside it that reds.

## R2-C03 · Important · a component that asserts the opposite of its reachability

`src/surfaces/cc/actions/ActionRail.tsx:37-41` states "`AC-CC-040` forbids a fourteenth module
route, so this rail mounts inside the twelve module screens rather than owning one." Measured: no
file under `app/` imports it, `<ActionRail` appears in no route file, and **eleven unit gates
positively forbid the import** (`cc-03` … `cc-12` each assert the page does not import it). It
mounts inside zero module screens.

This is the `SecondTreatmentDisclosure` shape the surface already paid for — except the file
asserts the opposite of the measurement instead of abstaining. Replace the sentence with the
measured position (the card mounts on no screen; the control rail eight screens mount is
`cc-13/Cc13ActionRail.tsx`) and register the abstention where the other Command Center abstentions
live. Decide explicitly whether the component should exist at all, and say why.

## R2-C05 · Important · a citation twenty-two lines short of its own criterion

`src/studio/modules/stu-12/versions.ts:49-50` cites `L33517 / AC-STU-108` for "an in-flight Run's
pinned package is never swapped by any publication." L33517 is a numbered sequence step ("In-flight
Runs continue on their pinned versions regardless") carrying neither the identifier nor the words.
`AC-STU-108` is at **L33586** and the index lists that as its only occurrence. Same section, which
is round 1's substantive-clause condition exactly.

## R2-C06 · Important · the identifier and the quote both name a line carrying neither

`src/studio/modules/stu-07/writes.ts:210` cites id `FUNC-STU-07-04-B-1` against line 32656 and quotes "does not
block any Workflow, because the prior published item remains in force". L32656 is
`FUNC-STU-07-01-B-1`, about a launched checklist. Both the identifier and the quote are at
**L32678**, and that phrase occurs at L32678 only.

> **[Corrected 2026-08-25, round 4 leftovers.]** The bad pair above was originally written here in
> the `<id> (L<n>)` citation form. That is itself a citation as far as `citation-graph` and
> `locator-fidelity` are concerned — a wrong line number does not become inert by being quoted in a
> report about it — and it was one of the ten uncorroborated claims round 4 surfaced. The finding is
> unchanged; only its notation is. The identifier and the wrong line are now separate fields. The
> fix `writes.ts` actually carries, L32678, was correct then and is correct now.

## R2-C07 · Moderate · a disclosure reachable from nothing, whose precedent points the other way

`src/surfaces/doh/modules/doh-18/StandardReportDataSets.tsx` is imported by nothing under `app/`;
`grep -rn doh-18 app` returns nothing. `MOD_DOH_18_HAS_NO_SCREEN` (`matrix.ts:388-397`) declares
the absence of a *screen* and calls it "the same shape as `MOD-DOH-15`, which catalogue B mounts
inside the Job editor" — but `MOD-DOH-15`'s panel **is** mounted, so the named precedent tells the
reader the opposite of this component's condition. The component renders the `DEC-REPORT-001`
disclosure, so no reader can reach a blocked-decision statement.

State the missing mount and name the intended host. (`DOH_OUT_OF_SLICE_MODULES` already records
that this module has no route, which is why this is Moderate.)

## R2-C08 · Moderate · a register saying a sibling still owes a fix that landed

`src/surfaces/cc/modules/cc-08/degradation.ts:615-624`, seam
`deterministic-boundary-had-no-route`, says in the present tense that
`DeterministicBoundary.tsx` "records that nothing under `app/` renders it", that "the paragraph in
that file is now stale", and that "Wave 5 task 20 or task 21 closes the paragraph." Measured: that
file now reads "IT IS REACHABLE FROM A ROUTE, AND THAT PARAGRAPH IS NOW CLOSED", names its importer
and its route, and cites this very seam as what predicted the staleness. Put the seam in the past
tense and record the closure, as `spine-status.ts` does for its closed seams.

## R2-C09 · Moderate · the word "Measured" carrying evidence that has rotted

`src/surfaces/cc/fallback/CcFallbackDisclosure.tsx:22-24` says "Measured, not assumed:
`grep -rn "cc/fallback" src app tests` returns this directory and the two test files". That grep
now returns **28** files — 14 under `src/`, 14 under `tests/`. The operative claim still holds (no
route mounts it, and two unit gates assert it), so **only the evidence sentence is wrong**. Narrow
the stated command to one that still returns the claimed result.

## R2-C10 · Moderate · the third instance of a paragraph shape already corrected twice

`src/surfaces/cc/modules/cc-02/SyncStateChrome.tsx:22-25`: "NO `'use client'`, AND NO ROUTE… There
is no page here, no `app/command-center/` directory, and nothing in this file registers anything."
Measured: `app/command-center/` has twelve route directories plus its own page; `LiveShiftBoard`
renders `<SyncStateChrome>` and its route mounts it; `tests/unit/cc-01.test.ts:619` already asserts
`reached(...SyncStateChrome.tsx) === true`. Keep "this module owns no screen" and replace the
directory clause with the measured mount.

## R2-C11 · Minor · one of two orphaned primitives is declared and the other is not

Of eighteen primitives, exactly `Drawer` and `Toast` have no JSX render site in `src/` or `app/`.
Toast's condition is recorded in detail in a `tests/coverage/` gate; Drawer's is recorded nowhere,
and the orphan gate that would catch it is scoped to slice-11 files, so a pre-slice-11 primitive is
outside its population. The barrel's own comment says star re-exports make "who imports X"
unanswerable, so every consumer must be named by hand — which makes an unnamed orphan invisible by
design. Name it beside Toast, or delete it and say why.

## R2-C12 · Minor · a paraphrase inside quotation marks

`src/surfaces/cc/modules/cc-06/lane-b.ts:52-54` quotes `FUNC-CC-0604-3-1` (L37431) as "a deliberate
refusal to invent a contractual behaviour". The line reads "Purpose: refuse to invent a contractual
behaviour." Identifier and substance are right; the words inside the quotes are the comment's own.
Drop the quotation marks or quote the line.

## Non-negotiable

- **Plant, watch it red, check the red is the assertion you meant, restore byte-identically**, and
  put both `shasum -a 256` values in the report. Where a plant needs a file you do not own, replay
  the logic in node over a `/tmp` copy and say that is what you did.
- **Open every blueprint line before citing it**, and cite the blueprint line, never a graph node.
  `registries/blueprint-locators.json` maps 19,897 identifiers to every line each occurs on.
- **Do not "correct" a citation of the section/row form.** A citation may name a line inside a
  section rather than the identifier's own line — the auditor checked 1,714 identifier-anchored
  citations and 45 mismatches, and 43 of the 45 were that legitimate idiom. Five accurate citations
  in this build were nearly corrected into inaccurate ones before this was understood.
- Every count above is a hypothesis. Report your own measurement and the command.
- Report exact counts from the unit, component and release projects, `npx tsc --noEmit`, `pnpm build`.

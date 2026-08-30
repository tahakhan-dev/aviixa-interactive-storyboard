# Slice 7 — the common half of every Frontline module brief

Every one of the twelve module dispatches in waves 1 and 2 reads this file first. The
per-module half of the brief carries only what is specific to that module: its identity
card, its matrix span, its row and column counts, its traps, and the files it owns.

## The three lines every dispatch carries verbatim

1. Of 1,203 identifier-anchored citations in the tree, 1,019 are confirmed at the exact
   line by `registries/blueprint-locators.json`. That is a measured split, not a target.
2. **This brief is a hypothesis. Prove its quotations and its locators against the frozen
   source before you build from them. If a locator is wrong, report it — do not build
   around it.**
3. Brief-supplied assertions known to be incapable of failing, to date: **ten** (slice 5).
   This brief therefore contains no test code, no assertions, no matchers and no expected
   strings. You write the tests after the code exists, against the frozen source.

## The frozen source

```
/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md
sha256  47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
        18,565,031 bytes · 122,241 lines
```

It is far too large to read whole and it is read-only input. Use `sed -n 'A,Bp'` and
`grep -n`. It never becomes an application asset, and no part of it is copied into
`public/` or into a fixture wholesale.

**Cite the blueprint, never the graph.** A `graphify query` result is a lead to verify.
Open the line it names and read it before citing it.

## What you are building

The Frontline Worker Application surface, `SURF-FL`, is the fourth surface this build has
reached. Wave 0 landed six shared representations and every module task consumes them
rather than re-deriving them:

| what | file | what it settles |
|---|---|---|
| access evaluation | `src/frontline/access.ts` | `evaluateFrontlineAccess`, the nine `PermissionOutcome`s including `queuedOffline` and `cachedReadOnlyOffline`, and `frontlineConnectivityTreatment` |
| the destination set | `src/frontline/screens.ts` | the six routes, the `SCR-FL-*` namespace ruling, the twenty-three-row register's views |
| the control matrix | `src/frontline/matrix.ts` | `FrontlineMatrixRow`, `frontlineAffordance`, the order of questions, the invariant-excluded acts |
| capture and envelope | `src/frontline/capture.ts` | the thirteen-member capture state ladder, the nine-field runtime envelope, `captureStateLine` |
| the command channel | `src/frontline/commands.ts` | the five `CMD-FL-*` classes, the applied ladder, the `DEC-SYNC-001` order |
| cross-surface and fallbacks | `src/frontline/cross-surface.tsx`, `src/frontline/fallbacks.ts` | `CrossSurfaceAct`, `NamedPlace`, the fourteen `FB-FL-*` patterns and `patternsForModule` |

**Read all six before you write a line.** A module that re-derives one of them has created
a second spelling of a ruling, which is the defect shape this build has recorded most.

## The shape a module takes

Follow the shipped idiom rather than inventing one. `src/studio/modules/stu-01/` is the
reference: a `charter.ts` (the identity card, transcribed), a `matrix.ts` (the permission
matrix, transcribed row by row), a `service.ts` (the module's own logic and vocabulary),
and a view component. `src/surfaces/doh/modules/` is the second reference.

Your module's directory is `src/frontline/modules/<your-id-lowercased>/`, e.g.
`src/frontline/modules/fl-a1/`.

Export from your view file either:

- a `RunPlayerPanel`-shaped value, if your destination is the Run Player — the type is in
  `app/frontline/run-player/RunPlayerRoute.tsx` and the six mounting modules each export
  one panel; **you do not edit that file, and you do not edit any file under `app/`**; or
- a plain view component, if your destination is one of the other five.

The controller wires your export into its route after you report. **Do not create or edit
anything under `app/`.** Six agents creating `app/frontline/run-player/` is the exact path
collision this build has recorded three times.

## The rules that decide what a cell draws

These are settled in `src/frontline/matrix.ts` and you consume them; they are restated
here because reading only the token is what builds them wrongly.

1. **A row describing another surface is never an enabled control here, whatever its token
   reads.** Thirty-three cells across the twelve matrices carry `Allowed`, `Allowed with
   conditions` or `Read-only` while their own text places the act on the Hub, the Command
   Center, the Studio or the platform console — eight of them ending in the words "not
   here" or "never here". Two more name a condition but **no surface**, so a rule that
   looks for a surface name misses them precisely because the note is silent (L41622,
   L41100, against their neighbours L41621 and L41099).

2. **Six of those cells are run cancellation and terminal completion**, given to Supervisor
   and Quality Manager across three matrices — L40369, L40535, L41953, L41954. `EXCL-FL-06`
   (L39489) classifies this as an **Invariant** exclusion, so shipping the control is a
   broken guarantee rather than a misplacement.

3. **The inverse trap.** Six permissive Supervisor and Quality Manager cells are genuine
   on-device controls — L40189, L40190, L40192, L40534, L41623, L41624 — every one of them
   the second-identity step-up. Applying "Supervisor permissive means elsewhere" uniformly
   deletes the one non-Worker control this surface owns.

4. **`Explicitly prohibited` renders as no control plus a stated line where the control
   would sit.** `FrontlineAffordance` has no `disabled` member and cannot express one. 332
   of the 539 cells carry this token; twelve tasks each deciding locally is how the slice-4
   inconsistency gets reproduced twelve times over.

5. **`Not applicable` is not a refusal.** 92 cells carry it and each one has a stated
   reason: the act does not arise for that role here. Rendered in the same visual band as
   `Explicitly prohibited` it tells a Supervisor they are forbidden from logging out when
   the truth is that a step-up is released rather than logged out.

6. **`Unavailable` is overloaded across two opposite senses, six rows apart in one
   matrix.** L42114 means "exists and is absent under a stated condition"; L42120 and
   L41797 mean "exists nowhere for anyone". One has a route back at the next sync and the
   other never will.

7. **All eleven `Client Decision Required` cells sit in the Tenant Admin column** and every
   one of them defers to the same unanswered question, recorded once in
   `src/routes/definitions.ts`. `AC-FL-009-5` (L39948) forbids resolving it in either
   direction. Disclose it; do not answer it.

## The four claims this surface must never make

1. **`worker-finished`, `submitted`, `complete` and `finished` are four different states**
   — L40545, L40559-L40560, chapter workflow steps 10-12 at L39045-L39047, storyboard frame
   6 at L39066. A completion screen labelled "Run complete" when the worker has declared
   finished tells the worker the platform holds a record it does not hold.

2. **There is no "synced" state and no bare success** — L39622 says so in those words.
   `captureStateLine` reads a total record over a union with no such member. Never write
   the word as a state.

3. **The hold lifecycle `issued → propagating → in force` is a Command Center rendering
   across a fleet; the device holds only its own copy** — L40930, L40950, `TEST-STATE-003`
   L48065, L39707. A device timeline showing the fleet states claims knowledge no
   pull-based device has.

4. **The safety layer is identical offline** — L40948: "A Severity 1 hold fires immediately,
   even offline; the lot is protected from the moment of the breach, not from the moment of
   sync." L40954, `AC-FL-000-4` L39099, `AC-SCR-FL-004` L48692. Gating the deterministic
   layer behind a connectivity check inverts the most consequential position in this scope.
   **A5's and A6's cards must state the offline behaviour even where slice 7 does not
   simulate it** — a screen rendering only the connected path implies the safety layer needs
   a network, which is the one claim chapter 22 exists to deny.

## Categorical absences — nothing you build may contain these

`AC-FL-000-5` (L39100), `TEST-FL-000-3` (L39108), `AC-SCR-FL-002` (L48690) and
`AC-SCOPE-045` (L2683): no pace, no timer, no countdown, no ranking, no productivity
comparison, anywhere in rendered text, in any state. A wave-3 task sweeps the built `out/`
tree for these words; do not be the module it finds.

## Decisions you disclose rather than settle

Twenty-five `DEC-*` records touch this slice. `src/disclosure/DecisionDisclosure.tsx` is
the renderer. The per-module brief names which ones are yours. The standing rule: **an
unresolved source decision is disclosed on screen with its alternatives, and this build's
pick is labelled a client-delegated choice** — the client delegated the decision, not the
pretence that the source settled it.

## The fallback obligation

`AC-FL-011-1` (L40151): every functionality names at least one `FB-FL-*` pattern. Chapter
22 counts 181 functionalities across the twelve modules. `patternsForModule` in
`src/frontline/fallbacks.ts` is what you read; `AC-FL-011-2` requires every retry path to
have a bounded exit into a named terminal safe state, and the terminal safe states are
transcribed there.

## What "done" means for your task

- Your module's identity card is transcribed from its card lines, not paraphrased.
- Your matrix is transcribed **row by row, cell by cell**, with the row count and the
  column count matching the per-module brief. `cells` is a total `Record`, so a blank cell
  is untypeable — if you cannot fill one, the transcription is wrong and you report it.
- Your view renders through `frontlineAffordance` and never around it.
- Your tests are written **after** the code, against the frozen source, and every gate you
  write plants its own defect, watches it go red, and restores it. **A gate that cannot
  fail is worse than no gate.** Four shipped tests in this build could not fail.
- `pnpm typecheck`, `pnpm lint`, `pnpm test:unit` and `pnpm test:component` are green **for
  the whole tree**, not only for your files.
- **You never run git.** The controller commits.

## What you report back

1. Files created, with line counts.
2. Row count and cell count transcribed, and the arithmetic that checks them.
3. Every locator in the per-module brief you proved, and every one you found wrong — the
   brief is a hypothesis and a wrong locator is a finding, not an obstacle.
4. Every ruling you made, in this format:

   ```
   Cost if wrong:  <what breaks, and how big the repair is>
   Cost if late:   <N tasks × the retrofit>
   ```

5. The command output for typecheck, lint, unit and component, verbatim tail.
6. Anything you could not establish, marked unrecorded — never inferred, never filled with
   a plausible value.

## The decision canon does not hold Frontline's decisions — known, measured, and not yours to fix

`src/disclosure/decisions.ts` holds **29 records**, every one raised while `SURF-STU` and
the platform surfaces were built. Wave 1's four modules each reached for it and each found
its own decisions missing. The identifiers confirmed absent so far: `DEC-MSG-001`,
`DEC-WIPELOGOUT-001`, `DEC-SUSP-001`, `DEC-DEVICE-001`, `DEC-STORE-001`, `DEC-AREA-001`,
`DEC-SITE-001`, `DEC-PLUS-001`, `DEC-SCAN-001`, `DEC-PKGFIELD-001`, `DEC-GATE-001`,
`DEC-NOSHIFT-001`, `DEC-CLOCKWIN-001` — **thirteen**, and twenty-five `DEC` records touch
this slice.

**Do not edit `src/disclosure/decisions.ts`.** One later task lifts all of them at once;
thirteen modules each adding a record to one shared file is the path collision this build
has recorded three times.

**Do this instead, and do it the way wave 1 did**, so the lift is one edit rather than
twelve reconciliations:

1. Follow the shipped `Stu14LocalDisclosure` idiom — the canon's own record shape, with
   `DecisionReading` **imported** rather than redeclared.
2. Declare the gap on screen. A reader must not think the canon holds it.
3. **Build the stand-in to expire.** Assert in your unit suite that every identifier you
   carry locally is **absent** from the canon's exported union. The moment one is lifted,
   your suite goes red and forces the switch. A stand-in with no expiry gate is how two
   spellings of one decision ship.
4. Never file a decision under a neighbouring identifier because that one happens to exist.

## `AC-FL-011-1` has gaps in the source, and they are counted

Twelve functionalities across wave 1's four modules name no `FB-FL-*` pattern, each on a
stated ground the source itself gives ("an absent capability has no failure mode", "a
non-configurable invariant has no fallback; its violation is a defect"). `AC-FL-011-1`
(L40151) asks every functionality to name at least one.

**Report yours; do not fill them.** An assigned pattern is indistinguishable from a real one
forever afterwards, and the criterion then reads clean because nobody looked.

## Three parts of the source disagree about every module's fallback set

Measured on three modules so far and identical in shape each time: §22.9's module map, the
module card's own Fallback identifier field, and the functionality clauses give **three
different sets** — A1 2/3/4, A3 4/6/7, A5 3/4/7. `FB-FL-PKG-01`'s map row (L40132) does not
list A5, and A5's card does. **Carry all three readings; reconcile none.** No `DEC`
identifier is attached to this anywhere.

## `C1`/`C2` in your brief is a build-plan grade, not a source value

The source's module inventory has a **`Band`** column — header L39844, data L39846-L39857 —
and the bands are not uniform: **A1 through A7 read `A`, B8 through B12 read `B`**. That is what
the `A`/`B` in the module identifiers means. Find your own row; do not cite a neighbour's, and do
not transcribe `C1` or `C2` into your module.

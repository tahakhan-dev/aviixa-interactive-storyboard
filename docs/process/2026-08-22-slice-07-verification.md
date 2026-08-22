# Slice 7 verification — `SURF-FL`, the Frontline Worker Application

**Twelve modules, six destinations, 539 cells.** Every number below was measured on the exact
bytes named, by the controller, after the last build task landed. Where an agent reported a
figure, the controller re-derived it independently; where the two disagreed, the disagreement
is recorded rather than resolved silently.

## 1. The bytes this verifies

```
branch      slice-05-studio-authoring
range       717e2cd..5dcdbeb          (wave 0 through the slice gates)
source      AVIIXA_Production_Product_Blueprint.md
sha256      47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
            18,565,031 bytes · 122,241 lines — re-hashed at session entry and unchanged
```

## 2. `pnpm verify`, end to end, green

```
typecheck            tsc --noEmit                         exit 0
lint                 eslint .                             exit 0
gate ordering        16 release gates, all audited        exit 0
registry freshness   2 passed                             exit 0
unit                 93 files · 3,273 tests               all passed
component            67 files · 2,199 tests               all passed
release              16 files ·   548 tests               all passed
build                static export, 84 pages              exit 0
end-to-end           467 Playwright tests                 all passed
  of which accessibility  365                             all passed
```

**This was not green when the slice's build tasks finished.** Six accessibility failures went
live the moment the twelve modules were mounted onto six routes, and none of them was reachable
before that — the whole class is a defect of composition, and a component suite mounts one
component. They are §5 below.

## 3. What was built

| module | rows × cols | cells | destination |
|---|---|---|---|
| `MOD-FL-A1` Identity, Authentication and Device Mode | 10 × 5 | 50 | Login, and Profile-lite |
| `MOD-FL-A2` My Runs | 9 × 5 | 45 | My Runs |
| `MOD-FL-A3` Run Player | 10 × 5 | 50 | Run Player (host) |
| `MOD-FL-A4` Data Capture and Evidence | 9 × 5 | 45 | Run Player panel |
| `MOD-FL-A5` On-Device Detection and Containment | 9 × 5 | 45 | Run Player panel |
| `MOD-FL-A6` Offline and Sync Engine (half) | 9 × 5 | 45 | chrome + sync sheet, **no route** |
| `MOD-FL-A7` Security and Data Protection | **9 × 6** | **54** | Profile-lite |
| `MOD-FL-B8` Coaching Rendering | 7 × 5 | 35 | Run Player panel |
| `MOD-FL-B9` Gates and Sign-Off Authority | 9 × 5 | 45 | Run Player panel |
| `MOD-FL-B10` Notifications | 7 × 5 | 35 | Notifications and sync inbox |
| `MOD-FL-B11` Worker Lifecycle on Device | 10 × 5 | 50 | Run Player panel |
| `MOD-FL-B12` Training Library Viewer | 8 × 5 | 40 | Training Library viewer |

**106 rows. 97 × 5 + 9 × 6 = 539 cells.** Token tally across all twelve: 332
`Explicitly prohibited`, 92 `Not applicable`, 55 `Allowed`, 27 `Allowed with conditions`, 15
`Unavailable`, 11 `Client Decision Required`, 7 `Read-only` — **539**.

**The controller recounted all twelve matrices independently from the frozen source and every
tally matched**, including `MOD-FL-A3`'s 10 + 4 split on `Not applicable`, where the module's
own gate had caught a first pass that wrote 11 + 3.

`Unavailable` appears in **exactly two** matrices — 5 cells in B10, 10 in B12 — totalling the
surface's 15. B12 holds both of the token's opposite senses, five and five, separated by
`existence` and never by the token.

## 4. Gates: 434 defects planted, every one observed red, every file restored byte-identically

Per wave: wave 1 planted 134, wave 2 batch A planted 251, batch B 179, and the two closure
tasks 21 and 29 respectively into real shipping files. The count is the sum of the agents'
own campaigns, each re-run by its author with a before/after checksum.

**Fifteen gates could not fail when first written.** Every one was found by planting and none
by review. The shapes, because the shapes are the lesson:

1. a `textContent` read defeated by **element concatenation** — `a timer` followed by
   `STATE-A3-REVIEW` reads back as `a timerSTATE-A3-REVIEW`, so `/\btimer\b/` never matches;
2. the same defeated by a **`hidden` attribute** — `getByTestId` finds hidden elements and
   `textContent` reads them, so a statement moved behind a click passed verbatim;
3. an arity check defeated by a **defaulted parameter** — `online = true` does not count
   toward `Function.length`, and that is the version that ships because a caller never has to
   notice it;
4. an outcome check where **`Allowed` is a prefix of `Allowed with conditions`**;
5. a **`toEqual([...MY_CONSTANT])`** tautology;
6. a shared helper used as its own test whose **only firing branch could not fire**;
7. a table-shape check **satisfied by the `|---|---|` separator row**, which splits into six
   non-empty cells;
8. a position check **true of both the defect and its fix**;
9. a word-presence check defeated by **fold-text overlap**, because the verdict string
   contains the cell's own note;
10. a `\btimer\b` pattern defeated by the **plural**;
11. a forbidden-word allowance that **took its allowed string from the value under test**;
12. a check reading `sourceRef` alone, so a record naming a **different row** while citing the
    right line passed;
13. a §22.7 gate that **re-derived its own filter** instead of reading the module's export;
14. a page-level `toContain` that passed on the **row's** sentence rather than the cell's;
15. a "no disabled control" gate rendered only for a persona **whose card never draws**.

## 5. The six accessibility failures, and why they could not have been found earlier

Every module was built standalone. Each therefore used `<section aria-label>` for grouping and
each rendered its own `<h1>`. A `<section>` with an accessible name is a `region` landmark.
Composed onto six routes, that put about **one hundred landmarks on one page**, three `<h1>`s
on two routes, and two modules' identical `Permission matrix` labels beside each other.

| rule | impact | cause |
|---|---|---|
| `list` | **serious, WCAG A/AA** | `role="note"` on a `<li>` inside a `<ul>` |
| `aria-allowed-role` | minor | the same one attribute, five nodes |
| `landmark-unique` | moderate | 128 inner `<section>` elements as landmarks |
| `heading-order` | moderate | three views mounting directly under the shell jumped `h2 → h4` |
| one-level-1-heading | — | shell `<h1>` plus a mounted view's own, twice |
| `aria-prohibited-attr` | — | introduced by the first repair, and repaired again |

**Repaired at the cause, not per page.** 128 inner sections became `div`s; 112 `aria-label`s
were dropped because the group already contains a heading that names it; 29 kept theirs and
gained a real `role="group"`; three `<h1>`s were demoted; three views' headings were unskipped
while the six Run Player panels were left alone, because the route renders panel headings at
`h3` and their `h4`s are already in order.

**A first attempt was reverted rather than patched.** A regex over JSX matched across
multi-line template literals and corrupted four files; the redo is line-based for the safe
edits and brace- and backtick-aware for the tag rewrites.

## 6. Defects found in wave-0 code that was already committed

**`src/frontline/access.ts` refused the wrong way offline.** The `forcesSyncFirst` check sat
inside `if (ctx.online)`, so a forced-sync write taken offline fell through to the queue and
returned `queuedOffline` — a sign-off recorded as pending on stale cache. L40224 forbids it in
the source's own words, L40307 tells it as a story, and `TEST-B9-7` (L41765) asks for a test
asserting **no partial sign-off record is created**. `MOD-FL-A1` and `MOD-FL-B9` found it
independently from different sections. **Wave 0's own test asked the question only with
`online: true`, which is how it shipped.**

**`MOD-FL-B9`'s pinning gate could not fail.** It was written to hold wave 0's shape so a fix
would come back through it, and it asserted the check appeared before a comment marking the
offline block — true of the defect and true of the repair. Rewritten against the connectivity
branch itself, then the original defect was planted back and both gates went red.

**`controlsOnActsHeldElsewhere` had an unreachable loop.** The guard whose whole job is
catching a control drawn for an act held on another surface read: skip anything that is not a
`control`, then skip `screen` and `chrome` rows, then report. The only surfaces left are the
two the fold answers as `cross-surface` and `named-place`. **The body was dead code**, and the
one live check covered three action strings. `MOD-FL-B11` proved it by planting a misclassified
row and watching the guard stay green while the panel drew two Hub controls; `MOD-FL-B12`
reached the same conclusion and deleted its own use of the function as a test.

Repaired to start from **the cell's own transcribed words** rather than from the classification
it exists to doubt — **and the repair immediately found a shipped defect in `MOD-FL-A4`**, whose
Quality Manager cell reads "Allowed — Client Command Center action 7" on a row classified
`screen`. A4's own screen is right; it resolves placement per column through a private fold.
What was wrong is that the projection is private, so the shared fold sees a Command Center
action drawn as a control on a factory tablet.

**`src/frontline/commands.ts` filed a gap under a neighbouring identifier.** The
wipe/de-authorisation channel gap was marked `DEC-WIPE-001`. The source raises it as
**`DEC-CMDCLASS-001` at L51551** and holds the two apart in the same line: "`DEC-WIPE-001`
remains separate and unresolved: it concerns how long a wipe may remain pending". Filing a gap
under the nearest identifier that already exists reads exactly like a transcription, which is
why it survived review. Three gates pinned the old value and all three went red on the fix,
including `MOD-FL-A7`'s, which was written to do exactly that.

**`TENANT_ADMIN_OPEN_CELLS` claimed all eleven open cells defer to one question.** Ten do.
L41300 gives its own reason — the platform critical class — and the source files it separately.
The deferral reason is now a typed field.

## 7. The defect class this slice's testing could not see

**Four of the six Run Player panels shipped with `data-testid="fl-panel-undefined"` in the
built HTML while every component test passed.** They declared their panel as a module-scope
const in a `'use client'` file, and a plain object exported from a client module and imported
by a server component does not cross the boundary as data — Next.js replaces client-module
exports with client references, so the string fields are gone when the page prerenders.
`MOD-FL-A3` and `MOD-FL-A4` were unaffected because both already build their panels in server
modules.

**A component suite mounts the component; the client boundary only exists in a build.**

## 8. Six errors in the controller's own briefs, every one found by an agent or a gate

1. **There is no grade column.** The module inventory's four columns are
   `Identifier | Module | Band | One-line scope` (L39844), and the bands are not uniform: A1
   through A7 read `A`, B8 through B12 read `B`. Three agents found this independently, and
   **the controller's first correction — that all twelve read `A` — was also wrong.**
2. **`DEC-GATE-001` is not `MOD-FL-B9`'s decision.** It occurs 175 times in the source and four
   times in chapter 22, all in A5's and B8's sections, **zero times in §22.18**.
3. **The capture-type contract is not in `src/frontline/capture.ts`** — it is `CAPTURE_TYPES`
   in `src/studio/vocab/authoring.ts`, and `MOD-FL-A4` now imports it by identity so a copy
   cannot pass.
4. **§15.2 is not the support-not-surveillance invariant.** L19053 is "The role-grant
   lifecycle"; the invariant is **§3.3 at L1994**. `§15.2` is the *master prompt's* number for
   it, and in a brief whose every other section reference means a blueprint section it pointed
   twelve agents at the wrong document.
5. **Trap 8's inbox-backfill rule is not in `MOD-FL-B10`'s chapter at all** — §22.19 contains
   no occurrence of "event time"; the rule is §30C's.
6. **A citation pointing at the information-architecture row instead of the screen register** —
   L40035 names the destination and both modules but carries no screen identifier.

**And one earlier finding was falsified by measurement.** Three briefs carried the hypothesis
that `DEC-MSG-001`'s second wording was unrecorded in this build. `MOD-FL-B10` measured it
recorded, in `fl-a1/service.ts` and `fl-a7/service.ts`. What is genuinely unrecorded is any
source line reconciling the two wordings.

## 9. Carried forward, stated rather than closed

- **Six of twelve modules are uncredited by the registry and cannot be credited.** It awards a
  route to one module; five of the six Run Player modules own no route by construction
  (`AC-FL-010-2`, L40046). The evidence is in the built tree — all six panels render on
  `out/frontline/run-player/index.html` under their own module ids. **The registry is not being
  taught to say "demonstrated as a panel" to improve the number.**
- **28 `AC-FL-011-1` source-side gaps**, functionalities the source itself gives no `FB-FL-*`
  pattern, each on a stated ground. **None filled.** A backtick-anchored regex returns 31; the
  ledger's 28 is right and the obvious regex is not.
- **21 cells across `fl-a4` and `fl-b8` carry a `note` that is not the source cell's verbatim
  words**, against the documented contract. Repairing two modules of twelve makes the set no
  more consistent; the gate enumerates the five diverging rows with their exact additions so a
  22nd cannot join unnoticed. **Wave-3 closure item.**
- **Three of eight modules do not draw each cell's own words.** Five of eight do, and the five
  are right. **Wave-3 closure item**, with `fl-a6`'s `MatrixTable` named as the idiom.
- **Per-column placement belongs in the shared row type**, not in `MOD-FL-A4`'s private fold.
  Three modules needed it and one built it privately. **Wave-3 closure item** — it is a wave-0
  contract change with twelve modules built on it.
- **The three-way fallback-set split**: §22.9's map, the module card and the functionality
  clauses are never all equal on any of the twelve. Four modules have two readings agreeing as
  sets. No `DEC` identifier is attached to the disagreement anywhere in the source.
- **Client-only render branches are outside a built-tree sweep.** Eleven Frontline components
  are client components and a `useState` branch that renders only after a click is not in the
  static export. Measured today: an AST scan finds 26 literals with a hit and every one is
  already an exempted disclosure, **so nothing hides there now** — but the sweep would not see
  a new one.

## 10. What this verification does not claim

No visual baselines exist for this surface. No screenshots exist anywhere in the build. The
walkthroughs, the client-review guide, the deployment instructions and the readiness report are
all still absent, and slice 13 owns them. `pnpm verify` proves the build is internally
consistent and honest about what it simulates; **it does not prove the surface has been looked
at by a person.**

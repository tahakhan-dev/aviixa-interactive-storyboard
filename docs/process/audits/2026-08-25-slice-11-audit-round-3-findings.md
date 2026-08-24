# Slice-11 audit — round 3, findings and dispositions

Authority APP-016 item 1. Three read-only streams swept candidate `eb75092`; three fix streams and
the controller closed everything they found. **15 findings** — 5 matrix, 7 component/e2e, 3 unit.
Verified on `522b7cc`, chain exit 0.

Round 1 found 42. Round 2 found 20. Round 3 found 15.

## The finding that changes the deliverable

**`R3-06` · Critical · a client could reach 18 of 102 pages, and not one of the five surfaces.**

Controller-verified twice by BFS over the built export's own anchors, before and after. No script
navigation exists anywhere in `app/` or `src/`, so an href scan is the whole truth. The entry page
carried three destinations and **claimed** the surfaces were reached from two of them — both false:
the coverage dashboard links only its own registry indexes, and the review shell renders zero
anchors.

Every route-level assertion in `tests/e2e` and `tests/accessibility` reaches its route by
`page.goto()`. **546 green tests were fully compatible with a five-surface product a client could
not navigate to.** Now 99 of 102, all five roots reachable, held by a BFS gate comparing against
`scannableRoutes()` by equality with named exceptions.

Two lessons from its plants, both worth more than the fix. **The gate's own plant found a hole in
the gate**: a removed link *passed*, because a `serve` left running on the port served an older
snapshot while the route list came from the live `out/` — both sets matched either way. And the check
that closed that hole went red on its first run for a real reason: the layout's skip link resolves to
pathname `/` in a browser and never matches a disk-side regex.

## The other Criticals

**`R3-01` (component) · four panels a client sees, asserted by nothing.** `/frontline/run-player/`
mounts four panels from each module's `panel.tsx`; the suites asserted duplicate constants from a
different file, and `grep -rn ROUTE_PANEL tests/` returned zero. A wrong module id and heading
planted into the mounted panels left all 9,225 unit and component tests green. **This is the slice-7
defect's residue** — it shipped once as `fl-panel-undefined` for four of six modules "while every
component test passed"; the data moved to a server module and the tests were never repointed. A3 and
A4, the two that defect spared, were the only two covered.

**`R3-U01` · a correct fix emptied a gate, and the suite kept passing with less to say.** The
disclosure gate over storyboards 21-30 matched backtick-delimited decision ids. Audit C-41, earlier
the same session, stripped every backtick from those cards' rendered strings — correctly, since the
card prints text. The population went to zero and the loop stopped executing: 20 bare ids named, 0
backtick-wrapped, no assertion run. Found by instrumenting `Array.prototype` across all 179 unit
files; it was one of only two for-of loops in the suite whose body never runs.

**The shape is the round's second contribution: a correct fix in one place can silently empty a gate
in another, and nothing reds when it happens.** It is the inverse of the abstention that rots — that
one starts true and becomes false, this starts effective and becomes vacuous — and the remedy is the
same: assert the population, not only the offenders.

## What the matrix sweep established, including a negative

**No code defect of the `MOD-DOH-11` kind exists anywhere else.** Both reach maps reproduce
byte-identically from their generators — controller-verified by regenerating to scratch and diffing,
twice, before and after all disclosure work. All seventeen Hub modules were re-derived through the
build's own implementation: `derived === generated === spine` for every one. The inventory is
complete both ways: 62 source module rows, 62 modules, no orphan.

So round 2's permission error was a genuine one-off. What round 3 found instead was that **the source
disagrees with itself about who reaches a module in sixteen places, and only six said so.** The ten
are now disclosed as derived assertions — every quoted cell held to exact equality against the frozen
source with the column resolved by name, reach re-derived from the live matrix with the live rule.

**Three of the ten controller accounts were wrong, and each correction narrowed the finding.**
`MOD-DOH-08`'s two "granted roles that reach nothing" hold four screen rows between them, three of
them `Allowed` — stronger than the row's `Read-only`, not weaker; what withholds the route is one
`Unavailable` cell elsewhere. `MOD-DOH-13`'s stated reason was half the story and alone would have
been a fragile disclosure. "Withholds eight" is nine.

## Everything else

Four floors 32 routes slack under a comment arguing "a floor nobody can date is a floor nobody
trusts" — now derived from the module registers, stale numbers deleted rather than renumbered. A
"union" header covering three surfaces of five, 61 of 103 routes. A criterion titled "remains fully
operable" closing on a presence check an `aria-disabled` control satisfies. Two hand lists under
tests named "every". The only build-wide client-boundary gate covering one surface of five — nine
files convicted on widening, four deleted, five recorded with a second assertion that checks live
harm directly so the record cannot become a permission. A tautology whose comment claimed
non-vacuity. And one audit finding that was **half wrong**, caught by measuring rather than reading.

## Three controller errors in round 3

1. A brief put a matrix body one line early — the separator, not the first data row. Third locator
   error of that shape this session, and again found by an agent opening the file.
2. A plant that added `&& true &&` to a conjunction, changing nothing. The suite stayed green and
   that was nearly read as the gate being sound. **Watching a plant not red is only evidence when the
   plant is real.**
3. `git checkout` on a file with an uncommitted fix, discarding it — the second time in one session.

## Carried forward, owned by no task

Two release gates intermittently time out on the project's 5000ms default and pass at 30s, with the
failing case varying between runs. Pre-existing, unrelated to round 3, and in files no round-3 stream
owned. And two Command Center modules have the same undisclosed-exclusion shape for the Supervisor
that `DEC-TACC-001` covers for the Tenant Admin — recorded where it was found rather than folded into
a decision that does not name that role.

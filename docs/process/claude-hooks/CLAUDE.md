## graphify — ask the graph before you grep

There is a knowledge graph over **both** halves of this project: the storyboard code and the
frozen 122,241-line blueprint. 29,511 nodes, 45,578 edges, 5,180 named communities. It exists
so that "what governs closing a stuck run?" is one command instead of a search across 122,241
lines.

### Where things are

Sessions run from `Ron-project1/`, but the graph lives one directory down. **Run graphify from
the repo, not from here:**

```
cd AVIIXA_Interactive_Storyboard
graphify query "how does offline sync decide ordering on reconnection?"
graphify path "MOD-DOH-08 — Execution Summary and Anomaly Register (Delivery Operations Hub module)" "MOD-CC-13"
graphify affected "src_ui_writecontrol_writecontrol"   # what breaks if this changes
graphify explain "src_ui_writecontrol_writecontrol"
```

**Two commands want a node id, not a name, and neither says so when it goes wrong.**

`path` fuzzy-resolves a name. A bare `MOD-DOH-08` matches two nodes — the blueprint module and
`MOD_DOH_08_WRITE_ROWS` in `src/surfaces/doh/objects.ts`. `explain` refuses and names both;
`path` silently picks one, and when it picks the code node it prints "No directed path found"
for a pair that is three hops apart. Resolve the name with `explain` first, then pass the full
label or the node id.

`affected` traverses **code relations only** — calls, imports, re-exports, inherits, and nine
more. A blueprint node reached solely by `governs` or `Role(s)` returns "No affected nodes
found", which means the whitelist did not match, not that nothing depends on it. For blueprint
impact use `query` or `explain`.

### Three rules, and the first is the one that matters

**The graph never outranks the blueprint.** It is derived. This build has been bitten three
times by a derived layer mistaken for the source — an extractor's wording quoted as the
document's, an extractor's line number cited as the document's, a chunk pinning itself to a
line that was then cited. A query result is **a lead to verify, not evidence**. Open the line
it names and read it.

**Cite the blueprint, never the graph.** Blueprint nodes carry the frozen path and the real
line — `AVIIXA_Production_Product_Blueprint.md L1419` — so a citation can be opened. That is
what belongs in a comment or a test.

**Read the edge label.** `EXTRACTED` was read from the source; `INFERRED` is the graph's
opinion; `AMBIGUOUS` is flagged doubt. Currently 41,509 / 4,053 / 16.

### Keeping it current — automatic, and do not bypass it

A `Stop` hook runs `scripts/graph-update.mjs` at the end of every turn. It exits in ~0.4s when
no code changed and takes ~25s when it did, and it reports the exact delta: files re-extracted,
node and edge counts before and after, blueprint locations re-mapped, whether the committed
locator index drifted, and how many of its 10 integrity invariants hold.

**Never run `graphify update .` on this project.** It rebuilds from the code corpus alone and
writes that as the whole graph. Run once, it replaced 29,498 nodes with 6,849 and discarded
every blueprint node, reporting success. `scripts/graph-update.mjs` runs the real pipeline —
AST plus the extracted semantic layer — backs the graph up first, and restores it if the
rebuild fails or the result violates an invariant.

To update by hand, or to check staleness without changing anything:

```
cd AVIIXA_Interactive_Storyboard
node scripts/graph-update.mjs            # update if anything changed
node scripts/graph-update.mjs --check    # report staleness, change nothing
node scripts/verify-graph-integrity.mjs  # the 10 invariants, ~0.4s
```

### What the graph is worth, and where it is thin

It found **eleven wrong citations** in this build, including one that named a line 44,561 lines
from its subject. 1,019 of 1,203 identifier-anchored citations are now confirmed at the exact
line; it was 37.

It is thin in one known place: star re-exports through a barrel do not resolve, so "who uses
X" is incomplete for anything exported via `src/ui/primitives/index.ts`.

**Extraction invents things.** Four silent failure modes have been seen, all returning valid
JSON and a success code: a chunk that recorded 15% of its identifiers, 94 paths naming the
wrong chapter directory, a chunk reporting full coverage having never opened four of its files,
and twelve acceptance criteria invented by continuing a sequence. This is why the updater
verifies rather than trusts an exit code, and why a query result is a lead rather than proof.

### The full account

`AVIIXA_Interactive_Storyboard/docs/process/RESUME.md` §2a — how the graph was built, what it
covers, and every failure mode with the check that now catches it.

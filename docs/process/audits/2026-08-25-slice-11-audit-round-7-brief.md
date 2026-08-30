# Slice-11 audit — round 7

Authority APP-016 item 1: the loop repeats until a round finds nothing. Rounds 1-6 found
42 + 20 + 15 + 30 + 20 + 17 = **144**. Every one of them now carries a verdict in
`docs/process/audits/2026-08-25-slice-11-audit-dispositions-rounds-1-6.md`: **141 enumerated rows,
140 CLOSED and one PARTIAL** (`C-18`, reason and owner recorded), none OPEN. **This line read "143
CLOSED" when the brief was dispatched** — back-derived from the declared 144 rather than counted
from the table, which is round 6's own arithmetic shape. Stream A convicted it as `R7-A7` and it is
corrected here rather than in the register alone. **That record is round 6's own
deliverable and has never been audited by anyone but its author.**

Candidate `SLICE11-3ee592fe2eac068e`, tree clean. Chain measured this session on exactly these bytes:
typecheck 0 · lint 0 · gate-ordering 33/33 · freshness 3/3 · unit **6280**/182 files ·
component **3054**/108 · build **102/102** · release **1000**/33 · playwright **548**.
Frozen source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines, read-only,
re-hashed at session entry and unchanged.

## Constraints

- **READ ONLY.** No writes under `src/`, `app/`, `tests/`, `registries/`, `docs/`, `scripts/`.
  Scratch under `/tmp` only. **Never run `git`** for anything that writes; reading history is fine.
- **Run no build.** `pnpm build` rewrites `out/` and `registries/generated/` underneath the other
  two auditors — that is finding `R6-T02`, now recorded in `vitest.config.ts`. You may run a single
  named vitest file (`npx vitest run --project release <file>`) when a claim needs it; if it reds,
  re-run it alone before reporting, and say which.
- **Every count you report is one you measured, and you name the command.**
- **Measure rendered text with the React flight payload stripped.** A raw `grep` over `out/`
  measures row keys, not what a reader sees — controller defect 9 in `RESUME` §8.
- **An empty report is a valid and valuable result.** A round that finds nothing closes this loop.
  Say what you covered and how, so the next round does not repeat it.

## The one rule that outranks this brief

**This brief is not the source.** Every figure here is a controller hypothesis, and this build has
recorded 43 + 31 + 19 + 12 controller brief errors, every one found by an agent opening the line.
Open the line. A brief error found is a finding. `graphify query|path|explain` is an index over the
frozen source: a lead, never evidence. Cite the blueprint line, never a graph node.

## What is already swept — do not repeat it

- All gate files for "a gate that cannot fail" (rounds 1-5, three separate sweeps).
- Every permission matrix and both module reach maps against the source (rounds 2-3).
- Identifier-anchored citations at scale (round 2: 1,714; round 5: all 300 in the reconciliation
  artefact).
- Navigational reachability of the export, both directions, held by a BFS gate.
- Master prompt §29.1 and §29.4, bullet by bullet (round 6, stream B).
- The count-scope separation, the five surfaces, the nine roles, the open-decision disclosures.

## The three streams

### Stream A — the round-6 wave, and the session that died under it

The wave (fix streams S, T, U) was interrupted mid-flight: no stream wrote a report, and the
controller measured and committed their work in a later session. Two things follow, and both are
your subject.

1. **The work itself.** `R6-A01`…`-A05`, `R6-B01`…`-B08`, `R6-C01`, `R6-C02`, `R6-T01`, `R6-T02`.
   For each, open the register entry, open the fix, and answer one question: **is the finding
   closed, or is the artefact merely different?** Round 6's own shape was a fixer's recorded
   reasoning refuted by measurement — apply it to the fixers' new reasoning, including the
   controller's.
2. **The dependents the interruption left stale.** The census denominator moved 608 → 605 and seven
   sites had to follow. The controller found seven. **Find the eighth.** Any figure derived from
   the actionable-controls census — 605, 627, 759, the §13.1 closure distances, the census total —
   in any comment, rendered string, register, doc or gate.

### Stream B — the client-facing deliverables, never audited

`docs/walkthroughs.md`, `docs/client-review-guide.md`, `docs/screenshots/` and the screenshot
manifest, against master prompt §27.2 and against the served export.

§27.2 requires per-step reset/checkpoint, persona, scope, route, what the client sees, action,
expected validation, result, cross-surface effect, decision prompt, failure branch, recovery and a
screenshot link; and a manifest keyed by sixteen named fields. Round 6 measured the manifest at five
fields, one of them on the list. **Measure what each artefact actually carries, and check the routes
and controls a walkthrough names against the export that exists.** A walkthrough step naming a
control that no page renders is the same defect class as a citation naming a line short of its
claim.

### Stream C — slice 11's product substance, on the parts never sampled

The thirty chapter-44A storyboards, the `FAIL-AI-*` catalogue across its five registers, the
thirteen agent abilities and twelve prohibitions, and the sixteen-mode machine.

Apply master prompt §8.6.1's label-swap test: **if a screen's title and module label could be
changed and its body would still be semantically valid for another module, it fails.** Sample
across surfaces rather than reading one deeply, and check each sampled claim against its frozen
source line. The absolute rule slice 11 exists to protect is **L89439**: cached approved guidance
and deterministic rules are never, on any surface, described as live artificial intelligence. A
violation is Critical.

## Report format, per finding

```
R7-NN | Critical | Important | Moderate | Minor
  shape:     one of the eight below, or NEW: <name it>
  subject:   file:line, or the identifier and its source locator
  evidence:  what you measured and the command that measured it
  why it matters: what a reader or a future change gets wrong
  smallest fix: one sentence
```

**Critical** = ships a falsehood to a reader, a gate that cannot fail, or a
permission/authority/safety error.

## The shapes, in the order the rounds produced them

1. A gate that cannot fail.
2. A population control verifying a SUBSET, PREFIX or AGGREGATE where the claim is every member.
3. A fix without its gate, or a gate without its fix.
4. A correct fix that silently empties a gate's population elsewhere.
5. A figure or an abstention published to a reader that the source refutes.
6. A recorded justification — a comment, a reason field, a register paragraph — that measurement
   refutes. Round 6's shape, and it convicted three authors in one round.
7. **A gate that reds on success.** Round 6's close produced two: a vocabulary assertion requiring
   an `OPEN` row to exist, and a plant that needed one. Look for assertions whose subject is the
   defect they exist to prevent.
8. A citation naming a line short of its claim; an `L`-prefixed number is a citation wherever it
   appears, including in prose and in comments.

## Rules

1. The frozen source outranks this brief, the registers, `graphify`, and any comment in the tree.
2. Do not "correct" a citation of the section/row form — a citation may name a line inside a section
   rather than the identifier's own line. Five accurate citations were nearly broken this way.
3. Prove a gate permeable by planting a REAL defect, and check the plant is real: `&& true &&` cost
   this build a cycle. Plant into a `/tmp` copy or replay in node, and say which.
4. Where you cannot reproduce a figure, report that you could not — not that it is wrong.

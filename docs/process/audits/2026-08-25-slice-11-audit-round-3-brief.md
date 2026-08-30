# Slice-11 audit — round 3

Authority APP-016 item 1: the loop repeats until a round finds nothing. Round 1 found 42, round 2
found 20. All 62 are closed and verified.

Candidate `eb75092`, tree clean, chain exit 0: typecheck 0 · lint 0 · gate-ordering 27/27 ·
freshness 3/3 · unit **6193**/179 files · component **3032**/108 · build **102/102** · release
**863**/27 · e2e/axe **545**. Frozen source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines, read-only.

You are **read-only**. Do not write under `src/`, `app/`, `tests/`, `registries/`, `docs/` or
`scripts/`. Scratch under `/tmp`. Never run `git`.

## Why round 3 goes where it goes

Round 2's single most valuable finding was not found by an auditor. It was found by *widening a gate
population*: the only general gate on Hub module reach covered seven of nineteen modules, and the
moment it covered all of them it convicted `MOD-DOH-11` — the delivered artefact **granted a role
that reaches nothing in that module and omitted the Read-only Auditor from the audit module.**

Two consequences set this round's targets.

**First: that defect class is a data-versus-source disagreement, and only one module's worth was
ever checked.** There are five surfaces and dozens of permission matrices. If one shipped wrong,
assume others may.

**Second: round 2's shape-1 sweep covered `tests/coverage/` only — 27 files.** `tests/unit` is 179
files and `tests/component` is 108, and nothing has ever swept them for assertions that cannot fail.
That is 287 unswept files guarding most of the build.

## The shapes, restated with round 2's addition

1. **A gate that cannot fail** — a floor where an equality belongs, a stateful `/g` regex, a
   disjunct that satisfies the case regardless, a loop over a possibly-empty array, a subset
   assertion, a scan whose population can be zero.
2. **A population control that verifies a SUBSET, a PREFIX, or an AGGREGATE where the claim is
   every member.** Round 2's shape, and the one that hid a wrong permission set. A gate covering
   seven of nineteen is this. So is a floor of `> 0` on a set that should be an equality.
3. A fix without its gate, or a gate without its fix.
4. A claim in prose or rendered text that the tree or the source contradicts.
5. A published figure nobody can reproduce.
6. A citation naming a line short of its claim.
7. A disclosure or component reachable from nothing; a stated abstention that has outlived its truth.

## Report format, per finding

```
R3-NN | Critical | Important | Moderate | Minor
  shape:     one of the seven, or NEW: <name it>
  subject:   file:line, or the identifier and its source locator
  evidence:  what you measured and the command that measured it
  why it matters: what a reader or a future change gets wrong
  smallest fix: one sentence
```

**Critical** ships a falsehood to a reader, is a gate that cannot fail, or is a permission/authority
error. Report NOTHING you did not measure. **An empty report is a valid and valuable result** — a
round that finds nothing is what closes this loop, and manufacturing a finding to look thorough
would hide that. Say what you covered.

## Rules

1. **The frozen source outranks everything** — this brief, the registers, `graphify`, and any
   comment in the tree. `graphify query` returns leads; open the line it names before citing it, and
   cite the blueprint line, never a graph node.
2. **Every count in this brief is a hypothesis.** Nine controller locators were wrong in round 1 and
   the controller cited a blank line twice in round 2. Measure.
3. **An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears, including in
   prose and including in a list of suspect citations.** Write suspect locators as `id` + `line`
   fields, never as `L<n>`, or you will convict yourself. This has now happened twice.
4. **Do not "correct" a citation of the section/row form.** A citation may name a line inside a
   section rather than the identifier's own line. An auditor checked 1,714 identifier-anchored
   citations and 43 of 45 mismatches were that legitimate idiom.
5. **Prove a gate is permeable by planting**, not by reading it. You may not write to the tree:
   plant into a `/tmp` copy or replay the gate's logic in node, and say which you did.
6. Where you cannot reproduce a figure, report that you could not — not that it is wrong.

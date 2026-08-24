# Slice-11 audit — round 4

Authority APP-016 item 1: the loop repeats until a round finds nothing. Round 1 found 42, round 2
found 20, round 3 found 15. All 77 are closed and verified.

Candidate `522b7cc`, tree clean, chain exit 0: typecheck 0 · lint 0 · gate-ordering 27/27 ·
freshness 3/3 · unit **6249**/179 files · component **3032**/108 · build **102/102** · release
**864**/27 · e2e/axe **548**. Frozen source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines, read-only.

You are **read-only**. No writes under `src/`, `app/`, `tests/`, `registries/`, `docs/`, `scripts/`.
Scratch under `/tmp`. Never run `git`.

## What is already swept, so you do not repeat it

- `tests/coverage` (27 files), `tests/unit` (179), `tests/component` (108), `tests/e2e`,
  `tests/accessibility` — all swept for gates that cannot fail. Four, two and three real instances
  respectively. Do not re-sweep these for shape 1.
- Every permission matrix against the source, both reach maps, the module inventory both ways.
- `src`/`app` comments and rendered strings, and every generated registry's metadata, for claims
  measurement refutes.
- Identifier-anchored citations: 1,714 checked in round 2 (43 of 45 mismatches were the legitimate
  section/row idiom), plus the five surface module trees in round 3.
- Navigational reachability of the export.

## Round 4's subject: the product, against the source and against the master prompt

Three streams. **The rendered product has never been checked at scale against the blueprint**, and
the master prompt's own completeness gates have never been audited against the build.

## The shapes, with round 3's addition

1. A gate that cannot fail.
2. A population control that verifies a SUBSET, PREFIX or AGGREGATE where the claim is every member.
3. A fix without its gate, or a gate without its fix.
4. **A correct fix that silently emptied a gate's population.** Round 3's shape: the gate starts
   effective and becomes vacuous, and nothing reds. Look for gates whose subject was changed by an
   earlier fix — markup, naming, field moves, type changes.
5. A claim in prose or rendered text that the tree or the source contradicts.
6. A published figure nobody can reproduce.
7. A citation naming a line short of its claim.
8. A disclosure or component reachable from nothing; an abstention that outlived its truth.

## Report format, per finding

```
R4-NN | Critical | Important | Moderate | Minor
  shape:     one of the eight, or NEW: <name it>
  subject:   file:line, or the identifier and its source locator
  evidence:  what you measured and the command that measured it
  why it matters: what a reader or a future change gets wrong
  smallest fix: one sentence
```

**Critical** ships a falsehood to a reader, is a gate that cannot fail, or is a
permission/authority/safety error. Report NOTHING you did not measure. **An empty report is a valid
and valuable result** — a round that finds nothing is what closes this loop. Say what you covered.

## Rules

1. **The frozen source outranks everything** — this brief, the registers, `graphify`, any comment in
   the tree. `graphify query` returns leads; open the line it names before citing it, and cite the
   blueprint line, never a graph node.
2. **Every count in this brief is a hypothesis.** Controller locators have been wrong nine times
   plus three more, every one found by an agent opening the file. Measure.
3. **An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears** — in prose, in
   a comment, in a list of suspect citations. Write suspect locators as `id` + `line` fields. This
   has now convicted three different authors.
4. **Do not "correct" a citation of the section/row form.** A citation may name a line inside a
   section rather than the identifier's own line.
5. **Prove a gate is permeable by planting, and check the plant is real.** A plant that changes
   nothing produces a green run that reads exactly like a sound gate. Round 3 lost a cycle to
   `&& true &&`. Plant into a `/tmp` copy or replay in node; say which.
6. Where you cannot reproduce a figure, report that you could not — not that it is wrong.

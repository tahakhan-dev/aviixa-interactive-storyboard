# Slice-11 audit — round 2

Authority APP-016 item 1: the loop repeats until a round finds nothing. Round 1 found 42 and all
42 are dispositioned and closed. **A green chain is not the audit.** Round 1's own lesson is that
every one of its 42 findings shipped behind a green suite.

Repo root `/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`.
Candidate `c6ae6df`, tree `11167db6aadb`, clean. Frozen source
`../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines, read-only.

Measured on this candidate: typecheck 0 · lint 0 · gate-ordering 27/27 · freshness 2/2 · unit
6187/179 files · component 3032/108 · build 102/102 · release 856/27 · e2e/axe 545. Chain exit 0.

You are **read-only**. Do not write under `src/`, `app/`, `tests/`, `registries/`, `docs/` or
`scripts/`. Scratch files under `/tmp` are fine. Never run `git`.

## What round 2 is looking for

Round 1's findings clustered into shapes. Round 2 hunts the same shapes in places round 1 did not
reach, and it hunts NEW shapes. Do not re-verify round 1's closures — those are recorded in
`docs/process/audits/2026-08-24-slice-11-audit-dispositions.md` and were each measured twice.

The shapes, with the round-1 instance so you know what one looks like:

1. **A gate that cannot fail.** A `> 0` floor where an equality belongs; a stateful `/g` regex in
   a `.test()` filter; a disjunct that satisfies the case regardless; a loop over a possibly-empty
   array; a subset assertion that passes on equal sets; a scan whose population is zero.
2. **A fix without its gate, or a gate without its fix.** Five of round 1's eight partials.
3. **A claim in prose that the tree contradicts.** A comment or a rendered string stating a count,
   a file list, an absence or an attribution that measurement refutes.
4. **A citation that names a line short of its claim** — the detail real, and at an uncited line.
5. **A published figure nobody can reproduce.** Round 1: a generated artefact claiming 210 where
   the shape it names yields 166.
6. **A disclosure or component reachable from nothing**, and its inverse — a stated abstention
   that has outlived its truth.
7. **A scan whose stated scope is wider than its actual roots.**

## Report format, per finding

```
R2-NN | Critical | Important | Moderate | Minor
  shape:     one of the seven above, or NEW: <name it>
  subject:   file:line, or the identifier and its source locator
  evidence:  what you measured and the command that measured it
  why it matters: what a reader or a future change gets wrong because of it
  smallest fix: one sentence
```

**Critical** ships a falsehood to a reader or is a gate that cannot fail. **Important** is a real
gap or a stale claim. Report NOTHING you did not measure. An empty report is a valid and valuable
result — say so plainly rather than manufacturing a finding to look thorough.

## Rules

1. **The frozen source outranks everything** — this brief, the register, `graphify`, and any
   comment in the tree. `graphify query` returns leads; open the line it names before citing it,
   and cite the blueprint line, never a graph node.
2. **Every count in this brief is a hypothesis.** Nine controller locators were wrong in round 1
   and every one was found by an agent opening the line — including two paths that do not exist.
3. **Prove a gate is permeable by planting**, not by reading it. Plant into a `/tmp` copy or
   replay the gate's logic in node, since you may not write to the tree. Say which you did.
4. Where you cannot reproduce a figure, report that you could not — not that it is wrong. Round 1
   has one finding recorded as unconfirmed for exactly this reason and it was the right call.

# Slice 11 — verification record

**This record did not exist until now, and its absence was itself a finding.** Slice 11 closed
five waves without one, and its wave-5 close reported a chain that omitted `pnpm test:e2e`
entirely — audit C-00. Slices 5 through 10 each have a record in this directory; slice 11 had
none, so nothing in the build's own evidence said whether its end-to-end and accessibility
suites had ever run on its bytes. They had not.

## The candidate

```
commit    c6ae6df
tree      11167db6aadb
frozen source  47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
               18,565,031 bytes · 122,241 lines
```

The source was re-hashed at session entry, before the audit dispatches, and again on this
candidate: unchanged throughout. `git status --porcelain` was empty before the chain started
and empty after it finished, so every figure below is measured on exactly these bytes.

## The chain, every step, in the order `pnpm verify` runs them

| step | result |
|---|---|
| `pnpm typecheck` | exit 0, no diagnostics |
| `pnpm lint` | exit 0 |
| `pnpm check:gate-ordering` | **27** release gates, all audited; 15 read a subject an earlier step rewrites, each saying where it runs and why |
| `pnpm test:freshness` | 2/2 |
| `pnpm test:unit` | **6187** in 179 files |
| `pnpm test:component` | **3032** in 108 files |
| `pnpm build` | **102/102** static pages |
| `pnpm test:release` | **856** in 27 files |
| `pnpm test:e2e` | **545** in 8.4m, zero failures |

Chain exit code **0**. Not a tail line — `grep -c ELIFECYCLE` over the full log is 0, which is
the check this build added after a `| tail -3` printed "532 passed" as its last line while the
command exited 1.

## What this candidate contains that the wave-5 candidate did not

The round-1 audit register held 42 findings and **no verdicts**. Eight commits had closed
findings the file still listed as open, and one had shipped a gate without the fix it was
written for. Five read-only streams verified every band against the tree — opening the file or
running the command, never reading a commit message. Verdicts and their evidence are in
`docs/process/audits/2026-08-24-slice-11-audit-dispositions.md`.

All eight findings that verification left OPEN or PARTIAL are now closed:

- **C-13 · C-15 · C-19** — three gates a verifier had planted into and watched stay green. The
  hoisted symbol list reached two of three consumers; the `.tsx`-only closure limit was prose;
  a task-scoped gate keyed on eleven hand-written paths could not see a twelfth file.
- **C-18.7** — a case that could not fire at all: a `/g` regex used with `.test()` inside a
  filter, plus a `startsWith` disjunct that satisfied it even with the pattern replaced.
- **C-27 residual · C-29 · C-30 · C-31 · C-32 part 3** — a prefix that swallowed the family it
  was added for, a published `sourceLineMeaning` contradicted by its own row, a mode-matrix
  claim wrong for two of three pairs, a stated scope a third wider than its sweep, and a
  published figure of 210 that measures 166.
- **C-33 · C-38 · C-39 · C-40 · C-41** — the thirty storyboards' rendered text: one final-state
  name that asserted a standing guarantee had happened, fifteen audit citations naming a line
  short of their claim, and four strings reaching the reader as raw asterisks.
- **C-23** — the screenshot manifest, 85 rows against a 102-route export, three slices stale.
- **C-36 · C-37** — two disclosures that lived in a record and a comment and reached no reader.

## Three things this verification pass found that the audit did not

**A gate convicted a file for documenting its own compliance.** `prohibited-patterns`'
`dangerouslySetInnerHTML` scan read raw bytes, so it red on the first file to explain in a
comment why it does not use the property. It now strips comments as its sibling scans do, with
a control case asserting it convicts in code and not in prose — so a future red cannot be
closed by moving the property into a comment.

**A disclosure outlived its subject, and the gate for that caught it.** Restoring the source's
classification marking to storyboard 7's final-state name collapsed two rendered runs into one,
so the unmarked run's disclosure had nothing left to disclose. Deleted rather than widened,
which is the instruction in the gate's own failure message.

**39 author-machine paths were inside the Product Candidate.** The author-path scan walked
`out/` only — right for the confidentiality rule, and not the rule master prompt §30 states.
Twenty unit tests and nineteen committed extract records carried an absolute home-directory
path. `docs/` keeps its 22 as provenance, named as an equality-asserted exemption so a
twenty-third location reds.

## The process defect this round exposes, stated plainly

Five of the eight PARTIAL verdicts were one defect wearing five costumes: **the fix landed and
its gate did not, or the gate landed and the fix did not.** A finding is closed when the change
and the thing that reds without it both exist. Six closes in this round are still held by
nothing but a comment, and the disposition register names them individually rather than
counting them as safe.

The second is cheaper to state and was more expensive here: **I committed a change after
verifying unit, component, typecheck and lint, and not the release suite.** That shipped a red
gate, and a concurrent stream found it rather than me. The chain has nine steps for a reason.

## Locator discipline

Nine controller brief locators were wrong this session and every one was found by an agent
opening the line — including two file paths that do not exist, and a suggested citation
(L92881) that carries half of the clause it was offered for, where L92861 carries both. The
rate is unchanged from previous slices. Assume every locator in a brief is a hypothesis.

## Status

Slice 11's implementation and its round-1 audit are complete and verified on `c6ae6df`.
**The slice is not closed**: APP-016 item 1 requires the audit loop to repeat until a round
finds nothing, and round 1 found 42. Round 2 runs next, against the frozen source and against
the code rather than against a green chain.

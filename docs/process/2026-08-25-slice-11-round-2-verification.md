# Slice 11 — round-2 verification record

Round 1 (42 findings) and round 2 (20 findings) of the APP-016 audit loop are closed. **The slice
is not closed**: the loop repeats until a round finds nothing, and round 3 is running.

## The candidate

```
commit    eb75092
frozen source  47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
               122,241 lines · re-hashed unchanged at session entry, before each dispatch,
               and on this candidate
```

`git status --porcelain` empty before the chain and after it.

## The chain, in the order `pnpm verify` runs it

| step | result |
|---|---|
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm check:gate-ordering` | **27** release gates, all audited |
| `pnpm test:freshness` | 3/3 |
| `pnpm test:unit` | **6193** in 179 files |
| `pnpm test:component` | **3032** in 108 files |
| `pnpm build` | **102/102** static pages |
| `pnpm test:release` | **863** in 27 files |
| `pnpm test:e2e` | **545** in 8.9m |

Chain exit **0**, measured as `grep -c ELIFECYCLE` over the whole log rather than read off a tail
line.

## What round 2 changed, and what it cost to find

Twenty findings, four Critical. Two streams found two of them **independently**, which is the
strongest evidence the round produced.

The finding that matters most was not found by an auditor at all. **Widening one gate's population
from seven of nineteen Hub modules to all nineteen convicted `MOD-DOH-11` immediately**: the
delivered reach map granted a role that reaches nothing in that module, and omitted the Read-only
Auditor from the audit module. A permission error in a delivered artefact, behind a green chain,
for as long as that population was a subset.

That is round 2's shape, and it is worth more than the twenty findings: **a population control that
verifies a subset, a prefix, or an aggregate where the claim is every member.** The remedy is always
an equality over a named literal list, never a bigger number.

## Three gate limits closed, each with the trap inside it named

- `offline-phrasing` guarded a per-page claim with an aggregate floor: 92 of 102 pages could render
  nothing and every absence assertion stayed green, while its own docblock claimed that case was
  covered.
- The citation-corroboration gate scanned no prose, leaving 16% of the build's evidence unmeasured —
  the blind spot round 1 found 28 bad references in by hand. Widening it took uncorroborated from 12
  to 31 against a ceiling of 20, and **neither the ceiling nor a single citation was changed.**
- The screenshot manifest's only coverage check lived inside the writer that produced it, under a
  project `verify` does not run. A writer cannot detect that it was never run.

## Four controller defects, recorded rather than smoothed over

I committed after verifying four of nine chain steps and shipped a red gate that a concurrent stream
found. I cited a blank line in the round-2 register and the gate widened earlier in that same round
convicted it. My correction named the blank line again in prose and was convicted again — an
`L`-prefixed number is a citation wherever it appears, which is precisely why the gate stream wrote
its allowance entries as `{ id, line }`. And nine brief locators were wrong, every one found by an
agent opening the line.

## Status

Rounds 1 and 2 complete and verified on `eb75092`. Round 3 sweeps two populations nothing has ever
swept — every permission matrix against the source, and the 287 files of `tests/unit` and
`tests/component` — plus the shapes both earlier rounds produced.

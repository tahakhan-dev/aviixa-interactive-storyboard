# Fix stream D — two disclosures a reader cannot reach

Authority APP-016 item 1, slice-11 audit round 1, findings **C-36** and **C-37**. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`.
Frozen source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

Both findings are the same class, and this build has shipped it twice before: **a component
reachable from nothing is not shipped, and a stated abstention and an oversight look identical
from outside.** These two are the inverse — a disclosure that exists in a data structure or a
comment and reaches no reader at all.

## Files you own — write to these and NOTHING else

```
app/workflows/ai-and-its-absence/AiAndItsAbsenceScreen.tsx
app/workflows/ai-and-its-absence/scope.ts
tests/component/ai-and-its-absence-route.test.tsx
```

You may READ anything. `src/ai/storyboards/**`, `src/ai/fallbacks/registry.ts`,
`src/coverage/uninventoried.ts` and every `tests/coverage/**` gate are owned elsewhere or
settled — do not write to them. Never run `git`.

## C-36 — `SB_21_TO_30_CONTRACT_SEAMS` has no consumer

`src/ai/storyboards/sb-21-to-30/storyboards.ts` declares a seam record (around `:109-182` —
verify the lines, another stream edited this file today). A sweep found it referenced by its own
declaration, two comments, and the findings register. **No screen renders it and no test asserts
it.** The build's only disclosure of the missing sixth `contentOrigin` member — the case where a
storyboard renders no guidance at all, for which four cards took `'authored'` as least-wrong —
is unreachable by a reader.

Render it as a section of `AiAndItsAbsenceScreen.tsx` beside the existing disclosure sections,
carrying each record's subject, finding, what the task did, and the storyboard numbers it
concerns. Assert in `tests/component/ai-and-its-absence-route.test.tsx` that every record
appears — **by equality against the exported array, not by a `> 0` floor**: audit C-18.4 is
exactly the finding that a floor of one does not catch a drop from sixteen.

## C-37 — the four-way collision is stated only in a comment, and the intro names two chapters

Two halves, both measured open.

**(a)** `src/ai/fallbacks/registry.ts:13-14` states that `FB-AI-01` carries four meanings across
chapters. The screen prints each registry row's own `contract` field, so a reader meets 30D.8's
`FB-AI-01` subject ("the trace store is unavailable while an agent is running", L74495) and
chapter 40.12's `FB-AI-12` subject ("Trace and decision-record failure", L88927) as two
unrelated list items. **Nothing on the page says they are the same subject under two literals.**
Add one sentence to the collision section stating it, citing both lines.

**(b)** The intro prose (around `:226`) reads "Chapter 40 and 41 hold a fallback-contract
register of their own", while its own first list item names owners in chapters **24** (L46951)
and **30D.8** (L74495). Widen the sentence to name what it actually lists.

Open every line before citing it. Confirm the four meanings yourself — a verifier found the
collision is **not** confined to the `FB-AI-01…16` range, and that a fifth `FB-AI-` register
exists in a second zero-padding convention (`FB-AI-001`…`-010` in
`src/ai/fallbacks/contracts.ts`, disjoint from the collision registry's `FB-AI-00`/`-01`…).
If what you measure differs from this brief, report your measurement and the command.

## Non-negotiable

- **Reachability is the finding.** Report, for each thing you add: which route renders it, which
  file mounts that route, and what links to it. A section imported but not mounted repeats the
  defect — an import edge is not a mount, and this build has a gate that went green at 54 of 54
  because of exactly that.
- **Every assertion you add must be able to fail.** Plant the defect it names — remove a record,
  drop the sentence — watch the case red, check the red came from the assertion you meant, and
  restore byte-identically. Both `shasum -a 256` values in the report.
- Every count and line number in this brief is a hypothesis. Report your own measurement.
- Verify with `npx vitest run --project component`, `npx tsc --noEmit`, and `pnpm build` — a
  server/client boundary defect in `app/` is visible only in a build, and this build has shipped
  six of those at once.

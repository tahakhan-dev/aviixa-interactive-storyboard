# Fix stream B — the uninventoried closure and the generators' own claims

Authority APP-016 item 1, slice-11 audit round 1. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`.
Frozen source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines, read-only.

## Files you own — write to these and NOTHING else

```
src/coverage/uninventoried.ts
scripts/build-registries.mjs
scripts/build-locator-index.mjs
tests/unit/coverage-uninventoried.test.ts
registries/generated/**        (only by RE-RUNNING the generator, never by hand)
registries/blueprint-locators.json  (only by re-running its generator)
```

Another stream owns `src/ai/storyboards/**` and
`tests/unit/ai-storyboard-contract-invariants.test.ts`. Do not touch those, `app/`,
`tests/coverage/` or `docs/`. Never run `git`.

## Five items, each measured by an independent verifier this session

**1. The accounted-elsewhere prefix match swallows the family it was added for.** In
`src/coverage/uninventoried.ts`, `NAMESPACES_ACCOUNTED_ELSEWHERE`'s `FB-` entry is matched with
`startsWith`, so `FB-AGT-*` — the family audit C-27 called the worst of the three — is absorbed
by it. Measured: delete the `FB-AGT-` family declaration entirely and the general sweep's
remainder is still `[]`, so the declaration is currently load-bearing for nothing. Fix the
match to respect a namespace boundary, or subtract accounted prefixes only for identifiers no
declared family claims. Prove the fix by showing the sweep now convicts the deletion.

**2. `ai-storyboards.json` publishes a `sourceLineMeaning` that one of its own rows
contradicts.** It says the line is "the FIRST MENTION … the minimum of
`registries/raw/identifier-index.json`'s line list". After the C-29 fix, `SB-AI-01` ships
`92693` while that minimum is `74479` — correctly, because a banded register takes the first
occurrence inside its own chapter. One of 613 rows. Correct the published meaning
(`build-registries.mjs:114`) so the artefact stops describing itself wrongly.

**3. A claim about the mode matrix that is wrong for two of three pairs.**
`src/coverage/uninventoried.ts:291-293` says `AIMODE-13`/`-14`, `-03`/`-15` and `-01`/`-16` are
byte-identical across all five contract columns. Only `-13`/`-14` are.  `-03`/`-15` differ on
*Agent invocation* and *Classification*; `-01`/`-16` differ on *Classification*. Verify that
yourself against the matrix in the frozen source AND against `src/ai/modes/vocabulary.ts`, then
correct it. `src/surfaces/cc/modules/cc-08/degradation.ts` states it correctly, so this is two
copies of one claim with one drifted — say which is which in the fix. "Thirteen distinct
labels" is right and is a different claim (16 modes, three duplicate worker-visible labels).

**4. A stated scope the sweep does not cover.** The chapter-44 abstention's reason text claims
no `AC-44-*`/`TEST-44-*` occurs in "src/, app/ or tests/", but `SWEPT_ROOTS` is `['src','app']`.
It is true today and ungated for a third of what it claims. Either widen the sweep or narrow
the sentence — and whichever you choose, the gate must red if the claim stops being true.

**5. A published figure nobody can reproduce.** `registries/blueprint-locators.json`'s `note`
claims 210 `src`+`app` identifiers occur in the frozen source with no key in the index. An
independent measurement got **166** under the same token shape that reproduces the note's other
figure (11 under `src/ai/`) exactly; 173 under the loosest word-boundary variant, 542 without
the source-presence filter. Compute the figure in `build-locator-index.mjs` and interpolate it,
the way the generated registries already do for their counts, so it cannot be typed wrong.
Report the value your generator computes and the shape you used.

## Non-negotiable

- **Regenerate, never hand-edit, anything under `registries/`.** Then prove reproducibility:
  `npx vitest run --project release tests/coverage/registry-freshness.test.ts`.
  `registries/blueprint-locators.json` must keep the frozen source's sha256 and its
  **122,241**-line count — the generator drops the trailing empty element from `split('\n')`
  deliberately, and its verifier now asserts both conventions.
- **Every gate you touch must be able to fail.** Plant the defect it names, watch it red,
  restore byte-identically, and put both `shasum -a 256` values in your report. Where a plant
  would mean writing outside your file list, replay the gate's own logic over a `/tmp` copy and
  say that is what you did.
- The frozen source outranks this brief. Every count above is a hypothesis; report your own
  measurement and the command that produced it.
- Verify with `npx vitest run --project unit` and `--project release`, and report exact counts.

## 6. A gate case that cannot fire — added after dispatch, verified in node by a second stream

`tests/unit/coverage-uninventoried.test.ts:191` reads

```
[...SWEPT.keys()].filter((id) => pattern.test(id) || id.startsWith(prefix))
```

and it is broken twice over:

- `pattern` carries the `g` flag from `tokenPattern` (`:101`), so `.test()` is **stateful**.
  Demonstrated: over `['AI-01','AI-02','AI-03','AI-04']` the shipped filter returns
  `['AI-01','AI-03']` where an un-flagged clone returns all four.
- the `|| id.startsWith(prefix)` disjunct satisfies the case for all four **even with the
  regex replaced by `/ZZZ/`**, so the failure message "so its regex is broken" can never fire.

Drop the disjunct and match with a non-global clone (`new RegExp(pattern.source)`), or `exec`
against a reset regex. Then plant a genuinely broken pattern and watch the case red — that is
the whole point of this item.

# Fix stream A — the thirty storyboards' rendered text

Authority APP-016 item 1, slice-11 audit round 1. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`.
Frozen source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines, read-only.

## Files you own — write to these and NOTHING else

```
src/ai/storyboards/sb-01-to-10/index.ts
src/ai/storyboards/sb-21-to-30/storyboards.ts
tests/unit/ai-storyboard-contract-invariants.test.ts
```

Another stream owns `src/coverage/uninventoried.ts`, `scripts/build-*.mjs` and
`tests/unit/coverage-uninventoried.test.ts`. Do not read-and-measure those; do not touch
`app/`, `tests/coverage/`, `docs/` or anything under `registries/`. Never run `git`.

## C-39 — one of seven divergences changes a claim

`finalOfficialState.name` is presented as a transcription of each card's own content cell.
Seven diverge from the cell beside them. **Only one alters a claim and it is the one to fix:**
`sb-21-to-30/storyboards.ts:1332` renders `Every class 1 and 2 item reached the platform
intact`, while the card's own cell at `:1280` and the frozen source at **L94677** both read
**reaches**. The source states a standing guarantee; `reached` asserts that it happened.

Fix that one. The other six are attribution or punctuation drops — `SB-AI-05` and `SB-AI-07`
drop `[SoW Fact — §3.3]`, `SB-AI-08` drops `[SoW Fact — §3.8]` (note: the register said all
three were §3.3 and it was wrong), and `SB-AI-22`, `-25`, `-26` rewrite a sentence break.
Decide explicitly between restoring them verbatim and labelling the field a derived
restatement, and record the decision where a reader meets it. Do not leave it unstated.

## C-40 — three audit-entry citations name a line carrying only part of their statement

Each detail is real and sits at an UNCITED line. Verify all three against the source before
editing, then re-point or split:

- `sb-01-to-10/index.ts:311-315` `breaker-open` cites L92891; the threshold clause is L92881.
- `sb-21-to-30/storyboards.ts:1159-1163` `SB-AI-22-AUD-2` cites L94583; the detail is L94563.
- `sb-21-to-30/storyboards.ts:2461-2467` `SB-AI-30-AUD-1` cites L95266; the detail is L95243.

There are **143 audit entries across the thirty**. The register says thirteen are affected; a
verifier could reproduce 44 candidates under a word-presence scan and could not confirm
thirteen. **Measure the population yourself** with a substantive-clause reading, report your
count and your method, and fix every one you convict — not only the three above.

## C-41 — four rendered strings ship raw markdown, and backticks render three ways

`src/ui/shared/StoryboardCard.tsx` prints text: no markdown renderer, no
`dangerouslySetInnerHTML`. So `**not**` reaches the reader as asterisks.

Exactly four strings carry `**`. Two are the source's own emphasis, transcribed
(`SB-AI-02.content.workerVisibleExperience`, `SB-AI-05.content.conflictResolution`); two are
**this build's own prose** (`SB-AI-02.absentCapability.statement`,
`SB-AI-03.absentCapability.statement`). Strip the markup from the build-authored two — nothing
is lost. For the transcribed two, choose: strip and lose the source's emphasis, or keep and
render asterisks. State the reason.

Separately, backticks: **206** in the 01-10 band, **0** in 11-20, **192** in 21-30 — one field
type, three renderings. Pick one policy for all thirty and apply it.

## The gate, and it must be able to fail

Put it in `tests/unit/ai-storyboard-contract-invariants.test.ts`. It must assert the chosen
markdown and backtick policy over **all thirty cards**, and the corrected citations against
the frozen source rather than against a stored copy.

**Then plant the defect it names, watch it red, and restore byte-identically** — `shasum -a
256` before and after, both hashes in your report. A verifier established this session that
the fabricated-quotation fix from C-33 is held by nothing: it planted the old string back and
the whole chain stayed green. Do not repeat that shape.

## Rules

1. The frozen source outranks this brief, the findings register and `graphify`. Every count
   here is a hypothesis — three times in this build an agent checked a controller figure and
   found it wrong. Report your measurement, not "confirmed".
2. `graphify query` returns leads. Open the line it names before citing it, and cite the
   blueprint line, never a graph node.
3. Verify with `npx vitest run --project unit` and `--project component`. Report exact counts.
4. Report every path you wrote and your own reachability check: is what you changed reachable
   from `app/`? A component reachable from nothing is not shipped.

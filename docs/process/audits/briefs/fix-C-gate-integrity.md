# Fix stream C — three gates that walked past a planted defect

Authority APP-016 item 1, slice-11 audit round 1. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`.
Frozen source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

Each item below was **proved by a verifier planting the defect and watching the suite stay
green**. You are not re-deciding whether they are real; you are closing them and proving the
close the same way.

## Files you own — write to these and NOTHING else

```
tests/coverage/absence-sweep.ts
tests/coverage/slice-11-gates.test.ts
tests/component/ai-degradation-overlays.test.tsx
```

Other streams own `src/ai/storyboards/**`, `src/coverage/uninventoried.ts`,
`scripts/build-*.mjs`, `tests/unit/coverage-uninventoried.test.ts` and
`tests/unit/ai-storyboard-contract-invariants.test.ts`. Do not write to `src/`, `app/` or
`docs/`. Never run `git`. Plant into your own files, or replay a gate's logic over a `/tmp`
copy, and say which you did.

## C-13 — the third copy of the symbol list was never converted

`MANUFACTURING_SEVERITY_SYMBOLS` is hoisted into `tests/coverage/absence-sweep.ts:76-86` (8
entries) and two of three consumers import it. The third,
`tests/component/ai-degradation-overlays.test.tsx:365`, still restates two names inline
(`/ANOMALY_SEVERITIES|SEVERITY_CATALOG_DISTRIBUTION/`) and imports nothing from
`absence-sweep`.

**Proved:** appending `// plant: severityBand SEEDED_SEVERITY_BANDS CcSeverityCounts` to
`src/ai/five-surface/overlay.ts` — a file that gate's own path list scans — left it **95/95
green**. Three manufacturing symbols walked past. Import the hoisted list and build the regex
from it, as the other two consumers do.

## C-15 — the closure enqueues `.tsx` only, and the limit is prose

The quote-class half is closed (`importsOf` at `slice-11-gates.test.ts:947-950` now matches
both quote styles; measured 2,880 single-quoted specifiers and 0 double-quoted across
`src/`+`app/`). What remains: `componentClosure` (`:1004-1012`) enqueues `.tsx` only, so a
component re-exported through a `.ts` barrel is outside every gate-6 closure. The limit is
written down at `:995-1003` and **nothing reds if it stops being true**.

Turn it into a live expectation, the way C-16's three narrowings and gate 5's ceiling already
are — for instance a case asserting no `.ts` file under `src/ui/` re-exports a `Severity*`
component, so widening the traversal reds the paragraph and sends the reader to it. If you
instead widen the traversal, prove the widening does not misfire and say what it costs.

Related, and recorded rather than fixed silently: `tests/coverage/slice-11-gates.test.ts:993`
states "2,877 single-quoted import specifiers" and the measured figure is **2,880**. Fix or
derive it; do not renumber a count that will drift again.

## C-19 — a task-scoped gate keyed on a hand-written file list

`tests/component/ai-degradation-overlays.test.tsx:348-370` hard-codes eleven paths in `mine`
and nothing asserts the list equals the directory. `src/ai/five-surface/` holds six files
today and all six are listed, so the gap is latent.

**Proved:** creating `src/ai/five-surface/plant-probe.ts` naming both symbols that gate
forbids left it **95/95 green** — a twelfth file silently unscanned.

Derive `mine` from `readdirSync('src/ai/five-surface')` plus the five named `ai-degradation.ts`
files, and assert the derived set **equals** the hand-written one — the
`KNOWN_UNREACHABLE`/`STANDING_VIOLATION` equality shape this slice already uses five times, so
a new file either joins the scan or reds it. Beware the probe convention: the walk must skip a
concurrent process's `.zz-probe-<pid>` entries via `tests/probe-paths.ts`, and your own plant
must not be skipped by it — a real file with an ordinary name is the plant you want.

## Non-negotiable

- **Every close is proved by planting.** Plant the defect the finding names, watch the suite
  red on the case you intend, restore byte-identically, and put both `shasum -a 256` values in
  your report. Watching it red is not enough — check the red came from the assertion you meant.
  This build has four recorded defective plants, one green because a pattern was case-sensitive
  and the plant was not.
- **A gate that cannot fail is worse than no gate**, and a floor of `> 0` does not catch a drop
  from sixteen to one.
- Every count in this brief is a hypothesis. Report your own measurement and the command.
- Verify with `npx vitest run --project component` and `--project release`; report exact counts.

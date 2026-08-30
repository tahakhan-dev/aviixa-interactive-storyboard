# Fix stream R — the two repo-wide gaps

Authority APP-016 item 1, slice-11 audit round 5, findings `R5-Q01` and `R5-Q02`. Register:
`docs/process/audits/2026-08-25-slice-11-audit-round-5-findings.md`. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Frozen source
`../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

Baseline: `5efb133`, clean tree, fully green — typecheck 0 · lint 0 · gate-ordering 31/31 · unit
6280/182 · component 3046/108 · build 102/102 · release 960/31 · playwright 548. Any red is yours.

**Both findings were made by a fix stream, not an auditor, and both are larger than anything either
round has fixed.** Neither is a bug in a page. Each is a gate that has been measuring the wrong thing
across the whole repository.

---

## R5-Q01 · Critical · the shared rendered-text helper does not strip the React flight payload

`tests/coverage/rendered-text.ts` strips tags and HTML comments. It does **not** strip
`<script>self.__next_f.push(…)</script>`. On `out/coverage/actionable-controls/index.html` that
payload is **790KB of 1.3MB**, and it carries every sentence any gate asserts.

Fix stream Q discovered this the only way it could be discovered: **its own plant went green.** Q
changed a figure in the DOM, the payload still carried the old one, and the assertion passed. Q then
rewrote its three gates to strip scripts and styles first, re-ran every existing assertion in them,
and confirmed none had been living off the payload — then stopped, because the helper is shared and
two other streams were mid-edit.

### What you must do, in this order

1. **Strip `<script>` and `<style>` contents in the shared helper**, before tags are stripped. Q's
   three gates already do this locally — read `tests/coverage/{census-closure,reconciliation-table,registry-index-figures}.test.ts`
   for the working form, and collapse the local copies back onto the shared helper once it is fixed.

2. **Enumerate every call site**, and say how many there are in your report. `grep -rn
   "renderedText\|rendered-text" tests/` is the start; also find any gate that reads an `out/` file
   and does its own tag-stripping, because it has the same exposure by a different route.

3. **Re-run every one of those gates and record which assertions now fail.** This is the finding, not
   a side effect. **An assertion that only ever passed because of the payload was never testing the
   page.** Report the count plainly: N assertions across M files were satisfiable by the payload
   alone.

4. **For each newly-failing assertion, decide honestly and say which you chose:** the page genuinely
   lacks the content and the page must be fixed, or the assertion was checking for something that
   was never meant to be rendered and the assertion is wrong. **Do not "fix" a failure by widening
   the assertion back onto the payload.** If a fix belongs in a file you do not own, report it rather
   than reaching across.

5. **Prove the repaired helper by plant.** Take one gate that asserts a rendered sentence, change that
   sentence in the DOM of a scratch copy while leaving the payload intact, and watch it red. Under
   the old helper that plant is green — run it both ways and paste both outcomes, because that
   contrast is what makes "it was a hole" a measurement rather than an argument.

## R5-Q02 · Important · the locator gate does not scan the artefact densest in locators

`tests/coverage/locator-fidelity.test.ts` has `SCAN_ROOTS` of `src`, `app`, `tests`, `scripts` and
`docs`. **`registries/` is not among them.** `registries/generated/source-reconciliation.json` is the
one authored artefact dense with frozen-source locators, and every one of them renders on the
coverage dashboard.

That is why R5-B07 and R5-B08 shipped, and why fix stream Q found **two more of the same blank-line
class the audit never named** while correcting those two.

**Widen `SCAN_ROOTS` to include the authored artefacts under `registries/`.** Q declined to do this
mid-wave for a specific reason you must handle rather than inherit: it would pull
`registries/raw/**` — raw extractor output, tens of thousands of lines — into the population. Decide
the scope deliberately: the authored and generated artefacts that a reader can reach, not the raw
extraction dumps. **State the exclusion and its reason in the gate**, and assert the included
population is non-empty and of the size you expect, so the exclusion cannot silently swallow the
subject.

Q holds the reconciliation artefact locally in `reconciliation-table.test.ts`. Once the shared gate
covers it, collapse the local check or say why it stays.

Expect this to convict citations nobody has looked at. **Report every one and fix those in files you
own**; hand the rest back with `id` and `line` fields rather than a spelled locator.

---

## Files you own

```
tests/coverage/rendered-text.ts
tests/coverage/locator-fidelity.test.ts
tests/coverage/**            (any gate whose assertions the two fixes convict)
tests/unit/**  tests/component/**   (same, where a gate lives there)
```

You own the gates. **You do not own `app/`, `src/`, `registries/` or `scripts/`** — if a repaired
gate convicts a page, report it with the evidence; do not fix the page. Three read-only auditors may
be sweeping concurrently; they will not write.

**Do not run `scripts/build-registries.mjs`** and do not write under `registries/`. Note that
`pnpm build` chains `build:registries` — that is fine and expected; just do not hand-edit anything it
writes.

## Non-negotiable

- **Never run `git`.** The controller commits.
- **Prove each fix permeable by a REAL plant**, run against both the old and new helper where the
  contrast is the evidence. Restore byte-exact against a checksum.
- **Assert the population, not only the offenders.** A gate whose subject population can reach zero
  reads exactly like compliance.
- **An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears** — including in a
  comment about a bad citation, and including in a report about widening that very gate. This has now
  convicted five authors in this build, two of them while fixing it.
- Bare `§N.N` means the **blueprint**; write "master prompt §X" for the prompt.

## Verification before you report

```
npx tsc --noEmit
pnpm lint
pnpm test:unit
pnpm test:component
pnpm test:release
pnpm build
npx playwright test --project=chromium
```

Report: the call-site count, **the number of assertions that were satisfiable by the payload alone**,
what each newly-failing assertion turned out to be, the locator-gate population before and after, and
the plants with both outcomes. An honest partial beats a claimed close — if the payload fix convicts
more than you can responsibly close, close what you own and hand the rest back measured.

# Fix stream K — the build told a reader the source is silent where it is explicit

Authority APP-016 item 1, slice-11 audit round 4, findings `R4-01`…`R4-07`. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Frozen
source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

## R4-01 · Critical · three pages disclose a gap the lines they cite refute

Three Super Admin module pages render a heading saying an acceptance criterion is **missing from
the frozen source**, and abstain from building it — "the gap is not represented anywhere this build
can read", "nothing on this screen stands in for it". **Controller-verified: the cited lines carry
the complete runs.** Extracted from those exact lines:

```
line 45684 carries AC-SA-14-01 … -07.  The page says the run is 01,02,03,04,06,07.
  AC-SA-14-05 — this module never authors or overrides a tenant-internal notification.

line 45938 carries AC-SA-16-01 … -07.  The page says the run is 01,02,06.
  AC-SA-16-03 — grants are approvable objects under the change-approval discipline.
  AC-SA-16-04 — every JBS session is recorded under its own audit event class and mirrors
                into affected tenants' streams.
  AC-SA-16-05 — a JBS session appears in Platform Access History indistinguishably in
                visibility from a support session, and distinguishably in class.
  AC-SA-16-07 — a grant expires automatically at its time box.

line 45342 carries AC-SA-11-01 … -06.  The page says the run is 01,02,03,04,06.
  AC-SA-11-05 — the Worker-Shift definition appears in every tier record.
```

Six real criteria, two of them prohibitions on a platform surface, reported to a reader as absent
from the document that states them. This is the extraction failure mode the build already documents
— a chunk that drops the middle of a run and returns valid JSON — reaching the rendered product.

**Build them, and delete the three gap disclosures.** Then gate the class: for every rendered
"family member absent" disclosure, assert the named identifier really does not occur in the frozen
source. Nothing can red today — the citations are bare, so `locator-fidelity` grades them WEAK, and
a line that exists and is non-blank passes.

## R4-02 · Critical · a permission ruling on two citations that do not say it

`/super-admin/support-access/` renders, twice, and two other pages quote it as decision D17:

> "L20740 states the Platform Engineer may not enter tenant context under any access class and may
> not open a support session. L65401 lists 'Open a read-only support session (Allowed with
> conditions)' among the same role's permissions. The two cannot both hold."

**Controller-verified.** Line 20740 is the role-register row
`| ROLE-PLAT-ENG | Platform Engineer | Platform console | Many | Band A operations; maker only… |`
— it states neither half. `grep -c "enter tenant context"` over the frozen source returns **0**.
Line 65401 is `| Submit an engineering-class change | … |`; the quoted row is **65407**, six lines
down.

The *ruling* is sound — the prohibition is real at 21166 and 48810 — so only the evidence is false.
Re-point all three sites, drop the sentence no line states, and keep the conclusion.

## R4-03 · Important · a substitution inside a "verbatim" quotation

`/super-admin/ai-incidents/` prints, labelled verbatim: "…is unambiguously an artificial-intelligence
**incident**". Line 91227 reads **outage**. `grep -c` on the page's wording returns 0. The same
source line uses "incident" three clauses earlier for the *other* member of the distinction, so the
substitution collapses the source's own outage/incident wording on the one screen whose subject is
classifying incidents — under a label telling the reader not to check.

## R4-04 · Important · a paraphrase quoted, and a nine-step workflow said to end at step six

`/super-admin/tiers-entitlements-and-caps/` prints that workflow 23.11 "ends at" a quoted string
that occurs nowhere. Line 45248's steps 5 and 6 are the source of the compression; steps 7, 8 and 9
propagate entitlements and caps and run a conformance check. **An abstention rests on this** — "no
notice period … is defined, so none is drawn" — read off a workflow that stops before it finishes.

## R4-05 · Moderate · the build's own gloss inside the quotation marks

Two scheduler pages print: `Matrix A's cell … reads "Allowed, stated bare in the source"`. The cell
reads `Allowed`; the rest is the build's annotation, inside the quotes, after the verb "reads".

## R4-06 · Moderate · three generated `sourceLine` fields cite a blank line

Of 5,018 `sourceLine` fields across seventeen generated registries, three are blank lines, each one
below the heading that names it; two of the three are printed to a reader as the workflow's
identity. `locator-fidelity`'s own doctrine calls a citation of a blank line always wrong, but it
scans `src`/`app`/`tests`/`scripts` and these are bare numbers in `registries/generated`. Anchor the
extractor to the heading line, and assert no `sourceLine` in `registries/generated` is blank.

## R4-07 · Minor · a systematic convention that reads as a quotation

Twenty instances across five Command Center pages put a build-authored parenthetical inside the
quotation marks — `"Explicitly prohibited (row 1, drill from board to cell view)"` where the cell
reads only the token. Ten of the fourteen non-verbatim quotations in the whole export are this one
convention. Move the parenthetical outside the quotes.

## Files you own

```
app/super-admin/platform-notifications-and-tenant-communications/**  jbs-access/**
app/super-admin/tiers-entitlements-and-caps/**  support-access/**  ai-incidents/**
app/super-admin/tenant-metrics-and-aggregates/**  console-users-roles-and-change-approvals/**
app/super-admin/scheduler-registry/**  occurrence-detail/**
app/command-center/{cell-view,deviation-workspace,governance-gate-queue,learning-read-view,run-drill-down}/**
src/surfaces/sa/**   scripts/build-registries.mjs   registries/generated/** (by regeneration only)
tests/unit/sa-*.test.ts   tests/component/sa-*.test.tsx   one new tests/coverage gate
scripts/check-gate-ordering.mjs  ONLY to add the AUDITED entry your new gate needs
```

Never run `git`. Two read-only audit streams are sweeping concurrently.

## Non-negotiable

- **Open every line before you build from it.** Six criteria are being recovered precisely because
  someone did not.
- **Regenerate, never hand-edit, anything under `registries/`**, and prove reproducibility.
- **Plant, and check the plant is real.** A plant that changes nothing gives a green run
  indistinguishable from a sound gate; round 3 lost a cycle to exactly that. Both `shasum -a 256`
  values in the report.
- An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears, including in a
  comment about a bad citation.
- Report exact counts from the unit, component and release projects, `npx tsc --noEmit`,
  `pnpm build`, and `npx playwright test --project=chromium`, reading exit codes.

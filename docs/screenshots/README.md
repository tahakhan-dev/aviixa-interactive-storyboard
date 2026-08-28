# Screenshot manifest

`manifest.json` records one full-page capture per route in the static export — what it
shows, which identifiers it names, and how large the capture is.

**Through APP-017, every figure in this file was asserted against `manifest.json` and against
`out/` by `tests/coverage/client-document-figures.test.ts`.** That gate was newer than this file,
and it existed because every figure below was once wrong at once: this README described 85 files
and 173MB against a 102-row manifest, and its account of which pages name no identifier was stale
in all three of its terms. Nothing read this file, so nothing could say so. APP-020 (master prompt
§2.3, policy-excluding test cases from this project) removed that gate, `tests/coverage/screenshot-manifest.test.ts` (below) and every other test file; the figures in this file are
no longer machine-checked on any run.

## It is not part of `pnpm verify` — and `pnpm screenshots` no longer exists at all

Historically, `pnpm test:e2e` ran `--project=chromium` explicitly. Bare `playwright test` ran
**every** project, which briefly put this artefact build inside `verify` — and its cleanup
step deleted this file along with the PNGs. Both were fixed; the capture was `pnpm screenshots` and
nothing else invoked it. APP-020 removed `@playwright/test` from this project entirely, so
`pnpm screenshots` is gone along with the suites — there is no longer a capture command to run.

Through APP-017, `tests/coverage/screenshot-manifest.test.ts` was part of `verify`, and it noticed
when this artefact went stale: it compared the committed manifest's route set against
`exportedRoutes()` after the build. It never read the rows' contents, which is how 18 of 102 rows
once named a different identifier set from the export they claimed to describe, one build behind,
under a green chain. That gate is deleted along with the rest of `tests/`; nothing notices staleness
now.

## Regenerating — no longer possible with `pnpm`

There is no `pnpm` command left that produces a new capture. Before APP-020, regeneration was:

```
pnpm build          # the export the captures are taken from
pnpm screenshots    # roughly two minutes; wrote the PNGs and the manifest
```

**In that order** — `pnpm screenshots` served the `out/` that already existed and never rebuilt it,
so running it alone wrote a manifest describing whatever export happened to be on disk.

The PNGs on disk are **not committed** (gitignored). They are **roughly 380 MiB across 840 files**
(rounded to the nearest 5, summed from the manifest's own `bytes` column, which is why the figure is
checkable in a fresh clone where the PNGs are absent). The manifest is committed because it is the
artefact that must be reviewable in a diff. Both PNGs and manifest are a frozen capture from before
APP-020 — reviewable, but not reproducible without reintroducing Playwright to this project.

## What the manifest asserts, and what it does not

**It asserts that every exported route was reached, rendered and captured.** The route list
is derived by `exportedRoutes()` from the export itself, never hand-written — two suites in
this build once carried hand lists that fell twenty-eight routes behind and stayed green
while claiming to cover everything.

**It is not a visual-regression baseline.** Nothing compares a capture against a previous
one. Adding that would turn every legitimate copy change into a red run in a build whose
copy is still being written. This is why `baselineHash` is one of the fields the manifest does not
carry: a baseline hash with no baseline behind it would be the strongest-looking field in the file
and the emptiest.

Two checks run inside the capture spec itself, and both have been planted and watched fail:

- the export must hold more than fifty routes, so an empty or missing export fails there
  rather than producing a manifest of nothing;
- no capture may be under 3,000 bytes, because a near-empty PNG is a page that failed to
  paint and would otherwise sit in the manifest looking like coverage.

Neither can catch the manifest not being regenerated at all — a writer checking its own output
cannot detect that it was never run. Through APP-017, the two release gates named above were for
exactly that; both are deleted along with the rest of `tests/`, so nothing catches it now.

## Master prompt §27.2 — the nine fields this carries and the seven it does not

§27.2 requires a manifest keyed by screenshot ID, screen, route, persona, scope, story step, state,
viewport, locale, theme, source IDs, acceptance IDs, test, source hash, build hash and baseline
hash. **It carries 9 of those 16**, and the manifest names the other 7 in its own
`fieldsNotCarried` block with the reason for each, rather than leaving them to be discovered.

Carried, per row: `id`, `screen` (the page's `h1`), `route`, `viewport`, `locale` (read from
`<html lang>`), `theme` (the colour scheme the capture ran under), and the source identifiers split
into `moduleIds`, `screenIds`, `featureIds`, `functionIds` and `acceptanceIds` — separately, which
is what §27.2 asks for, rather than the single merged array this file used to describe. Carried
once at the top: `buildId`, the build the captures were taken from.

Not carried: `persona`, `scope`, `storyStep`, `state`, `test`, `sourceHash`, `baselineHash`. The
first five are properties of a walkthrough step, and this build has no walkthrough runner — every
capture is the same anonymous first load of a route with no interaction, so a `persona` column
would be one invented value repeated 840 times and a `state` column would distinguish nothing.
**Building the runner is slice 13** (RESUME §5). §27.2's ordered canonical-story set — before,
action, after, affected-surface, failure, fallback, fallback-failure, safe-state, recovery — does
not exist for the same reason, and is the same slice.

## Reading the identifier column

`identifiersOnPage` is the union of the five per-kind fields, read from the **rendered text**, not
from the source that produced it. A manifest built from `src/` would describe what the code intends
rather than what a reviewer sees — and this build has shipped four panels whose module id was
`undefined` at prerender while every component test passed, because a component suite mounts the
component and the client boundary only exists in a build.

**744 pages name no identifier**, and that is not 744 defects:

- `/`, `/404/` and `/_not-found/` are chrome;
- 16 `/coverage/*` pages are inventory dashboards that count identifiers rather than presenting
  one, or — fix round 1 (Task 18) — one of the fourteen `requiredScreenshotRoutes()` item-card
  representatives whose registry's rows carry no `MOD-`/`SCR-`/`FEAT-`/`FUNC-`/`AC-`-prefixed
  field (7 dashboards + 9 representatives: ai-storyboards' index and its representative,
  business-objects' representative, business-use-cases' index and its representative, commands'
  index and its representative, events' index and its representative, notifications'
  representative, offline-scenarios' index and its representative, scheduled-work's index and
  its representative, workflows' index and its representative);
- `/review/` is the reviewer's own workspace — a note form and the review-package export — and
  presents no product content, so it names no product identifier of any kind;
- `/workflows/` (the Task 17 Workflow Index) and 723 of its 724 `/workflows/<id>/` detail cards
  render the workflow's own extracted fields — actor, trigger, terminal states — never a blueprint
  entity identifier, so most name none. The one exception, `/workflows/unstated@L35935/`, names
  `MOD-CC-02` because that row's own extracted trigger text happens to contain it — a real
  identifier the extraction carried, not something this build added. `/workflows/ai-and-its-absence/`
  is a separate, hand-authored route and always names identifiers, so it is not in this count.

Through APP-017, that accounting was asserted by route, as a set equal to the set the manifest
yields — not as a count, because a count is satisfied by the wrong eleven pages. That gate is
deleted along with the rest of `tests/`; the accounting above is re-derived by hand, not
machine-checked. An earlier version of this section
said thirteen pages, ten of them `/coverage/*`, and named `/command-center/` as "the one to watch:
it is still the surface placeholder". `/command-center/` names 23 identifiers and the surface is
built; `/review/` had no slot in the accounting at all.

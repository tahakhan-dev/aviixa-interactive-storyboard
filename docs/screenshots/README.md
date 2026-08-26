# Screenshot manifest

`manifest.json` records one full-page capture per route in the static export — what it
shows, which identifiers it names, and how large the capture is.

**Every figure in this file is asserted against `manifest.json` and against `out/` by
`tests/coverage/client-document-figures.test.ts`.** That gate is newer than this file, and it
exists because every figure below was wrong at once: this README described 85 files and 173MB
against a 102-row manifest, and its account of which pages name no identifier was stale in all
three of its terms. Nothing read this file, so nothing could say so.

## It is not part of `pnpm verify`

`pnpm test:e2e` runs `--project=chromium` explicitly. Bare `playwright test` runs **every**
project, which briefly put this artefact build inside `verify` — and its cleanup
step deleted this file along with the PNGs. Both are fixed; the capture is `pnpm screenshots` and
nothing else invokes it.

`tests/coverage/screenshot-manifest.test.ts` IS part of `verify`, and it is what notices that this
artefact went stale: it compares the committed manifest's route set against `exportedRoutes()`
after the build. It does not read the rows' contents, which is how 18 of 102 rows named a
different identifier set from the export they claim to describe, one build behind, under a green
chain.

## Regenerating

```
pnpm build          # the export the captures are taken from
pnpm screenshots    # roughly two minutes; writes the PNGs and the manifest
```

**In that order.** `pnpm screenshots` serves the `out/` that already exists and never rebuilds it,
so running it alone writes a manifest describing whatever export happens to be on disk.

The PNGs are **not committed**. They are **roughly 300 MiB across 102 files** (rounded to the
nearest 5, summed from the manifest's own `bytes` column, which is why the figure is checkable in a
fresh clone where the PNGs are absent). The manifest is committed because it is the artefact that
must be reviewable in a diff. Run the two commands above before any client review.

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
cannot detect that it was never run. That is what the two release gates named above are for.

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
would be one invented value repeated 102 times and a `state` column would distinguish nothing.
**Building the runner is slice 13** (RESUME §5). §27.2's ordered canonical-story set — before,
action, after, affected-surface, failure, fallback, fallback-failure, safe-state, recovery — does
not exist for the same reason, and is the same slice.

## Reading the identifier column

`identifiersOnPage` is the union of the five per-kind fields, read from the **rendered text**, not
from the source that produced it. A manifest built from `src/` would describe what the code intends
rather than what a reviewer sees — and this build has shipped four panels whose module id was
`undefined` at prerender while every component test passed, because a component suite mounts the
component and the client boundary only exists in a build.

**11 pages name no identifier**, and that is not 11 defects:

- `/`, `/404/` and `/_not-found/` are chrome;
- 7 `/coverage/*` pages are inventory dashboards that count identifiers rather than presenting one;
- `/review/` is the reviewer's own workspace — a note form and the review-package export — and
  presents no product content, so it names no product identifier of any kind.

That accounting is asserted by route, as a set equal to the set the manifest yields — not as a
count, because a count is satisfied by the wrong eleven pages. An earlier version of this section
said thirteen pages, ten of them `/coverage/*`, and named `/command-center/` as "the one to watch:
it is still the surface placeholder". `/command-center/` names 23 identifiers and the surface is
built; `/review/` had no slot in the accounting at all.

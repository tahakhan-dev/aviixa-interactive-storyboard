# Screenshot manifest

`manifest.json` records one full-page capture per route in the static export — what it
shows, which identifiers it names, and how large the capture is.

## It is not part of `pnpm verify`

`pnpm test:e2e` runs `--project=chromium` explicitly. Bare `playwright test` runs **every**
project, which briefly put this ninety-second artefact build inside `verify` — and its cleanup
step deleted this file along with the PNGs. Both are fixed; the capture is `pnpm screenshots` and
nothing else invokes it.

## Regenerating

```
pnpm build          # the export the captures are taken from
pnpm screenshots    # ~90 seconds; writes the PNGs and the manifest
```

The PNGs are **not committed**. They are 173MB across 85 files and are rebuilt from the
export in about ninety seconds; the manifest is committed because it is the artefact that
must be reviewable in a diff. Run the two commands above before any client review.

## What the manifest asserts, and what it does not

**It asserts that every exported route was reached, rendered and captured.** The route list
is derived by `exportedRoutes()` from the export itself, never hand-written — two suites in
this build once carried hand lists that fell twenty-eight routes behind and stayed green
while claiming to cover everything.

**It is not a visual-regression baseline.** Nothing compares a capture against a previous
one. Adding that would turn every legitimate copy change into a red run in a build whose
copy is still being written.

Two checks do run, and both have been planted and watched fail:

- the export must hold more than fifty routes, so an empty or missing export fails here
  rather than producing a manifest of nothing;
- no capture may be under 3,000 bytes, because a near-empty PNG is a page that failed to
  paint and would otherwise sit in the manifest looking like coverage.

## Reading the identifier column

`identifiersOnPage` is read from the **rendered text**, not from the source that produced
it. A manifest built from `src/` would describe what the code intends rather than what a
reviewer sees — and this build has shipped four panels whose module id was `undefined` at
prerender while every component test passed, because a component suite mounts the component
and the client boundary only exists in a build.

**Thirteen pages name no identifier**, and that is not thirteen defects. `/`, `/404/` and
`/_not-found/` are chrome; the ten `/coverage/*` pages are inventory dashboards that count
identifiers rather than presenting one. `/command-center/` is the one to watch: it is still
the surface placeholder, and slice 9's first task replaces it.

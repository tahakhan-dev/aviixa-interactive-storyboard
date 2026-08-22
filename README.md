# AVIIXA Interactive Storyboard

A browser-only, click-through storyboard of the AVIIXA manufacturing platform: five surfaces,
nine human roles, no backend of any kind.

```
pnpm install
pnpm dev                    # http://localhost:3000
```

To build and serve exactly what ships:

```
pnpm build                  # static export into out/
pnpm serve:out              # http://localhost:4173
```

## The boundary, stated once

**There is no backend and there can never be one.** `next.config.ts` sets `output: 'export'`, so
there are no API routes, no Server Actions, no middleware, no runtime headers, redirects or
rewrites, and no image optimisation server. Every screen is a static file. Every scenario is data
in the bundle.

This is not a limitation to work around — it is the deliverable. A storyboard that quietly grew a
server would stop being reviewable as a set of files.

## What is here

| surface | owns a screen | mounted in another screen | of | routes |
|---|---|---|---|---|
| Super Admin platform console (`SURF-SA`) | 19 | — | 19 | 20 |
| Delivery Operations Hub (`SURF-DOH`) | 15 | — | 19 | 18 |
| Standards and Operations Studio (`SURF-STU`) | 16 | 1 | 18 | 18 |
| Frontline Worker Application (`SURF-FL`) | 6 | **6** | 12 | 7 |
| Client Command Center (`SURF-CC`) | 1 | — | 13 | 2 |
| **total** | **57** | **7** | **81** | **85 pages** |

Plus `/coverage/` — fourteen inventory dashboards computed from the source — `/workflows/`, and
`/review/`.

**All three statuses are computed from the built route tree, never from a list.**

- **Owns a screen** — the module declares a `slug` and a shipped route directory of that name
  exists; or, for a route no module claims by slug, that route's files name it more often than any
  module they cross-reference.
- **Mounted in another screen** — the module owns no route and **a route file imports its module
  directory.** The source requires this: an action rail or surface chrome has no screen of its own
  and mounts inside another module's. The evidence is the import rather than a mention, because a
  mention can be a cross-reference in a sentence while an import is the screen mounting the thing.
- **Not represented** — no route demonstrates it and no route mounts it. **A module can be fully
  built and still read this** if nothing has mounted it yet, which is true of `MOD-CC-02` today.

Delete the route or the import and the row falls back on the next build. See
`registries/generated/modules.json` for the rule in full.

## The frozen source

Every screen, table and status token traces to one file:

```
../AVIIXA_Production_Product_Blueprint.md
sha256  47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
        18,565,031 bytes · 122,241 lines
```

It is read-only. **Citations name the blueprint line, never a derived index**, and
`tests/coverage/locator-fidelity.test.ts` reads any `L`-number in a comment as a citation and
checks it — including inside a sentence explaining that the line is blank. That gate has caught
wrong citations in every slice it has run in.

## Verifying

```
pnpm verify
```

Runs, in order: `typecheck`, `lint`, gate-ordering audit, registry freshness, unit, component,
`build`, release gates, and Playwright e2e with axe accessibility scans. The order is not
cosmetic — ten of the eighteen release gates read a subject an earlier step rewrites, and
`scripts/check-gate-ordering.mjs` audits that each one says where it runs and why.

Individual steps: `pnpm test:unit`, `pnpm test:component`, `pnpm test:release`, `pnpm test:e2e`.

## Where the documentation is

| what | where |
|---|---|
| how to review this as a client | `docs/client-review-guide.md` |
| five guided click-paths | `docs/walkthroughs.md` |
| how to deploy the export | `docs/deployment.md` |
| screenshot manifest | `docs/screenshots/` |
| coverage census against the source | `docs/census/` |
| per-slice verification records | `docs/process/*-verification.md` |
| the build's own working record | `docs/process/RESUME.md` |

## A note on honesty in this build

Several conventions here look like over-caution and are not. Each was written after a specific
defect:

- **Every gate plants its own defect into a real shipping file, watches it go red, and restores
  it byte-identically.** More than twenty gates in this build could not fail when first written,
  and every one was found by planting rather than by review.
- **Where the source disagrees with itself, both readings are carried with their own locators and
  neither is adopted.** The blueprint contradicts itself in dozens of places; resolving one
  silently would be making a client's decision for them inside a comment.
- **Registries are generated, never hand-maintained.** Two test suites once carried hand-written
  route lists that fell twenty-eight routes behind the build and stayed green while claiming to
  cover everything.

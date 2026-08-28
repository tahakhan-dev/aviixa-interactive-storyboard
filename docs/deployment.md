# Deploying the storyboard

The build is a static export. **Any static host serves it** — there is no server-side runtime to
provision, no environment variable to set, and no database to connect.

## Build

```
pnpm install --frozen-lockfile
pnpm build
```

`pnpm build` runs the registry generators first, then `rm -rf out`, then `next build`. The
generators read the frozen blueprint and the route tree, so **the export's coverage dashboards
describe the export being built**, not a previous one.

Output: `out/` — **5841 pages, 29367 files, roughly 290 MiB** (rounded to the nearest 5).

Through APP-017, those three figures were asserted against the export itself by
`tests/coverage/client-document-figures.test.ts`. This line once read "85 pages, roughly 24MB across
485 files" for three slices while the export held 5841 pages and 29367 files, and nothing could say
so: the manifest gate checked the manifest, the route gate checked routes, and no gate read this
sentence. APP-020 (master prompt §2.3, policy-excluding test cases from this project) removed that
gate along with every other test file; the figures above are re-derived by hand against `out/`, not
machine-checked on every run.

## Serve

```
pnpm serve:out          # local check on :4173
```

For a real host, upload the contents of `out/` to the document root. Requirements are minimal and
worth stating exactly:

- **Serve `index.html` for directory paths.** `next.config.ts` sets `trailingSlash: true`, so
  routes are emitted as `/hub/run-drill-down/index.html`. Most static hosts do this by default;
  S3 behind CloudFront needs an index document set on the distribution as well as the bucket.
- **Serve `404.html` for unmatched paths.** The export includes a real 404 page, and it is
  accessibility-scanned like every other route.
- **No rewrites, no redirects, no edge functions.** If a host offers to add them, decline. The
  export is complete on its own and a rewrite layer would put behaviour outside the artefact
  everyone is reviewing.
- **HTTPS.** Nothing in the storyboard requires it, but a client review conducted over plain HTTP
  invites a browser warning that reads as a defect in the product.

### Caching

The `_next/` asset tree is content-hashed and safe to cache immutably. **The HTML is not** — cache
it for minutes, not days, or a reviewer who returns after a rebuild sees the previous storyboard
and reports the differences as bugs.

```
/_next/*        Cache-Control: public, max-age=31536000, immutable
/*              Cache-Control: public, max-age=300, must-revalidate
```

## Verified hosts

The export uses no host-specific feature, so this list is about defaults rather than
compatibility: **Netlify, Vercel (as a static site, not a Next.js deployment), Cloudflare Pages,
GitHub Pages and S3 + CloudFront** all serve it with the index-document setting above. Nothing
here is a recommendation between them.

**On Vercel specifically:** deploy it as a static output directory. Letting Vercel detect it as a
Next.js app is harmless today and stops being harmless the moment someone adds a server feature
that the static export was supposed to forbid.

## What deployment must not add

No analytics that phones home from a client's review session. No error-reporting agent. No
authentication proxy. **A reviewer's clicks are not telemetry**, and every one of these would put
behaviour into the storyboard that is not in the repository.

## The screenshots, as of APP-020

`pnpm screenshots` (a Playwright capture) no longer exists — APP-020 (master prompt §2.3,
policy-excluding test cases from this project) removed `@playwright/test` along with every test
file. The PNGs on disk are gitignored, not committed; `docs/screenshots/manifest.json` is
committed — **840 rows, roughly 380 MiB of PNG** (rounded to the nearest 5) as of the capture run
that produced them, before this removal. Neither the PNGs nor the manifest are reproducible with
`pnpm` today, and neither is re-checked against a rebuilt export before a client review. Before
capture was removed, the discipline was: `pnpm build` then the capture, in that order, every time —
`pnpm screenshots` served the `out/` that already existed and never rebuilt it, so a capture run
against a stale export wrote a manifest describing a build nobody was deploying. (Before that
discipline was written down, the committed manifest once named a different identifier set from the
export on 18 of its 102 rows, and a different capture size on 54 of them — one build behind, with a
green chain over it.)

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

Output: `out/`, 85 pages, roughly 24MB across 485 files.

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

## Rebuilding the screenshots

```
pnpm build
pnpm screenshots        # ~90 seconds
```

The PNGs are gitignored and rebuilt from the export; `docs/screenshots/manifest.json` is
committed. Run both before a client review so the manifest matches what is deployed.

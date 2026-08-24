# Fix stream I — a client can reach 18 of 102 pages

Authority APP-016 item 1, slice-11 audit round 3, finding `R3-06`. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`.
Frozen source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

## The finding, controller-verified twice

BFS over the built export's own links from `/`:

```
exported routes           102
reachable from / by links  18
NOT reachable              84
five surface roots         /super-admin/ /hub/ /studio/ /command-center/ /frontline/  — ALL unreachable
```

`out/index.html` carries exactly three product destinations: `/coverage/`, `/review/`,
`/workflows/`. **There is no script navigation anywhere** — `grep -rln "router.push\|useRouter\|
redirect("` over `app/` and `src/` returns nothing — so an href scan is the whole truth.

`app/page.tsx:6-7` claims "the five surfaces are reached from the coverage dashboard and review
shell". Measured false in both halves: the coverage dashboard links only its own fourteen registry
indexes plus `/workflows/`, and `/review/` renders **zero** anchors.

**Why this is Critical rather than cosmetic.** This is a client-validation artefact whose purpose is
that stakeholders navigate it. Every route-level assertion in `tests/e2e` and `tests/accessibility`
is made with `page.goto()`, so 546 green tests are fully compatible with a client opening the
storyboard and reaching eighteen pages. The five surfaces — the entire product — are reachable only
by typing a URL.

**And the fix is narrow, which is the good news.** Seeding the BFS with the five roots reaches
**93 of 102**: the surfaces already link their own modules correctly. Nine remain:

```
/404/  /_not-found/                     legitimate — not linked by design
/coverage/workflows/
/hub/devices/  /hub/journey/
/studio/journey/  /studio/sign-in/
/super-admin/occurrence-detail/  /super-admin/scheduler-registry/    ← link only to each other
```

## Your work

1. **Make the entry page a real entry.** The five surface roots must be reachable from `/`. Master
   prompt §20.0 defines three modes — Guided Story, Explore Product, Review Evidence — and the
   existing three destinations are the third of those. Build what the storyboard needs to be
   navigable, not a bare link list: a reader arriving at `/` should be able to find each surface,
   understand what it is, and get to it.
2. **Triage the seven non-`404` orphans.** Each either gets an inbound link from a page that should
   name it, or an explicitly recorded reason it has none. `/super-admin/occurrence-detail/` and
   `/super-admin/scheduler-registry/` link only to each other — a closed island with no inbound edge
   from anywhere else in the export.
3. **Correct or delete `app/page.tsx:6-7`.** It asserts something the tree contradicts.
4. **The gate.** One test that BFSes the export's own links from `/` and compares the reachable set
   against `scannableRoutes()` **by equality**, with deliberate exceptions recorded by name and
   reason — the shape `axe-states.spec.ts`'s `unreachedRoutes` already uses, which that same audit
   confirmed is a true equality in both directions. A membership list will not do: this finding
   exists because no assertion of this kind existed at all.

`tests/component/storyboard-card-reachability.test.tsx:130-154` already states the principle — "some
other file under `app/` has to link the path or the page is one only its author finds" — applied to
one component and nothing else. This generalises it.

## Files you own

```
app/page.tsx  and any app/ file you must edit to add an inbound link
tests/e2e/  (new spec)  or  tests/coverage/  (new gate) — your choice, justify it
scripts/check-gate-ordering.mjs   ONLY to add an AUDITED entry if you add a tests/coverage gate
```

Do not write under `src/surfaces/`, `src/studio/`, `src/frontline/`, `registries/`, `docs/`, or any
existing `tests/` file other than by adding your new one. Other streams own those. Never run `git`.

## Non-negotiable

- **A route reachable only by `page.goto()` is not reachable.** Judge every claim you make by what a
  client clicking through the served export can do.
- If you add a `tests/coverage/` gate it needs an `AUDITED` entry in `check-gate-ordering.mjs`
  declaring whether `build` rewrites its subject and whether it runs before it — a new gate without
  one is a hard failure by design.
- **Plant, watch it red, check the red is the assertion you meant, restore byte-identically**, both
  `shasum -a 256` values in the report. Remove one inbound link and the gate must convict.
- Verify with `npx tsc --noEmit`, `pnpm build`, `npx vitest run --project release`, and
  `npx playwright test --project=chromium`. Report exact counts and read the exit code — a summary
  line is not a result.

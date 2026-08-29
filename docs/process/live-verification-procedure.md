# Live-verification procedure

The exact call sequence a §24.2 workflow unit follows to produce one
`docs/process/ledgers/live-verification-ledger.json` row, so that two
different implementers verifying the same `pathId` produce evidence that
matches in shape and can be cross-checked, not just two prose paragraphs that
both say "it worked."

## Which MCP server, and why this doc says Playwright MCP, not `use_browser`

The runway plan (`docs/superpowers/plans/2026-08-26-runway.md`, Global
Constraints) names `mcp__plugin_superpowers-chrome_chrome__use_browser` as
the verification tool. In practice, every task from Task 11 onward that
actually ran a live verification (task-11 through task-16, task-18 report
files) used the **Playwright MCP server** (`mcp__playwright__*`) instead, and
task-15-report.md records why: "Chrome MCP screenshot tool limitation, not a
product defect" — `use_browser`'s screenshot action hit a limitation the
Playwright MCP tools do not share. This procedure documents the tool this
project's own history shows actually works, not the one the plan aspirationally
named and practice quietly moved away from. If a future implementer's
environment only exposes `use_browser`, the same sequence maps onto it
action-for-action (`navigate`→`navigate`, `click`→`click`,
`get_console_messages`→`browser_console_messages`, and its own network
capture — see `use_browser`'s `action='help'`), with one gap: `use_browser`
has no dedicated network-request listing action, so `externalRequests` must
be captured via `eval` reading `performance.getEntriesByType('resource')`
instead of step 5 below.

## Preconditions

1. **Rebuild first.** `pnpm build` — the export in `out/` must reflect the
   current tree; a stale `out/` produces evidence about a build that no
   longer exists.
2. **Serve the export.** `pnpm serve:out` (backgrounded — it does not exit).
   This serves a real static file server on `http://localhost:4173`, the
   same shape every user's browser gets; it is not `next dev`, which runs a
   dev server with different bundling and would make `externalRequests`
   evidence about a mode the client never runs. (Task 11's pre-Task-8 forms
   verification used `pnpm dev` because no static export existed to serve
   yet — that is a recorded, disclosed exception for that one task, not the
   standing rule.)
3. **Note the frozen-source hash and the candidate.** Record the current
   `git_commit`/candidate id this verification is FOR (`candidateId` on the
   row) before starting — not reconstructed afterward from memory.
4. **Console logging must be armed before the page loads**, not after: call
   `enable_console_logging`-equivalent behavior is automatic in Playwright
   MCP (`browser_console_messages` reports everything since the last
   navigation by default), but if `use_browser` is in play instead, call its
   `enable_console_logging` action before `navigate`, or an error thrown
   during initial paint is invisible to a check made after the fact.

## The call sequence

Each numbered step names the exact tool and the exact ledger column(s) its
output fills.

1. **Navigate.**
   `mcp__playwright__browser_navigate({ url: "http://localhost:4173/<path>" })`
   — the URL under test. Fills nothing directly; establishes the page for
   every step after it.

2. **Set the scenario, if the row's `role`/`connectivity`/`clockStamp`
   require anything other than the export's default seed state.** Every
   demo-chrome control carries a stable `data-control-id`
   (`src/ui/demo/RoleSimulator.tsx`, `src/ui/demo/ScenarioControls.tsx`):
   - `demo-role-simulator` — switches the active role.
   - `demo-connectivity` — one of `CONNECTIVITY_MODES`
     (`src/scenario/controls.ts`).
   - `demo-clock-advance-1h` / `demo-clock-advance-1d` — advances the
     injected `Clock`, never `Date.now()` (master prompt's simulated-clock
     constraint).
   - `demo-checkpoint-prev` / `demo-checkpoint-next` — moves along recorded
     scenario checkpoints.
   - `demo-scenario-reset` — returns to the seed state (call this FIRST if
     the row must start from a known baseline rather than whatever a prior
     verification left behind).

   Drive each with `browser_click({ target: '[data-control-id="..."]',
   element: '<human description>' })`, or `browser_select_option` for the
   connectivity `<select>`. Record the exact sequence of controls touched,
   in order, as the row's `role`, `connectivity`, and `clockStamp` values.

3. **Take a snapshot before interacting with page content**, to get real
   element refs rather than guessing selectors:
   `mcp__playwright__browser_snapshot({})`. Not stored on the row directly;
   its element refs (`ref=...`) are what step 4's `target` values come from.

4. **Perform the actual product steps** — the sequence a role really
   performs, one call per action, `click`/`type`/`select_option` as needed,
   each against a `target` taken from the most recent snapshot (re-snapshot
   after any action that changes the DOM structure the next step targets).
   Record each call, in order, as one entry in the row's `steps` array —
   written as what a person did ("clicked 'Approve the request'"), not as
   raw tool-call JSON.

5. **Capture network requests — before capturing console messages,
   immediately after the last product step**, so nothing from this
   verification session leaks into a later row's counts:
   `mcp__playwright__browser_network_requests({ static: true })`. `static:
   true` is required, not optional — the default (`false`) omits images,
   fonts and scripts, and this project's own §4.1 "no external asset"
   constraint is exactly about static resources, not only XHR/fetch calls;
   a `static: false` capture would silently pass a page that loads a remote
   font or a CDN image. Filter the returned list for any request whose
   origin is not `http://localhost:4173`. Every survivor is a Critical
   defect (`master prompt §4.1`, the runway's "No backend, ever"
   constraint) — record its full URL in the row's `externalRequests` array.
   An empty array is not "not checked"; it is "checked, none found," and
   is exactly what `pathId`s that reference `scan-no-external-network.mjs`'s
   own already-clean census (`src/`, `app/`, `out/`) should produce here too
   — this step is the live-browser complement to that static scan, catching
   anything the static scan structurally cannot (a request only a specific
   runtime interaction triggers).

6. **Capture console messages.**
   `mcp__playwright__browser_console_messages({ level: 'error' })` (`level:
   'error'` returns errors only, per that tool's own "each level includes
   the messages of more severe levels" semantics — this project treats a
   console error as a real regression signal; warnings are not this row's
   concern unless the step under test is specifically about a warning).
   Record every returned message verbatim in the row's `consoleErrors`
   array. An empty array again means "checked, none found."

7. **Screenshot.** `mcp__playwright__browser_take_screenshot({ filename:
   "docs/screenshots/live/<unit-or-slice>/<pathId-with-slashes-replaced>-<n>.png",
   fullPage: true })` — one
   per meaningfully distinct state (before a mutating action and after it,
   at minimum, for any row whose `expected` describes a state change).
   Record each capture, in the order taken, in the row's `screenshots`
   array, as an object — **not a bare filename**:

   ```json
   { "path": "docs/screenshots/live/<unit-or-slice>/<name>-<n>.png",
     "bytes": "<size on disk>", "sha256": "<shasum -a 256 of that file>" }
   ```

   `sha256` is the hash of the bytes on disk, computed at the time the row
   is written (`shasum -a 256 <path>`), and `bytes` is that file's size.
   Image files are not re-read by a later verification pass of this ledger —
   see "What this procedure cannot do" below — so the path, the hash, and
   the `observed` field's prose description of what the image shows are the
   durable record between them.

   **Why the hash, given the images are gitignored (unit-01 final
   whole-branch review, IMPORTANT 4).** These captures are irreproducible:
   unlike `docs/screenshots/*.png`, which `pnpm screenshots` rebuilds in
   about ninety seconds, nothing re-drives this browser session. So on a
   fresh clone the bytes are simply absent, and a bare path is a reference
   to nothing that can be checked. The hash makes the reference survive the
   separation — a reviewer handed the images out of band can prove they are
   the ones this row was written against.

   **The path is part of the step, not a detail left to the tool.** Given a
   bare filename, the Playwright MCP server writes wherever its own output
   directory points — which in this environment is the PARENT of the
   repository, and unit 1 task 1 put nine captures on the client's desktop
   folder before this was noticed. `docs/screenshots/live/` is inside the
   repository, carries its own `docs/screenshots/live/**/*.png` ignore rule
   (with its own stated reason, which is NOT the rebuild argument the rule
   above it makes), and keeps a ledger row's `screenshots` array resolvable
   from the repository root by anyone reading it later.

8. **Compare, and write `observed`, `verdict`, `defect`.** `observed` is a
   plain-prose statement of what steps 4-7 actually showed, written so it
   can be checked against `expected` (the row's `expected` field, sourced
   from the relevant registry row / use case / workflow passage) without
   re-running anything. `verdict` is `'pass'` only if `observed` matches
   `expected` AND `externalRequests` is empty AND `consoleErrors` contains
   nothing the step sequence didn't intentionally provoke; otherwise
   `'fail'` (with `defect` naming exactly what didn't match) or `'blocked'`
   (with `defect` naming why the sequence could not run at all — e.g. a
   `decision-blocked` control per the coverage dashboard's own status
   vocabulary).

9. **Stamp it.** `stamp` is the wall-clock time this verification session
   ran (not the simulated `clockStamp` from step 2 — the two are
   independent and both required). `candidateId` is the value recorded in
   Preconditions step 3.

## What this procedure cannot do

**Image files in this project cannot be read back by an agent** (the
project's own deny rules block it, to save tokens — the same rule this
task's own brief operates under). That means a screenshot filename recorded
in step 7 is evidence a HUMAN reviewer can open, never something a later
automated pass can re-verify by looking at it. Nothing in this procedure or
in `scripts/ledger-reconcile.mjs` re-opens a screenshot to check it shows
what `observed` claims — that is exactly the gap `observed`'s own prose
description exists to narrow, not close. A verdict of `'pass'` rests on the
prose in `observed`/`consoleErrors`/`externalRequests`, which an agent CAN
write and read, not on the pixels, which it cannot.

## Filling one ledger row: a worked skeleton

```json
{
  "id": "LV-0001",
  "pathId": "workflows:SB-001@L61090",
  "role": "Tenant Admin",
  "surface": "Delivery Operations Hub",
  "connectivity": "online",
  "clockStamp": "seed (no clock-advance control touched)",
  "steps": [
    "navigated to /hub/tenants/",
    "clicked 'Approve the pending tenant request' for the seeded pending tenant",
    "confirmed the resulting status pill reads 'Active'"
  ],
  "expected": "The tenant's status transitions from Requested to Active and the Tenant Admin's acceptance is recorded, per SB-001's passage.",
  "observed": "Status pill changed from 'Requested' to 'Active' immediately after the click; no navigation occurred; no dialog appeared.",
  "screenshots": [
    { "path": "docs/screenshots/live/<unit>/workflows-SB-001-before.png", "bytes": "<size on disk>", "sha256": "<shasum -a 256 of that file>" },
    { "path": "docs/screenshots/live/<unit>/workflows-SB-001-after.png", "bytes": "<size on disk>", "sha256": "<shasum -a 256 of that file>" }
  ],
  "consoleErrors": [],
  "externalRequests": [],
  "verdict": "pass",
  "defect": null,
  "candidateId": "runway-task19-<commit>",
  "stamp": "2026-08-28T00:00:00Z"
}
```

## Anti-pattern this procedure exists to rule out

A raw `grep` over `out/`'s HTML, or a claim written from memory of what a
screen "should" show, is not live verification — it is exactly the failure
mode `task-17-report.md` names: two "figures" a raw grep once reported as
present in the export turned out to be React row keys inside the RSC Flight
payload, not rendered content a reader ever sees. Every ledger row's
evidence must trace to an actual tool call made in this session, in the
order listed above — not reconstructed afterward, and not asserted without
the call that would have produced it.

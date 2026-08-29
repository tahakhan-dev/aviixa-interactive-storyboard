# Unit 1 closure verification — platform bootstrap and tenant provisioning

Task 12, the closing task of `.superpowers/sdd/2026-08-28-unit-01-platform-bootstrap-and-tenant-provisioning/`.
Candidate commit at entry: `79cbd4f130865253bccc967973ba04d89cc05927` (task 11's close). This
record is itself uncommitted evidence sitting on top of that commit — the controller commits it,
per the standing instruction that implementers never run git for writing.

## 1. Frozen source — re-hashed, not trusted from memory

```
$ shasum -a 256 ../AVIIXA_Production_Product_Blueprint.md
47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27  ../AVIIXA_Production_Product_Blueprint.md
$ wc -l ../AVIIXA_Production_Product_Blueprint.md
  122241 ../AVIIXA_Production_Product_Blueprint.md
```

Matches the frozen value exactly (`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`,
122,241 lines). No drift. Not BLOCKED.

## 2. Live-verification ledger — 25 rows driven fresh against the final bytes

`docs/process/ledgers/live-verification-ledger.json` held **zero entries** at the start of this
task, by the runway's own deliberate design (see the ledger's `scope_note`). Every row below was
produced by actually driving `pnpm serve:out`'s served export with the Playwright MCP tools in this
session — none is a transcription of a prior task report's prose, per the binding instruction.

**Verdict totals: 25 rows — 23 `pass`, 1 `fail`, 1 `blocked`.**

**Regression-set scope, named explicitly (master prompt §2.3's own rule: "every path sharing a
changed screen, component, repository method or state machine is re-driven on the final bytes"):**
the platform-bootstrap-and-tenant-provisioning spine end to end (sign-in → dashboard → tenants
list → create wizard, including both schema-rejection cases → tenant detail → sign-out → Hub
accept-invitation), each of the eight shipped screens' main state (sign-in, Platform Overview and
Health, Tenants/Lifecycle/Pilots list, the create wizard, tenant detail, Console Users/Roles/Change
Approvals, Tenant Metrics and Aggregates, Hub accept-invitation), the sign-out control, and the
variant/failure paths this unit's own tours encode: four sign-in refusal arms (removed/generic,
invitation-pending, account-suspended, tenant-suspended), the root step-up gate, segregation of
duties on a root's own proposal, the second-Root-Super-Admin refusal, the critical-class
no-control-at-all render for a non-root viewer, tenant-create-denied for a Platform Engineer (both
from the list and by navigating straight to the create route), and both Hub invitation failure
states (expired, tenant-blocked). This is the unit's own regression rule applied, not an attempt at
exhaustive coverage of the 5,015-row census — the ledger's own reconciliation output says so
explicitly (below).

**Note on the "nine screens" wording.** The task-12 brief's self-review says "§3's eight screens
map to Tasks 2-9"; `progress.md` says "nine screens" six times. Both are the unit's own words, and
they disagree. This record drove the eight screens Tasks 2-9 actually shipped (sign-in, dashboard,
tenants list, create wizard, tenant detail, console-users, accept-invitation, tenant-metrics) plus
the sign-out control as its own listed item — an honest reading that reconciles the two counts
without silently picking one, since it is a discrepancy in the record rather than something this
task can resolve by fiat.

### Rows

| id | pathId | verdict | what it shows |
|---|---|---|---|
| LV-0001 | workflows:WF-ROLE-004 | pass | Admin sign-in succeeds, lands on dashboard |
| LV-0002 | modules:MOD-SA-01 | pass | Dashboard main state, live-computed tiles |
| LV-0003 | modules:MOD-SA-09 | pass | Tenants list main state, Create tenant enabled |
| LV-0004 | modules:MOD-SA-09 | pass | Wizard: empty name blocks Next (schema rejection) |
| LV-0005 | modules:MOD-SA-09 | pass | Wizard: pilot without expiry blocks Next |
| LV-0006 | modules:MOD-SA-09 | pass | Wizard: real create write → detail, Activate disabled with reason |
| LV-0007 | workflows:WF-ROLE-004 | pass | Sign-out clears session, preserves return route |
| LV-0008 | workflows:unnumbered@L75557 | pass | Hub: real seeded invitation (Nadia/IronClad) accepted live |
| LV-0009 | modules:MOD-SA-09 | **fail** | Cross-document persistence loss reproduced live (carried finding #1) |
| LV-0010 | modules:MOD-SA-09 | **blocked** | Full accept→activate spine continuity — cannot be driven in one document |
| LV-0011 | workflows:WF-ROLE-004 | pass | Sign-in: removed account → generic refusal (R2) |
| LV-0012 | workflows:WF-ROLE-004 | pass | Sign-in: invited account → invitation-pending |
| LV-0013 | workflows:WF-ROLE-004 | pass | Sign-in: suspended account → account-suspended |
| LV-0014 | workflows:WF-ROLE-004 | pass | Sign-in: active user, suspended tenant → tenant-suspended |
| LV-0015 | workflows:WF-ROLE-037 | pass | Root sign-in stops at step-up, confirm lands as Root |
| LV-0016 | modules:MOD-SA-08 | pass | Console Users main state (Root) |
| LV-0017 | workflows:UC-HO-02 | pass | Segregation of duties: root's own proposal, both controls disabled |
| LV-0018 | workflows:WF-ROLE-037 | pass | Second Root Super Admin invitation refused |
| LV-0019 | ai-storyboards:SB-HO-004 | pass | Critical-class change: no control at all for non-root viewer |
| LV-0020 | modules:MOD-SA-09 | pass | Create tenant disabled for Platform Engineer, reason stated |
| LV-0021 | modules:MOD-SA-09 | pass | Direct navigation to /create/ does not bypass the write-time refusal |
| LV-0022 | workflows:unnumbered@L75557 | pass | Invitation expired (Red Rock Manufacturing) |
| LV-0023 | workflows:unnumbered@L75557 | pass | Invitation to a suspended tenant blocked (Granite Hollow Tooling) |
| LV-0024 | modules:MOD-SA-10 | pass | Tenant Metrics per-tenant tab, all fifteen measures |
| LV-0025 | ai-storyboards:SB-SA-10 | pass | Tenant Metrics anonymised comparative tab, no tenant named |

Full detail — exact steps, expected/observed prose, screenshot filenames, console/network
capture — is in `docs/process/ledgers/live-verification-ledger.json` itself; this table is a
locator, not a substitute for reading the rows.

**Every row's console-error capture (`browser_console_messages({level:'error'})`) and external-request
capture (`browser_network_requests({static:true})`, filtered to non-`localhost:4173` origins) came
back empty across every document driven in this session.** Zero console errors, zero external
requests, over roughly a dozen separate browser documents (fresh sign-outs, hard navigations and
role switches each start a new one).

### LV-0009 and LV-0010 — the two rows that are not a clean pass, and why

**LV-0009 (`fail`)** reproduces, live and fresh, the carried finding that persistence is write-only:
`boot()` (`src/data/boot.ts`) rebuilds the store from the seed JSON on every document load and never
rehydrates from IndexedDB. Concretely: Nadia Ferreira's invitation acceptance was driven live in the
Hub (`/hub/accept-invitation/?tenant=TEN-IRONCLAD`, LV-0008), then a **hard** navigation back into
the Super Admin console (a fresh `page.goto`) showed Ironclad Fasteners still `Invited` with
`Activate` disabled and the *same* precondition sentence — the accept never crossed the boundary.
This was not read off a prior report; it was driven and observed in this session.

**LV-0010 (`blocked`)** is Task 8's original continuous spine ("create → Activate disabled → Hub
accept → detail moves → activate → active in list") re-attempted end to end on the current bytes.
It cannot be produced live as one continuous document under this build's shipped architecture:
`app/hub/**` and `app/super-admin/**` share no in-app navigation path (they are different personas'
surfaces — a real Tenant Admin and a real Platform team member are, in reality, two different
people in two different sessions), so any route between them is a hard page load, which LV-0009 just
showed discards the store. Separately, no seeded row sits in the narrow transitional state the
`Activate` control's own gate requires (`tenants.lifecycle === 'invited' AND` the tenant's first
`TENANT_ADMIN` row `.status === 'active'`) — confirmed by cross-referencing `tenants.json` against
`users.json` before attempting to drive it, not assumed. Task 8's own development-time report closed
this exact gap with a disclosed, reverted seed-file edit; a verification-only closure task must not
edit seed data to manufacture a state that does not otherwise exist, so the row is recorded
`blocked` with the reason rather than forced or inferred. The two halves either side of the
boundary — the Hub acceptance write (LV-0008) and the Super Admin detail page's disabled-with-reason
render (LV-0006, LV-0009) — are each independently real and driven live in this session.

## 3. Fresh whole-chain verification — `pnpm verify`

Run **twice**: once before the ledger was filled (to establish the chain was green on the bytes
Task 11 left), and once more after the ledger was written and before sealing, so the recorded exit
code is against the exact final bytes rather than a recollection.

```
$ pnpm verify
```
chains: `typecheck && validate:collections && lint && check:gate-ordering && check:boundary-rules
&& build && scan:no-external-network && scan:no-fallback-shells && ledger:reconcile`.

**First run (pre-ledger, establishing the baseline): exit 0.**
**Final run (post-ledger, on the bytes this task actually produced): exit 0.**

Key lines from the final run's full output (saved in full at the paths below):

- `tsc --noEmit` — no errors.
- `validate-collections.mjs` — all 40 collections `ok`, including `tours 15 rows`,
  `approval-requests 9 rows`.
- `eslint .` — no errors (including the boundary-rules negative-outcome checks, all reporting `ok
  [must fail] ...` for the cases that are SUPPOSED to fail import resolution).
- `check:gate-ordering` — no errors.
- `check:boundary-rules` — no errors.
- `pnpm build` — `next build` completed; registries regenerated. **Census status tally across the
  fourteen registries: `demonstrated-in-storyboard 277, mounted-in-another-screen 10,
  not-applicable 22, not-represented 4706, total 5015`** — unchanged from Task 11's close, which is
  correct: this task touches no product code, no seed, no registry input.
- `scan:no-external-network` — `0 violations across 701 source file(s) under src/+app/ and 5846
  built HTML file(s) under out/.`
- `scan:no-fallback-shells` — `0 fallback shells across 5846 built HTML file(s) under out/.`
- `ledger:reconcile` — `registry census 5015 row(s) across 14 registries; ledger 25 row(s).` Section
  A (registry rows with no ledger row): 4,990 of 5,015 — the honest backlog this scoped regression
  set leaves, stated exactly as measured. Section B (ledger rows naming a path no registry
  contains): **0** — every one of the 25 `pathId`s driven this session resolves to a real row in one
  of the fourteen registries; none is a phantom reference.

Full logs saved at:
- `/private/tmp/claude-501/-Users-tahakhan-Desktop-JBS-AMPLIFY-NIGHT-Ron-project1/18892950-1b62-4089-8a00-c17b49c750b9/scratchpad/pnpm-verify-output.txt`
  (first run)
- `/private/tmp/claude-501/-Users-tahakhan-Desktop-JBS-AMPLIFY-NIGHT-Ron-project1/18892950-1b62-4089-8a00-c17b49c750b9/scratchpad/pnpm-verify-final.txt`
  (final run, 5,279 lines) — this is the run whose exit code and census figure are load-bearing for
  this closure.

Both logs live in this session's scratchpad, not in the repository; the controller should copy
whichever it wants to keep before the scratchpad is cleaned up, or re-run `pnpm verify` itself —
it is reproducible on demand.

### `pnpm serve:out` and a final spine re-drive on the exported bytes

`pnpm build` inside the final `pnpm verify` run regenerates `out/` from scratch (`rm -rf out && next
build`), which changes Next's random per-build `_next/static/<buildId>` fingerprint even when no
source file changed — confirmed by diffing the pre-verify `.serve-snapshot/` against the
post-verify `out/`: every page differed only in that one embedded id. Rather than assume this is
harmless, `pnpm serve:out` was re-run against the fresh `out/` and the spine's entry point was
re-driven once more: signed in as Helena Voss, landed on the dashboard, opened the tenants list —
zero console errors, zero external requests, screenshot
`docs/screenshots/live/unit-01/final-export-spine-smoke-check.png`. The served export behaves
identically after the rebuild.

## 4. Seal — `node scripts/seal-manifests.mjs`

Run once after the ledger was filled and `pnpm verify` had gone green a second time, so the seal
covers the actual final bytes rather than an earlier snapshot.

```
Sealed SLICE11-40350cb6ac702e62
  product  846 files  sha256 40350cb6ac702e626dadc2cfde46637d490a20f1a0a6488a5b8a29ef0c82819f
  envelope 100 files  sha256 5b37680a8c73b4ec64f6429a3765ef4d92519fc59753fb9ffdc95beac65484c5
```

- **Product-candidate manifest** (`docs/process/ledgers/product-candidate-manifest.json`):
  `candidate_manifest_sha256` **unchanged** at `40350cb6ac702e626dadc2cfde46637d490a20f1a0a6488a5b8a29ef0c82819f`
  from Task 11's own seal, because this task's only writes (the ledger, the two manifests
  themselves, this record, and `RESUME.md`) all sit under `docs/process/`, one of the manifest's own
  declared **evidence roots**, and are excluded from the product-candidate scope by that same rule —
  not by coincidence. `git_commit` still names `79cbd4f130865253bccc967973ba04d89cc05927` (Task 11's
  commit, since this task has made no commit) and `worktree_clean` correctly reads `false`, with
  `bytes_measured_against` stating plainly: *"the working tree as it stood when this seal ran, which
  is NOT the tree of git_commit ... the worktree was dirty, and nothing here attributes these bytes
  to any commit. Verify them against the filesystem, never against the commit."* That is the honest,
  self-describing sentence the seal is designed to emit on a dirty tree — not a defect.
- **Evidence-envelope manifest** (`docs/process/ledgers/evidence-envelope-manifest.json`):
  `payload_sha256` **changed** to `5b37680a8c73b4ec64f6429a3765ef4d92519fc59753fb9ffdc95beac65484c5`
  (from `9d235de5d68afda0981f4aedecb6a743ed5c10d6891c0a9f4843f7d3b7911eca` at Task 11's close),
  because the ledger this task filled — `docs/process/ledgers/live-verification-ledger.json` — is
  itself evidence payload. `payload_count` unchanged at 100 (the ledger already existed as a payload
  member, empty; it changed size, not membership). Both manifests still exclude their own two
  outputs from the hashed scope (`scope.excludes` on the envelope manifest names both paths
  explicitly), the non-self-referential form Task 18 of the runway ruled on and this build has kept
  since.

Not committed — the controller commits, per the standing instruction.

## 5. Census — unchanged, with its arithmetic restated for the record

**277 of 5,015 demonstrated**, unchanged from Task 11's close and confirmed twice in this task (once
by an independent direct count over `registries/generated/*.json`, once by `pnpm build`'s own
regeneration inside both `pnpm verify` runs). This task touches no route file, no seed collection,
and no `build-registries.mjs` input, so the number could not honestly move, and it did not.

The arithmetic that got the unit from its start to 277, restated from `progress.md` rather than
re-derived here (the intermediate causes are recorded in detail at their own point in that ledger):

| point | census | delta | cause |
|---|---|---|---|
| Session S14 entry (runway close) | 299 | — | baseline |
| Task 4 report (defect A) | 292 | −7 | a header-comment abbreviation defeated the comment-stripped token scan for 3 identifiers, dropping 7 rows |
| Task 4 fix round 1 | 295 | +3 | 3 of 7 identifiers earned real `sourceRefs`/`const` citations on the permission decisions they govern |
| Task 4 fix round 2 (ruling) | 295 | 0 | the other 4 identifiers named screens/routes that did not exist yet — `data-carried-forward-refs` reverted rather than kept at the cost of a false claim |
| Task 7 report → fix round 1 | 269 | −25 | an orphaned 835-line `fixtures.ts`, imported by nothing, was claiming 24 workflows + 2 business-use-cases on a route that renders none of them |
| Task 7 fix round 2 | 285 | +16 | real `sourceRefs` entries earned on the rebuilt screen, confirmed byte-clean against an out-of-repo regeneration |
| Task 7 fix round 2 re-review | 284 | −1 | `WF-ROLE-021` dropped — the screen renders a pill asserting a re-notification the build never performs |
| Task 9 report | 283 | −1 | a second orphaned `fixtures.ts`, unused after the rewrite stopped importing it |
| Task 11 report | 276 | −7 | two MORE orphaned `fixtures.ts` files (third and fourth of this class this unit) |
| Task 11 fix round 1 | 277 | +1 | the true pre-Task-11 base was 284, not 283 (`ai-storyboards.json` had gone stale one commit earlier) — so the real move was 284 −8 (two orphans) +1 (a restored citation) = 277 |
| **Task 12 (this task)** | **277** | **0** | verification-only; no product/seed/registry file touched |

Net for the unit: **299 → 277, −22**, entirely from coverage-honesty corrections (five distinct
orphaned/stale-citation defects found and removed, net of the identifiers that earned their citation
back by having a screen genuinely built to demonstrate them). Not a loss of built functionality —
the opposite: every removal was a false claim the census used to carry, and Tasks 5, 6, 7 and 9 each
raised the number back up by building real, cited coverage before this task closed it out.

## 6. Screenshots

New captures from this task, all under `docs/screenshots/live/unit-01/` (25 files referenced from
ledger rows, one shared between LV-0004/LV-0005, plus one final-export smoke-check screenshot not
tied to a ledger row):

```
modules-MOD-SA-01-signed-in-dashboard.png
modules-MOD-SA-09-tenants-list.png
wizard-empty-name-next-disabled.png
wizard-review-step.png
modules-MOD-SA-09-wizard-created-detail-invited.png
spine-sign-out-redirect.png
hub-accept-invitation-ironclad-before.png
hub-accept-invitation-ironclad-after.png
detail-ironclad-post-hardnav-still-invited.png
signin-removed-generic.png
signin-invitation-pending.png
signin-account-suspended.png
signin-tenant-suspended.png
signin-root-stepup-required.png
modules-MOD-SA-08-console-users-root-main.png
workflows-WF-ROLE-037-sod-ar0002-root-own-proposal.png
workflows-WF-ROLE-037-second-root-denied-result.png
workflows-critical-no-control-ar0003-admin.png
tenant-create-denied-platform-engineer.png
tenant-create-route-direct-nav-denied.png
tenant-create-denied-wizard-finish-refused.png
invitation-expired-redrockmfg.png
invitation-tenant-blocked-granitehollow.png
modules-MOD-SA-10-tenant-metrics-main.png
tenant-metrics-anonymised-comparative.png
final-export-spine-smoke-check.png
```

The directory also holds ~205 pre-existing PNGs from Tasks 1-11's own live drives (untouched,
retained as their own record). `docs/screenshots/manifest.json` is a separate, frozen artefact from
an earlier slice (one full-page capture per required route, `capturedRoutes: 840`) that this task
did not touch and is out of this task's scope — it is not the manifest live-verification screenshots
belong in.

Per `docs/process/live-verification-procedure.md`'s own stated limit: **these image files are not
re-read by this or any later automated pass** (the deny rule that blocks it is deliberate, to save
tokens). The filename plus each row's `observed` prose is the durable, checkable record; a human
reviewer opening the PNGs is the only channel that can confirm pixels match prose.

## 7. Findings carried forward, named rather than dropped

Per the closure brief's own standard — *"the closure record names each one, or it is not an honest
record"* — restated here rather than left to be found only in `progress.md`:

1. **Persistence is write-only.** `boot()` (`src/data/boot.ts`) rebuilds the store from the seed on
   every document load and never rehydrates from IndexedDB; writes commit but nothing reads them
   back. `Repository.reset()` has no caller anywhere. **Reproduced live in this task at LV-0009** —
   not merely re-cited. A dedicated task after this unit carries both halves together: snapshot
   rehydration with real runtime validation, and the reset door with confirm, export-before-reset
   and post-reset verification.
2. **`advanceClock` moves a decorative clock.** `DemoChrome` builds its own `fixedClock` in local
   state while the product reads `store.clock` — two independent clocks. The scenario control that
   appears to advance simulated time advances a readout and nothing else. Every time-driven
   demonstration in later units is affected (pilot expiry, qualification expiry, scheduled work,
   notification escalation).
3. **The tour registry has no gate on tour targets.** `steps[].action.controlId` is allowlisted by
   name-shape (`...Id` suffix), and `spotlight`, `expectVisible` and `assertState.check` are never
   considered at all — wider than even the implementer who found it first disclosed. A reviewer's
   roughly-twenty-line scrape-and-diff proposal is recorded in `progress.md` (Task 10/11) as the
   fix shape, not yet built.
4. **The delivered console-users page renders blueprint locators in visible text.** `L91282,
   L91304, L91305, L91309, AC-43-301/302/356` come from a pre-existing slice-11 overlay component
   no task in this unit touched — a §8.6.2 violation shipped inside a page this unit otherwise
   rebuilt cleanly.
5. **Five identifiers have no honest home** under this unit's own citation rule (an identifier
   governing a permission decision goes in that call's `sourceRefs`; a bare container built only to
   satisfy the scanner is forbidden and was tried, reviewed, and reverted once already) and stay
   `not-represented`. That is the rule working as designed and also its limit — a screen can
   genuinely demonstrate something that is not itself a permission decision and have nowhere honest
   to say so. A programme-level question for whatever closes the whole citation scheme, not
   something one unit can settle.
6. **`acceptInvitation` takes a tenant id and no caller identity.** Anyone holding a tenant id — and
   tenant ids render in Super Admin URLs and table rows — can accept as that tenant's first
   administrator. No token is buildable: the `User` schema carries no credential field to bind one
   to. A prototype-versus-production boundary, not a defect introduced by this unit; recorded for
   whatever closes that matrix.
7. **A stray `git stash` entry exists on the branch**, left deliberately per Task 11's own ruling —
   `git stash show` confirms it holds a partial registry change the rebuild reproduced; dropping
   someone else's stash was judged a destructive act on work this task did not create, so it stays
   visible and named rather than tidied away silently. Still present at this task's close; not
   touched (implementers, including this one, never run destructive git operations).

## 8. What is simulated rather than real — stated plainly

- **No backend anywhere.** Every "write" is an in-memory `Repository` mutation plus a durability
  write to IndexedDB that nothing ever reads back (finding 1 above). There is no server, no network
  call that matters to product behaviour, and `scan:no-external-network` plus this task's own
  live-browser network captures (all empty) both confirm zero requests leave `localhost:4173`.
- **No real authentication.** Any non-empty password authenticates any known email address (`src/ui
  /product/runtime/session.ts#resolveSignIn`); there is no credential store, no hashing, no token.
  Sign-in outcomes are entirely a function of the seeded `users`/`tenants` collections' *status*
  fields, not of anything a caller proves.
- **No real time.** The product's simulated clock is pinned at the seed's `CANONICAL_EPOCH_MS`
  (`2026-03-02T06:00Z` platform time) for every row driven in this session; the demo control that
  claims to advance it does not touch the clock the product reads (finding 2 above).
- **The "audited session" language on the Tenant Metrics screen** ("Opening one of those records
  takes a named, audited session; this module cannot open one itself") describes a property this
  build does not implement end to end — no operational record can actually be opened from this
  console today, in any module. The screen is honest that it itself cannot do it; it does not claim
  the rest of the platform can.
- **Every screen's own on-screen disclosure** ("Simulated behaviour only. This screen is part of a
  client-validation storyboard...") was visible and rendered correctly on every route driven in this
  session — not asserted here, observed live 25 times over.

## 9. Open items at this task's close

- The seven carried findings above are not fixed by this task and are not this task's to fix; they
  are named so the next unit inherits them from the record rather than rediscovers them.
- LV-0010's blocked continuity is an architectural property of the current build (no in-app link
  between the Hub and Super Admin surfaces, and write-only persistence), not something a future
  screen task can quietly patch — it needs the dedicated persistence/reset task named in finding 1,
  or an explicit product decision that the two surfaces are never meant to share one browser session.
- The "eight screens" vs "nine screens" inconsistency in this unit's own record (§2 above) is
  flagged rather than silently resolved; whoever next touches unit-01's history should pick one
  count deliberately rather than let the two keep disagreeing.
- No completion language beyond what this record's evidence carries: this task closes unit 1's
  twelve tasks and produces the release evidence master prompt §2.3 requires in place of the deleted
  test suites; it does not claim the platform is production-ready, does not claim every one of the
  5,015 census rows is demonstrated (4,706 are honestly `not-represented`), and does not claim any
  of the seven carried findings is resolved.

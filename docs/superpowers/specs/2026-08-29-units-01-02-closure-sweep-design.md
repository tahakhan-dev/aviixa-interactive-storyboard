# Units 1 and 2 closure sweep — design

**Status:** approved — real-user explicit instruction this session ("complete the whole unit 1 and
unit 2, nothing should be remaining... production level implementation... before you move to unit
3"), under the same standing autonomous-decision authority (APP-012/018) units 1 and 2 ran under.
**Parent designs:** `docs/superpowers/specs/2026-08-28-unit-01-platform-bootstrap-and-tenant-provisioning-design.md`,
`docs/superpowers/specs/2026-08-29-unit-02-tenant-configuration-users-workers-design.md`.
**Frozen source:** `AVIIXA_Production_Product_Blueprint.md`
sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`,
18,565,031 bytes / 122,241 lines. Re-hashed at this design's start, unchanged.

---

## 1. Why this exists

Both units closed with real, individually-disclosed open items — none blocking their own scope,
all named honestly in their verification records. The client has now asked for a genuine zero:
every open item in both units either fixed for real, or explicitly and individually ruled
not-fixable-without-harm and left with that reasoning on record. This is not a new unit; it is
closing the books on the two that exist.

Two research passes (read-only, this session) grounded every item against the live code rather
than the verification records' own prose, which occasionally understated or overstated the real
gap. Findings below are what was actually found, not what was assumed going in.

## 2. Scope — the full closure list, grounded

### 2.1 Small, self-contained fixes

| # | Item | Unit | Real state (verified this session) | Fix |
|---|---|---|---|---|
| A | `advanceClock` decorative | 1 | `DemoChrome.tsx:238` owns an independent `useState(() => fixedClock(...))`, never the real `store.clock` every write reads via `.now()`. `src/scenario/controls.ts`'s own `advanceClock`/`createControls` has zero call sites — dead code. | Wire `DemoChrome`'s time controls to the real `store.clock` (reachable via the same context the file already holds). Delete or leave the dead `scenario/controls.ts` — harmless either way, not touched unless trivial. |
| B | Console-users locator leak | 1 | Confirmed live in `out/super-admin/console-users-roles-and-change-approvals/index.html`: real rendered `<p>` text reading `"Read from L91304."`, `"Caption: ... at L91280."`, dozens of `L#####` tokens — a genuine §8.6.2 violation shipped today, pre-existing, no task in unit 1 touched it. | Find the exact overlay/evidence-disclosure component (grep the built HTML for `"Read from"` to jump straight to the JSX source), move the locators into comments/registry per every other screen's established pattern. |
| C | `updateShift` missing tenant check | 2 | Named in unit 2's own closure record as residual finding 11 — `archiveShift` (same fix wave) has an explicit `resolveTenantId`/`tenant-mismatch` check; `updateShift` relies only on `checkSiteReference` catching a foreign row via its `siteId`, which works but echoes the foreign site id in the refusal. No cross-tenant write is possible either way. | Copy `archiveShift`'s own two-line tenant check into `updateShift`, same place in the sequence (after the row is found, before the write). |
| D | Unit 2 cosmetic batch | 2 | `TOUR-WORKER-ADD-001` pronoun switch (she→he) mid-narration; Task 6's report says "Scope tab" where the shipped tab id differs (doc-only, code is fine); `EvidencePanel.tsx:110,119` render "(out of Task 14 scope)" as page text (unit-1-era code, same defect class as a finding already fixed elsewhere); `PermissionsScreen.tsx`'s `AssignControl` disabled state has no visible reason text unlike its sibling `CreateAction`. | Four small, independent text/JSX fixes. Batch into one dispatch — same shape, low risk, no shared file conflicts. |
| E | Stray git stash | 1 | `stash@{0}`: a stale 5-line diff to `registries/generated/ai-storyboards.json`, an intermediate regeneration snapshot. No unique work value. | `git stash drop`. Controller runs this directly — it is not a code change, nothing to review. |
| F | `acceptInvitation` no caller-identity check | 1 | Takes only a `tenantId`, no token; `User` schema has no credential field anywhere. Building a fake token system with no real email delivery behind it would be a security theater feature, not a real one — explicitly **not** doing this. | Add a one-line on-screen disclosure (the pattern this project already uses everywhere else for simulated-vs-real gaps) stating acceptance isn't identity-verified in this simulation, if `AcceptInvitationScreen.tsx` doesn't already carry one (confirmed absent this session). |

### 2.2 Real feature builds — architectural, shared or unit-specific

**G. Persistence rehydration (shared, closes both units' "write-only persistence" finding).**
Verified this session: the write side is already fully built and correct —
`commitToPersistence` (`src/data/repository.ts:2071`) commits a full `CollectionData` snapshot to
IndexedDB's `snapshots` store at the fixed key `'repository-snapshot'` on every successful write,
in the same one-transaction discipline as the audit/event rows. `boot()` (`src/data/boot.ts:163`)
never reads it back — it always calls `createStore(seed)` from the static JSON, unconditionally.
Fix: after `bootstrapStorage()` resolves `ready-durable`, open the same database, read the
`snapshots` store at `'repository-snapshot'`; if present, runtime-validate it against the same zod
schemas `loadAndValidateSeed()` already uses (a stored snapshot that fails validation is treated as
absent — fall back to seed, never trust unverified rehydrated data); if valid, initialize the store
from it instead of the seed. `Store.restore(data: CollectionData)` already exists for exactly this.
The one gap: `Store`'s internal `sequence` counter resets to 0 in `createStore` and has no setter —
rehydration must also restore the sequence to continue past the highest sequence number in the
recovered data (derivable from the ledgers' own row ids/timestamps, or by adding a `nextSequence`
field to what gets persisted alongside the snapshot — implementer's call, whichever is more honest
to the existing shape).

**H. Session site/area scope wiring (shared, unblocks both units' disclosed scope-check gap).**
Verified this session: `useRepository.ts:136-137` already reads `session.scope?.sites`/`.areas`
correctly — the READ side has always been right. `session.ts`'s `sessionFor(user, stepUpActive)`
(line 135) never sets `.scope` on the `ProductSession` it returns, so it is always `undefined` for
every real signed-in identity, for every role, in both units. `ProductSession.scope` is already
typed for this (`AppShell.tsx`: `scope?: { sites?: readonly string[]; areas?: readonly string[] }`).
`RoleGrant` (`schemas/platform.ts:115`) already carries `siteIds`/`areaIds`/`shiftIds` keyed by
`userId`, with `revokedAt`/`expiresAt` for filtering to currently-active grants. Fix: `sessionFor`
needs the repository/ctx to look up the signing-in user's active role-grant(s) and populate
`scope.sites`/`scope.areas` from them. A user may plausibly hold more than one active grant — the
implementer should check how `assignTenantRole` (unit 2, Task 3) and any other place role-grants are
consumed handle plurality, and match that convention (most likely: union across all active grants
matching the user's role, or the single grant if one-per-user is the seeded reality — verify against
`role-grants.json` before assuming).

**I. Support-access door and Hub↔Super Admin navigation (unit 1, closes LV-0010's blocked
continuity).** Verified this session: bigger than the verification record described.
`app/super-admin/support-access/SupportAccessScreen.tsx` (967 lines) — every step is local React
state only; zero `repository.*` calls anywhere in the file. `grep` for `access-sessions`/
`AccessSession`/`createAccessSession`/`openSupportSession` in `src/data/repository.ts` returns zero
hits — there is no repository-backed access-session door at all, despite `access-sessions.json`
existing as a seeded collection (from unit 1's own original scope) and `ProductRuntime` being
confirmed (by unit 1's own final review) to preserve state across a soft navigation between
`SURF-SA` and `SURF-DOH`. Fix: build a named `createAccessSession`/`openSupportSession` door on
`Repository` following this project's established shape (static `AccessRequest`, `evaluateAccess`
first, tenant/role checks before any write), wire `SupportAccessScreen.tsx` to call it instead of
local state, and on success navigate (`next/navigation`'s `router.push`, matching how this project's
other cross-screen navigations work) into the resulting tenant's `/hub/...` route — this is what
actually exercises the soft-navigation path LV-0010 needs. Scope this door's `allowedRoles` from the
frozen source's own support-session authority (root/admin/platform engineer/support, per master
prompt §7.5 and whatever exact source table governs it — locate and cite before writing
`allowedRoles`, same discipline every prior door in this project has used).

**J. Tour registry target gate.** Verified this session: the codebase already names the exact fix
in its own comment (`src/data/schemas/index.ts` ~lines 315-336) — "NAMED DEBT, WITH AN OWNER." A
build-time script needs to scrape every literal `data-control-id="..."` across `app/**`/`src/ui/**`
into a set, then fail if any `tours.json` `steps[].action.controlId`/`.expectVisible`/`.spotlight`/
`.action.check` (for `assertState`) literal is absent from that set. The existing reference-check
mechanism (`schemas/index.ts:339-340`) only covers `action.controlId` for click/type/select — extend
it, following its own established pattern, to the other three field shapes.

**K. Tour-runner live-verification.** Not a code task — the real auto-play tour-runner UI
(`WatchButton`/`TourOverlay`/`TourControls`/`NarrationCaption` under `src/ui/demo/tour/`) is fully
built but has never been driven to completion in Chrome for release evidence in either unit; every
existing tour-shaped ledger row replicates a tour's steps by hand rather than clicking Watch and
letting it run. Drive at least one representative tour per unit to completion through the real
runner, screenshot each auto-advanced step, record `Take over` working, and add ledger rows —
closing this named gap in both units' verification records.

## 3. Explicitly not fixed, and why — these stay open by ruling, not oversight

- **Five identifiers with no citation home** (unit 1). Investigated this session: the rule that
  produces this is working exactly as designed — it refuses to fabricate a citation for something
  genuinely not yet demonstrated. "Fixing" this means inventing a citation, which is the defect the
  rule exists to prevent. Left open, explained, not touched.
- **"Eight screens" vs "nine screens"** (unit 1). A disagreement between two historical process
  documents (a task brief and a progress ledger) about a screen-count description — not a product
  defect. This project's own append-only philosophy ("a corrected history is worth less than an
  accurate record") argues against rewriting old entries for a wording disagreement. Left as-is.
- **`WF-WKR-004`'s census non-credit** (unit 2). Restoring it means rendering the identifier in
  product copy — a §8.6.2 violation of the exact class this project spent three fix rounds
  eliminating. The workflow itself is real and runs; only the citation-counting mechanism's own
  stated rule (comments don't count) excludes it. Not touched.
- **A write denial unobservable from the UI for a role the screen gates out** (unit 2). The only way
  to make this "observable" would be exposing a repository handle on `window` in a static-export
  product build, or building a whole new dev-only test harness this project's own policy (§2.3,
  APP-020: no test cases, ever) forbids. The denial is real and enforced at the door — only its
  *demonstration* through a real browser click is structurally impossible for a control the screen
  correctly never renders. Not touched.

## 4. Architecture note — no shared-file collisions between G/H/I

`G` (persistence) touches `src/data/boot.ts` and `src/persistence/*`. `H` (session scope) touches
`src/ui/product/runtime/session.ts`. `I` (support-access) touches `src/data/repository.ts` (a new
door) and `app/super-admin/support-access/SupportAccessScreen.tsx`. These are independent enough to
sequence without contention, but `repository.ts` is touched by both `I` (new door) and indirectly
read by `G`'s validation logic — sequence `G` and `I` with a commit between them, never in parallel,
matching this project's own "never dispatch multiple implementation subagents in parallel" rule.

## 5. Verification

Same as every prior task in this project: no test cases (§2.3/APP-020). Compile-level checks
(`pnpm typecheck && pnpm lint && node scripts/validate-collections.mjs && pnpm build`, plus
`pnpm ledger:reconcile`) must exit 0 after every task. Live verification in real Chrome against the
served static export is the release evidence for every behavioral change (G, H, I, J's screen-facing
pieces, K). Frozen source hash re-verified at every task boundary.

## 6. Closure

When every item in §2 is either fixed-and-verified or already covered by §3's rulings, both units'
verification records get a final amendment section (matching the pattern unit 2's own final-review
fix wave already established), both are resealed, and `docs/process/RESUME.md` is updated to state
both units as fully closed with zero remaining open items, before unit 3 begins.

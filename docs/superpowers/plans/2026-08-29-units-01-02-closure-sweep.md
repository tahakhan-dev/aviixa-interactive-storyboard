# Units 1 and 2 closure sweep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every remaining open item in units 1 and 2's own verification records for real —
five small fixes, three real feature builds (persistence rehydration, session scope wiring, a
support-access door with navigation), one registry-gate extension, one live-verification pass on
the tour runner — and amend both closure records to state a genuine zero, with the three items that
should NOT be "fixed" named as deliberate rulings rather than silently dropped.

**Architecture:** No new subsystem. Every fix lands inside the shape the two units already
established: named `AccessRequest` doors on `Repository` (`evaluateAccess` first, row-dependent
scope at the call site, never baked into a static constant); the existing IndexedDB persistence
bridge (`src/persistence/*`) gets a read path to match the write path it already has; `sessionFor`
gains repository access to populate what `useRepository.ts` already reads correctly. No component
imports a seed file; no backend; no test cases.

**Tech Stack:** Next.js 16.3.1 App Router (`output: "export"`), React 19.2.8, TypeScript strict,
zod 4.4.3, pnpm 11.20.0. Verification is real Google Chrome through the Chrome MCP server
(`mcp__plugin_superpowers-chrome_chrome__use_browser`) against the served static export.

**Spec:** `docs/superpowers/specs/2026-08-29-units-01-02-closure-sweep-design.md`

## Global Constraints

- **No test cases.** Master prompt §2.3 and APP-020. Do not create, extend or repair any
  `*.test.ts`/`*.test.tsx`, Playwright spec, or snapshot. `/superpowers:test-driven-development` is
  policy-excluded.
- **Verification is live.** Each task's green step is a recorded run in real Chrome through the
  Chrome MCP server plus the compile-level checks: `pnpm typecheck`, `pnpm lint`,
  `node scripts/validate-collections.mjs`, `pnpm build`.
- **No backend, ever.** No API route, Route Handler, Server Action, middleware, `fetch` to any
  external origin, secret, or environment variable. `output: "export"` must keep building.
- **No component imports a seed file.** Business truth reaches a component only through
  `src/data/repository.ts`, obtained from `useRepository()`.
- **`src/ui/product/**` must never import `src/ui/demo/**`.** Enforced by
  `pnpm check:boundary-rules`. Demo may import product.
- **§8.6.2 product fidelity.** No file this plan creates or rebuilds may render a blueprint line
  locator (`L42806`), a bare requirement identifier, a narrative paragraph, or a bullet list as the
  primary content of a product screen. Source citations belong in **code comments**, the
  traceability registry, and tour narration — never in rendered text.
- **Frozen source** sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`.
  Re-hash at task entry. A difference is source drift: stop and report.
- **Cite the blueprint, never the graph.** Write **"master prompt §X"** for master-prompt sections.
- **A named door mirrors the existing doors' shape exactly**: its own `AccessRequest` constant with
  `action`/`allowedRoles`/`sourceRefs`, called through `evaluateAccess` once, up front, before any
  row is touched; row-dependent scope (`requiredSites`/`requiredAreas`) computed and spread in at
  the call site, never baked into the static constant.
- **Fix once, where all callers route.** If a defect is in a shared component (`AiDegradationOverlay`,
  `DemoChrome`), fix it there — never patch one mount point and leave siblings broken.
- **Simulated clock only.** No `Date.now()`, no argument-less `new Date()`, no `Math.random()` in
  `src/data`, `src/ui/product`, `src/persistence`, or `src/tours`.
- **Accessibility floor:** WCAG 2.2 AA.
- **Every interactive control carries `data-control-id`.**
- **Implementers never run git.** The controller commits.
- **Do not rewrite unit 1 or unit 2's existing verification-record sections.** Task 10 appends a
  final closure amendment, exactly as unit 2's own final-review fix wave amended its record — it
  does not edit `§1`-`§9` of either file's prose.

---

## File structure

| path | responsibility |
|---|---|
| `src/ui/demo/DemoChrome.tsx` | advanceClock reads/writes the real `store.clock`, not a decorative one |
| `app/hub/accept-invitation/AcceptInvitationScreen.tsx` | one-line disclosure that acceptance isn't identity-verified |
| `src/ai/five-surface/AiDegradationOverlay.tsx` | three `sourceRef` locators rendered as visible text, fixed at the source component |
| `src/data/collections/tours.json` | `TOUR-WORKER-ADD-001` pronoun fix |
| `src/ui/demo/EvidencePanel.tsx` | two "(out of Task 14 scope)" strings removed |
| `app/hub/permissions-roles-and-access/PermissionsScreen.tsx` | `AssignControl` gains visible disabled-reason text |
| `src/data/repository.ts` | `updateShift`'s tenant check; new `createAccessSession`/`openSupportSession` door |
| `src/data/boot.ts`, `src/persistence/schema.ts`, `src/persistence/bootstrap.ts` (new read function) | persistence rehydration |
| `src/data/store.ts` | gains a way to restore `sequence`, not just `data` |
| `src/ui/product/runtime/session.ts` | `sessionFor` populates `.scope` from active role-grants |
| `app/super-admin/support-access/SupportAccessScreen.tsx` | wired to the new door, navigates on success |
| `scripts/check-tour-targets.mjs` (new) | literal-control-id build-time gate for tours |
| `docs/process/2026-08-29-unit-01-verification.md`, `docs/process/2026-08-29-unit-02-verification.md`, `docs/process/RESUME.md` | closure amendments |

---

## Task 1: Small fixes batch A — advanceClock, git stash, acceptInvitation disclosure

**Files:**
- Modify: `src/ui/demo/DemoChrome.tsx`
- Modify: `app/hub/accept-invitation/AcceptInvitationScreen.tsx`
- No file change: `git stash drop` (a step, not a code change)

**Interfaces:**
- Consumes: `useStore()` (already imported in `DemoChrome.tsx`, confirmed — `const store = useStore()`
  sits a few lines above the decorative `clock` state).
- Produces: nothing later tasks import.

- [ ] **Step 0: `git stash drop`.** Confirmed this session: `stash@{0}` holds a stale 5-line diff to
  `registries/generated/ai-storyboards.json` only, no unique work. Run it, confirm `git stash list`
  is empty afterward.

- [ ] **Step 1: Reproduce live** — open `/super-admin/console-users-roles-and-change-approvals` (or
  any screen with the demo chrome open), click "Advance 1 hour", confirm the clock readout changes
  but nothing the product actually reads (an invitation's computed expiry state, a qualification's
  computed status) moves. Screenshot the mismatch.

- [ ] **Step 2: Fix `DemoChrome.tsx`**

Remove the decorative `const [clock] = useState<Clock>(() => fixedClock(CANONICAL_EPOCH_MS))` and
`const [clockMs, setClockMs] = useState<number>(() => clock.now())`. Replace with reading the real
store's clock directly:

```ts
const store = useStore() // already present above
const [, forceRender] = useState(0)
useEffect(() => store.subscribe(() => forceRender((n) => n + 1)), [store])
```

`advanceClock(ms: number)` in the `controller` object becomes:

```ts
advanceClock(ms: number) {
  store.clock.advance(ms)
  store.notify()
},
```

Read `Clock`'s real interface in `@/domain/clock` first to confirm `.advance()` is the real method
name and that `store.clock` is stable across renders (it is — `createStore` creates it once). The
readout (`controller.clockMs`) becomes `store.clock.now()` read fresh each render rather than a
separate piece of state. If `DemoControllerApi`'s `clockMs` field needs to stay for
`ScenarioControls.tsx`'s existing prop shape, compute it inline in the `useMemo` from
`store.clock.now()` rather than a separate `useState`.

Leave `src/scenario/controls.ts`'s dead `advanceClock`/`createControls` untouched — confirmed zero
call sites this session; deleting it is optional cleanup outside this fix's scope.

- [ ] **Step 3: `AcceptInvitationScreen.tsx` disclosure**

Confirmed absent this session: grep the file for "identity" / "verif" / "token" finds nothing. Add
one line, in the same place and style this project uses for every other simulated-vs-real
disclosure (find one existing `NOT_REAL_TEXT`-style constant or inline disclosure paragraph in this
same file or a sibling accept/invite screen to match tone exactly), stating plainly that accepting
an invitation in this simulation does not verify the accepting person's identity against anything a
real invitee received — there is no real email delivery or token behind the flow.

- [ ] **Step 4: Compile-level checks** — `pnpm typecheck && pnpm lint && pnpm build`, exit 0.

- [ ] **Step 5: Live-verify** — advance the clock, confirm a real product state that depends on time
(qualification expiry banner, invitation-pending state, whichever is easiest to reach) now actually
moves. Screenshot before/after. Confirm the accept-invitation disclosure renders, screenshot it.

- [ ] **Step 6: Report.**

---

## Task 2: `AiDegradationOverlay` locator leak — the real source, not console-users specifically

**Files:**
- Modify: `src/ai/five-surface/AiDegradationOverlay.tsx`

**Interfaces:**
- Consumes: whatever `reading.sourceRef` / `note.sourceRef` / `absence.sourceRef` actually are —
  confirm their real type in this file before assuming they're bare `L#####` strings.
- Produces: nothing later tasks import.

- [ ] **Step 1: Confirm the real scope**

Confirmed this session: `grep -rn "Read from" src/ app/` finds THREE render sites in this ONE file
— `AiDegradationOverlay.tsx:171,300,409`, each `<p className="...">Read from {X.sourceRef}.</p>`.
The design doc's "pre-existing overlay component, no task in unit 1 touched" description undersold
this — it is a SHARED overlay, not scoped to console-users; find every route that mounts it
(`grep -rln "AiDegradationOverlay" app/`) before fixing, because §8.6.2 fidelity must hold on every
one of them, not just the one this session happened to spot it on. Also check
`src/surfaces/sa/ai-degradation.ts:231`'s `` `Caption: ${SA_MATRIX_ATTRIBUTION.caption}, at
${SA_MATRIX_CAPTION_REF}.` `` — confirm whether this string is ALSO rendered somewhere (it feeds
data this overlay or a sibling might consume) or is comment-only; fix it too if it renders.

- [ ] **Step 2: Fix the render, keep the citation**

For each of the three `<p>Read from {X.sourceRef}.</p>` sites: `sourceRef` is a real, useful
citation — it should NOT disappear, it should move to where every other fixed instance of this
defect in this project moved its citation: a code comment near the render, plus (if this overlay's
data already has registry/traceability wiring) the traceability registry. Replace the rendered text
with either (a) a named-identifier phrasing with no line number (matching the pattern
`PermissionsScreen.tsx` and others in unit 2 already established — e.g. "Read from the AI
degradation matrix" instead of "Read from L91304"), or (b) drop the sentence from rendered output
entirely if it's redundant with what's already stated elsewhere on screen, and put the citation in
a comment instead. Prefer (a) if the citation is genuinely informative to a reader; don't invent
information the source doesn't have.

- [ ] **Step 3: Compile-level checks** — exit 0.

- [ ] **Step 4: Live-verify** — visit every route this overlay mounts on (from step 1's grep),
confirm no `L\d{4,6}` token or spelled-out "line NNNNN" renders anywhere in the overlay's states.
Grep the rebuilt `out/` for the removed strings to confirm they're gone from every route, not just
one. Screenshot at least two distinct mount routes.

- [ ] **Step 5: Report** — the full list of routes this overlay mounts on, and confirmation each was
checked, not just the one console-users happened to be found on.

---

## Task 3: Unit 2 cosmetic batch

**Files:**
- Modify: `src/data/collections/tours.json`
- Modify: `src/ui/demo/EvidencePanel.tsx`
- Modify: `app/hub/permissions-roles-and-access/PermissionsScreen.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing later tasks import.

- [ ] **Step 1: `TOUR-WORKER-ADD-001` pronoun fix**

Named in unit 2's own report (`task-7-report.md`) and its final review: narration switches "she"→
"he" partway through, a leftover from an actor swap during drafting. Read the tour's `narration`
fields in `tours.json`, confirm the actor's real gender-neutral or established pronoun (check the
seeded user's own established pronoun elsewhere in this project's narration, or default to
consistent use of the actor's name instead of a pronoun if genuinely ambiguous), make every
narration line in this one tour consistent.

- [ ] **Step 2: `EvidencePanel.tsx` process-language strings**

Lines 110 and 119 (confirmed this session) render `"(out of Task 14 scope)"` as visible text — the
exact same defect class as unit 2's own final-review Important 5, in unit-1-era code. Remove the
parenthetical, same fix shape: state the fact without naming an internal task number.

- [ ] **Step 3: `PermissionsScreen.tsx`'s `AssignControl` disabled-reason text**

Parked as Minor in unit 2's Task 3 review: unlike `CreateAction` elsewhere in the same file (which
pairs `aria-describedby` with a visible reason paragraph when disabled), `AssignControl`'s disabled
state has no visible reason. Read `CreateAction`'s exact pattern in this file and apply the same
shape to `AssignControl` — an `aria-describedby`-linked visible paragraph naming why the control is
disabled for the current role (reuse whatever reason string the door's own denial already carries,
don't invent new wording).

- [ ] **Step 4: Compile-level checks** — exit 0.

- [ ] **Step 5: Live-verify** — drive `TOUR-WORKER-ADD-001` to completion, confirm narration reads
consistently. Visit whatever screen renders `EvidencePanel`, confirm the strings are gone.
Screenshot `AssignControl` disabled with its new visible reason for a role that can't assign.

- [ ] **Step 6: Report.**

---

## Task 4: `updateShift` tenant check

**Files:**
- Modify: `src/data/repository.ts`

**Interfaces:**
- Consumes: `archiveShift`'s own `resolveTenantId`/tenant-mismatch pattern, in the same file, as the
  exact template to copy.
- Produces: nothing later tasks import.

- [ ] **Step 1: Copy the two-line check**

Named as residual finding 11 in unit 2's own closure record. `archiveShift` resolves the target
row's tenant via `resolveTenantId` and explicitly refuses on a mismatch before proceeding; `updateShift`
relies only on `checkSiteReference` catching a foreign row through its `siteId`, which works but
echoes the foreign site's id in the refusal message to a caller who already cleared the role floor.
Add the same explicit `resolveTenantId` + `TENANT_MISMATCH` refusal to `updateShift`, in the same
relative position in the sequence `archiveShift` uses (after the row is found, before any further
scope/reference checks or the write).

- [ ] **Step 2: Compile-level checks** — exit 0.

- [ ] **Step 3: Live-verify** — same style as unit 2's own fix-round evidence for this exact class of
check (Task 1's fix round 2, Task 4's fix round 1): a forged-`AccessContext` direct-call script
(no live UI path exists to a cross-tenant `updateShift` attempt, confirmed by every prior task that
hit this same limitation) proving the refusal is `TENANT_MISMATCH`, not the site-reference message,
plus a same-tenant control call that still succeeds/fails for an unrelated reason. Also re-drive
`updateShift`'s ordinary success path live (Tenant Admin editing a real Shift) as a regression check
since this touches the same function LV-0060 already covers.

- [ ] **Step 4: Report.**

---

## Task 5: Persistence rehydration

**Files:**
- Modify: `src/data/boot.ts`
- Modify: `src/persistence/schema.ts` (or create `src/persistence/snapshot.ts` if a new file is
  cleaner — implementer's call, matching this project's existing file-granularity convention)
- Modify: `src/data/store.ts`

**Interfaces:**
- Consumes: `commitToPersistence`'s own `SNAPSHOT_STORE`/`SNAPSHOT_KEY = 'repository-snapshot'`
  constants (`src/data/repository.ts:2030,2054` — confirm these exact names before writing the read
  path; the read path must use the IDENTICAL store name and key the write path already uses, or
  rehydration silently reads nothing).
- Produces: `boot()`'s existing signature and `BootResult` shape stay the same — this is an internal
  change to what `boot()` does before returning, not a new public interface.

- [ ] **Step 1: Reproduce live** — create a Site as Tenant Admin, reload the page, confirm the Site
  is gone (back to seed). Screenshot before/after reload.

- [ ] **Step 2: Write the read path**

Add a function reading the `snapshots` store at key `'repository-snapshot'` (the exact same
`SNAPSHOT_STORE`/`SNAPSHOT_KEY` constants `commitToPersistence` uses — import them or redeclare
identically, confirm which this project's convention prefers by checking whether `schema.ts` already
exports shared constants other files import, versus each file declaring its own `satisfies (typeof
STORES)[number]` constant the way `repository.ts:2030` does):

```ts
async function readLatestSnapshot(db: IDBDatabase): Promise<CollectionData | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('snapshots', 'readonly')
    const req = tx.objectStore('snapshots').get('repository-snapshot')
    req.onsuccess = () => resolve((req.result as CollectionData | undefined) ?? null)
    req.onerror = () => reject(req.error ?? new Error('snapshot read failed'))
  })
}
```

Place this in `src/persistence/schema.ts` beside `openDatabase` (same file already owns
`readMeta`/`writeMeta`-shaped helpers in `bootstrap.ts`; put this one wherever the project's own
layering puts "reads a specific store by key" helpers — check `bootstrap.ts`'s `readMeta` for the
precedent and match its file placement, not necessarily its own file).

- [ ] **Step 3: Runtime-validate before trusting it**

A stored snapshot may be stale (schema drift) even when `bootstrapStorage`'s own checksum-verifying
step passed (that checksum covers the SCHEMA — store names/version — not the CONTENT of what's
inside `snapshots`). Before using a read snapshot, validate every collection's rows against the same
zod schemas `loadAndValidateSeed()` already runs (`COLLECTIONS[name].schema.safeParse`, row by row).
If ANY row fails, treat the whole snapshot as absent and fall back to the seed — never partially
trust a snapshot, and never throw; this is the same "corrupt-quarantined"-shaped failure mode
`bootstrapStorage` already uses elsewhere, applied here to content rather than schema metadata.

- [ ] **Step 4: Wire into `boot()`**

After `bootstrapStorage(factory)` resolves, if `bootstrap.state === 'ready-durable'`, attempt
`readLatestSnapshot` (open the db again, or keep it open from `bootstrapStorage` if that's cleaner
— check whether `bootstrapStorage` already closes its `db` handle before returning, since
`boot()` would need to reopen). If a valid snapshot exists (step 3), call `store.restore(snapshot)`
after `createStore(seed)` instead of using the seed's own data — or, cleaner, change `createStore`'s
signature to accept an optional pre-validated `CollectionData` override so the store is built
correctly the first time rather than built-then-immediately-replaced. Implementer's call which is
tidier; either must produce byte-identical behavior for the "no snapshot / invalid snapshot" case
(seed used, exactly as today).

- [ ] **Step 5: Fix the sequence-continuation gap**

`Store.nextSequence()` (`src/data/store.ts`) starts a fresh `sequence = 0` on every `createStore`
call regardless of whether rehydrated data is passed in. `nextSequence()` feeds a handful of
generated ids (`RG-INVITE-${store.nextSequence()}` etc., `repository.ts:2700,2849,2983`) and an
event/audit ordering field (`repository.ts:2238`). A restarted-at-1 sequence after rehydration risks
a generated id colliding with one already present in the restored data (e.g. a fresh session
generating `RG-INVITE-3` when a prior session's restored data already has that exact id). Add a way
for `Store` to be told its starting sequence on construction/restore — either a second parameter to
`createStore`/`restore`, or a new `Store.seedSequence(n: number): void` method called once right
after `restore()` in `boot()`. Derive the correct starting value by scanning the restored data's
generated-id patterns (`RG-INVITE-`, `RG-CREATE-`, `RG-ASSIGN-` prefixes — find the max numeric
suffix across all three) OR by persisting the sequence number itself alongside the snapshot (a
second key in the same transaction `commitToPersistence` already runs, e.g.
`tx.objectStore(SNAPSHOT_STORE).put(currentSequence, 'repository-sequence')`) — the second approach
is more honest and less fragile than reverse-parsing generated ids; prefer it, and if chosen, this
step also touches `commitToPersistence` in `repository.ts` to persist the sequence value each write
already has available (`store.nextSequence()`'s own return value from that commit, or a `peekSequence()`
read-without-incrementing added to `Store` for this purpose).

- [ ] **Step 6: Compile-level checks** — exit 0.

- [ ] **Step 7: Live-verify**

Create a Site as Tenant Admin. Reload the page. Confirm the Site is STILL there (real rehydration,
not the seed). Create a second Site after reload, confirm no id collision with anything generated
before the reload (drive an action that uses `nextSequence()`-derived ids, e.g. inviting a console
user, both before and after a reload, confirm the two ids don't collide). Corrupt the stored snapshot
deliberately (via the demo chrome's failure injection, or by writing an invalid row directly through
devtools if no in-product control exists) and confirm the fallback to seed happens cleanly with no
thrown error and a legible state (not a blank screen). Screenshot each state.

- [ ] **Step 8: Report** — include whichever design choice was made in steps 4/5 and why, since the
  plan left both genuinely open pending what the implementer finds cleanest against the real code.

---

## Task 6: Session site/area scope wiring

**Files:**
- Modify: `src/ui/product/runtime/session.ts`

**Interfaces:**
- Consumes: `RoleGrant` (`src/data/schemas/platform.ts:115` — `userId`, `siteIds`, `areaIds`,
  `shiftIds`, `revokedAt`, `expiresAt`, confirmed real this session); the plurality convention
  already established in `repository.ts:2950-2952` (`assignTenantRole`'s duplicate-grant check):
  `(store.get('role-grants') as readonly RowOf<'role-grants'>[]).filter((g) => g.userId === targetUser.id && g.revokedAt === null)` —
  confirmed this session that a user CAN hold multiple simultaneous active grants (that filter's
  whole purpose is preventing a second grant of the SAME role, implying different-role grants are
  legitimate and expected). `useRepository.ts:136-137` already reads `session.scope?.sites`/`.areas`
  correctly — do not touch that file, only what feeds it.
- Produces: `ProductSession.scope` (`AppShell.tsx`, already typed
  `{ sites?: readonly string[]; areas?: readonly string[] }`) — populated, not a new field.

- [ ] **Step 1: Reproduce live** — sign in as a seeded, site/area-scoped Supervisor (e.g. Bright
  Bikes `RG-0003`, `siteIds: ["SITE-BB-RIVERSIDE"]`, per unit 2's own findings), attempt an action
  outside their scope that a correctly-wired session should refuse. Confirm today it's NOT refused
  (or, if the write door itself refuses due to `siteScope.length === 0` bypassing the scope check
  entirely, confirm THAT — either way, screenshot the current, wrong-because-unscoped behavior).

- [ ] **Step 2: Wire `sessionFor` to populate scope**

`sessionFor` (`session.ts:135`) currently takes only `(user: RowOf<'users'>, stepUpActive = false)`.
It needs repository/store access to query role-grants. `resolveSignIn` (line 160) already receives
`repository: Repository, ctx: AccessContext` — thread these (or just the pieces needed) into
`sessionFor`, called from `resolveSignIn` at line 199 (`sessionFor(user)`) and from wherever
`resolveStepUpCompletion` calls it for the root's own step-up landing (find that second call site —
it exists per this file's own doc comments about `stepUpActive: true`).

```ts
function activeGrantsFor(repository: Repository, ctx: AccessContext, userId: string): readonly RowOf<'role-grants'>[] {
  return repository
    .list('role-grants', ctx)
    .where((g) => g.userId === userId && g.revokedAt === null)
    .all()
    .filter((g) => g.expiresAt === null || g.expiresAt > ctx.state /* or whatever the real "now" comparison shape is — check how expiry is compared elsewhere, e.g. qualification expiry logic, and match it exactly rather than inventing a comparison */)
}
```

Confirm `Repository`'s real query-builder method names (`.list().where().all()` or similar — check
one existing call, e.g. `repository.ts:2950`'s direct `store.get('role-grants')` cast-and-filter
shows the LOWER-level shape; `sessionFor` may need `store` directly rather than the `Repository`
query surface, since it currently only takes `user` — check whether `resolveSignIn`'s existing
`repository.list('users', ctx).where(...).first()` call at line 166 is the pattern to match for
consistency, or whether direct `store` access is more appropriate here since this runs before a
session/AccessContext fully exists in the normal sense).

Union `siteIds`/`areaIds` across all active grants found (a Set, deduplicated, converted to
`readonly string[]`). Build `scope: { sites: [...siteSet], areas: [...areaSet] }` and include it in
the returned `ProductSession` — but ONLY when the resulting arrays are non-empty (an empty `scope`
object vs. `undefined` may matter to `useRepository.ts`'s own `session.scope?.sites ? [...] : []`
check — confirm this produces identical behavior to today for a user with NO scoped grants, i.e. a
Tenant Admin with tenant-wide authority should still see `siteScope: []`/unrestricted, not an
accidentally-empty-but-present `scope` object that changes evaluation semantics; read
`useRepository.ts:130-138` closely before deciding whether to omit `scope` entirely or set it to
`{ sites: [], areas: [] }` for an unscoped identity).

- [ ] **Step 3: Compile-level checks** — exit 0.

- [ ] **Step 4: Live-verify**

Sign in as the same scoped Supervisor from step 1. Confirm `ProductSession.scope` is now populated
(inspect via the demo chrome's inspector, or a console read if no in-product view exists). Attempt
the same out-of-scope action from step 1 — confirm it is NOW refused, live, through the real UI, not
a forged context (this is the point of this fix: previously-unreachable scope branches become real).
Attempt an in-scope action, confirm it still succeeds (regression check — scoping must not
over-restrict). Sign in as an unscoped Tenant Admin, confirm nothing regresses (full access as
before). Re-drive AT LEAST the scope-dependent branches this plan's own Task 4, and unit 1/2's
`createAreaUnderSite`/`createLocationUnderArea`/`createShift`/`updateShift`/`assignTenantRole`
previously verified only via forged context — since real scope now exists, these become newly
live-verifiable; drive as many as reasonably fit in one session and note in the report which
specific ledger rows (by id) this newly makes live-verifiable rather than forged-context-only.

- [ ] **Step 5: Report** — which ledger rows across both units are now upgradeable from
  forged-context evidence to real live evidence (name them; Task 10 updates the ledger).

---

## Task 7: Support-access door and Hub↔Super Admin navigation

**Files:**
- Modify: `src/data/repository.ts` (new door)
- Modify: `app/super-admin/support-access/SupportAccessScreen.tsx`

**Interfaces:**
- Consumes: `evaluateAccess`, the named-door shape from any existing door (`createTenantUser` is a
  clean small reference), `router.push` (`next/navigation`) for the nav-on-success step.
- Produces: `repository.openSupportSession(...)` (or `createAccessSession` — pick one name and use
  it consistently; check `access-sessions.json`'s own seeded row shape first to see if a name is
  already implied by the collection's own field naming).

- [ ] **Step 1: Reproduce live and confirm scope**

Confirmed this session: `SupportAccessScreen.tsx` (967 lines) has ZERO `repository.*` calls — every
step (`setSessionRequested`, `setRootAuthorised`, `setAdminAuthorised`, etc.) is local React state.
`grep` for `access-sessions`/`AccessSession`/`createAccessSession`/`openSupportSession` in
`repository.ts` returns zero hits. There is no door to wire navigation onto — build one first. Read
the full screen to understand its existing step sequence (request → root/admin authorization →
active session → end session) before designing the door's write shape; the door should model
whatever this screen's local state machine ALREADY expresses, just make it real and durable.

- [ ] **Step 2: Find the source authority for who may open a support session**

Master prompt §7.5 and unit 1's own build reference support sessions ("Opening a read-only support
session into a tenant" — a workflow this project's own registries may already track, check
`registries/generated/workflows.json` for a `WF-ROLE-022`-shaped id, which unit 1's own registry
grepping found earlier this session: `WF-ROLE-022 | demonstrated-in-storyboard | Opening a
read-only support session into a tenant`). Confirm this workflow's exact role authority
(Root/Admin/Platform Engineer/Support, per master prompt §7.5's candidate matrix) by reading its
citation in the frozen source before writing `allowedRoles` — do not assume the generic platform
floor is correct without checking, matching the discipline every prior door in this project has
needed. Also read `access-sessions.json`'s real schema (`schemas/platform.ts` or wherever it's
defined) for the exact fields a row needs (tenant id, granted-by, expiry/time-box, read-only scope).

- [ ] **Step 3: Build the door**

```ts
const OPEN_SUPPORT_SESSION_REQUEST: AccessRequest = {
  action: 'open-support-session',
  allowedRoles: [/* from step 2's research */],
  sourceRefs: [/* the real cited line(s) */, 'repository.ts'],
}
```

`evaluateAccess` first, before any row read. The session this creates is READ-ONLY into the target
tenant (per the workflow's own name) — the door does not grant any WRITE authority into that
tenant's data; it only creates the `access-sessions` row that marks the session as active/time-boxed,
which is what the screen's existing UI already implies it should do. Follow the compound-write
pattern (`createTenantUser`'s shape) if creating the session also needs an audit/notification side
effect the frozen source requires — check before assuming a plain single-row create suffices.

- [ ] **Step 4: Wire the screen and add navigation**

Replace `SupportAccessScreen.tsx`'s local state machine's terminal "active session" step with a real
call to the new door. On success, use `router.push` to navigate into the target tenant's `/hub/...`
landing route (find the exact Hub landing path this project uses elsewhere for a tenant — likely
something parameterized by tenant id, or the Hub simply reads "current tenant" from the session/
support-session state now in place; check how `useRepository.ts`/`useAccessContext` currently
determine which tenant a Hub screen renders for, since a support session changes that from the
signed-in identity's own `tenant` to the SESSION's target tenant — this may need `useAccessContext`
or a sibling hook to also consult an active support session, not just `ProductSession.tenant`; read
that hook in full before assuming a bare `router.push` alone is sufficient). This is the step that
finally exercises the soft-navigation `ProductRuntime` was already confirmed (unit 1's own final
review) to support.

- [ ] **Step 5: Compile-level checks** — exit 0.

- [ ] **Step 6: Live-verify**

As a Root/Admin/Platform Engineer/Support (per step 2's real authority), open a support session into
a real seeded tenant. Confirm the browser tab's URL actually changes to a `/hub/...` route (the soft
navigation). Confirm the Hub screen renders as read-only for this session (no write action should
succeed — the support session grants READ, not write). Confirm ending the session (the screen's own
"End session" control, per unit 1's `WF-ROLE-023`) returns to the Super Admin console cleanly.
Attempt this as a role the source excludes, confirm the door refuses with a real citation-backed
reason. This drives LV-0010's previously-blocked spine continuity for the first time — name the
exact ledger row(s) this closes in the report.

- [ ] **Step 7: Report.**

---

## Task 8: Tour registry target gate

**Files:**
- Create: `scripts/check-tour-targets.mjs`
- Modify: `package.json` (wire the new script into `pnpm verify`'s chain, matching how
  `check:gate-ordering`/`check:boundary-rules` are already wired)

**Interfaces:**
- Consumes: every `data-control-id="literal-string"` JSX attribute across `app/**`/`src/ui/**`
  (skip any composed/template-literal value — confirmed this session, per `schemas/index.ts`'s own
  "NAMED DEBT" comment, that this is the correct and INTENTIONAL scope limit, not a shortcut: a
  composed control id (`${idPrefix}-select-${rowId}`) is role/route/data-conditional and only the
  real runtime `TourRunner` (`src/tours/runner.ts`, `src/tours/actions.ts`) can ever validate it —
  do not attempt to statically resolve composed ids).
- Produces: a build failure naming the exact tour id, step index, and missing control id when a
  LITERAL `tours.json` `steps[].action.controlId` / `.expectVisible` / `.spotlight` /
  `.action.check` (for `assertState` steps, confirmed this session: `check: z.string().min(1)`,
  "a controlId, resolved exactly like `expectVisible`") string is absent from the scraped set.

- [ ] **Step 1: Read the reference implementation**

`scripts/validate-collections.mjs` is the sibling script this new one matches in shape/CLI
conventions (exit code, error format). Read it for the pattern.

- [ ] **Step 2: Write the scraper**

Walk `app/**/*.tsx` and `src/ui/**/*.tsx` (confirm the real glob boundaries — check whether other
control-bearing files live outside these two roots, e.g. `src/surfaces/**` per this session's own
door investigations), regex-match `data-control-id="([^"$]+)"` (the `[^$]` exclusion or an
equivalent check rejects anything containing a template-literal `${` — a literal string attribute
never does, a composed one always does) into a `Set<string>`.

- [ ] **Step 3: Write the checker**

Load `src/data/collections/tours.json`. For each tour, each step: read `action.controlId` (click/
type/select), `expectVisible`, `spotlight`, and `action.check` (assertState) — for each one that is
present AND does not itself contain `${`-shaped composition (skip composed ones per the scope
above), confirm it exists in the scraped set. Collect every miss; if any, print tour id + step index
+ field name + missing value for each, exit 1.

- [ ] **Step 4: Wire into `pnpm verify`**

Add to `package.json`'s script chain, in the same position as `check:gate-ordering`/
`check:boundary-rules` (before `build`, since this is a fast static check that should fail before a
slow build attempt).

- [ ] **Step 5: Compile-level checks** — run the new script standalone first, confirm it passes
clean against the CURRENT `tours.json` (if it doesn't, something is genuinely broken and must be
fixed, not the gate loosened). Then run full `pnpm verify`, exit 0.

- [ ] **Step 6: Prove the gate can fail** — per this project's own "a gate that cannot fail is worse
than no gate" rule (RESUME.md §7): temporarily rename one real literal control id referenced in
`tours.json` to something nonexistent, confirm the new script catches it with a clear message naming
the tour/step, then revert.

- [ ] **Step 7: Report.**

---

## Task 9: Tour-runner live-verification

**Files:**
- Modify: `docs/process/ledgers/live-verification-ledger.json`

**Interfaces:**
- Consumes: `WatchButton`/`TourOverlay`/`TourControls`/`NarrationCaption` (`src/ui/demo/tour/`) — the
  real auto-play mechanism, confirmed built and never driven to completion for release evidence in
  either unit.
- Produces: new ledger rows.

- [ ] **Step 1: Drive at least one tour per unit through the REAL runner**

Not by hand-clicking each control (every existing tour-shaped ledger row already does that) — click
the actual "Watch" affordance, let the auto-play mechanism drive itself through each step, observe
the spotlight/narration/progress indicator advancing on their own. Pick one representative unit 1
tour and one representative unit 2 tour (the more complex ones are better evidence — e.g. a
cross-surface tour for unit 1, the SoD-discovery tour `TOUR-WORKER-ADD-SOD-001` for unit 2).

- [ ] **Step 2: Exercise `Take over`**

Mid-tour, use the `Take over` control, confirm control genuinely hands back to the user at the exact
current state (not a reset), and that continuing manually from there works.

- [ ] **Step 3: Live-verify and screenshot**

Screenshot the spotlight highlighting the correct control at a few steps, the narration caption text,
the progress indicator, and the `Take over` handoff moment.

- [ ] **Step 4: Add ledger rows** — one per tour driven, noting explicitly that this is the RUNNER
itself being exercised (not a manual step replication), closing the gap both units' verification
records named identically ("the tour runner mechanism remains entirely undriven by any ledger row").

- [ ] **Step 5: Report.**

---

## Task 10: Closure — amend both verification records, reseal, update RESUME.md

**Files:**
- Modify: `docs/process/2026-08-29-unit-01-verification.md` (append, do not rewrite existing
  sections)
- Modify: `docs/process/2026-08-29-unit-02-verification.md` (append)
- Modify: `docs/process/RESUME.md`
- Reseal: `docs/process/ledgers/{product-candidate,evidence-envelope}-manifest.json`

**Interfaces:**
- Consumes: every prior task's report and ledger rows in this plan.
- Produces: the evidence both units are genuinely, fully closed.

- [ ] **Step 1: Fresh whole-chain verification** — `pnpm verify`, exit 0, save the log durably
(matching the existing `artifacts/evidence/unit-0{1,2}-close-verify/` pattern — this sweep's own log
goes in a new `artifacts/evidence/units-01-02-closure-sweep-verify/` directory).

- [ ] **Step 2: Amend unit 1's verification record**

Append a new final section (after its existing §10) stating: every item from this sweep's design doc
§2 that touched unit 1 (A, B, E, F, G partially, H partially, I, J, K partially) is now fixed and
live-verified, with real evidence references (ledger row ids, screenshot names). State §3's three
non-fixed items explicitly as this sweep's own deliberate rulings (five uncited identifiers; eight-
vs-nine screens; and unit 1's own equivalent structural non-fixes if any carry over) — named, not
silently dropped, with the one-sentence reasoning from the design doc.

- [ ] **Step 3: Amend unit 2's verification record**

Same shape: append after its existing final-review section. State items C, D, G (shared), H (shared),
K (shared) as fixed and live-verified. State §3's unit-2-specific non-fixes (`WF-WKR-004`'s
census non-credit; the UI-unobservable write-denial) explicitly, with reasoning.

- [ ] **Step 4: Update `docs/process/RESUME.md`**

Append a new top section (above the current "Unit 2 — CLOSED" section, following the exact pattern
that section itself used above unit 2's Task-9 record) stating both units are now genuinely,
completely closed — zero remaining open items in either, with the explicit list of what was fixed
in this sweep and the explicit list of what was ruled not-fixable-without-harm (both units' §3
items), before unit 3 begins. Re-hash the frozen source one final time in this section.

- [ ] **Step 5: Reseal** — `node scripts/seal-manifests.mjs`, confirm `--verify` reports
`drifted=0 missing=0` on both manifests.

- [ ] **Step 6: Report** — the final, complete accounting: every item from the design doc's §2 (A
through K) with its fix commit(s) and live-verification evidence, and every item from §3 with its
ruling restated. This report is the thing the controller reads to state, truthfully, that both units
are complete.

---

## Self-review

**Spec coverage.** Every item A-K from the design doc's §2 has a task: A/E/F → Task 1; B → Task 2;
C → Task 4; D → Task 3; G → Task 5; H → Task 6; I → Task 7; J → Task 8; K → Task 9. Every §3
non-fixed item is explicitly named in Task 10's closure text, not silently absent from the plan.

**Placeholders.** None left unresolved as guesses — every place a real signature/convention could not
be confirmed without running code (the `Repository` query surface `sessionFor` needs in Task 6, the
exact door name/shape in Task 7, the sequence-persistence design choice in Task 5) is written as an
explicit "confirm X by reading Y before writing Z" step, not an invented answer.

**Type consistency.** `readLatestSnapshot`, `OPEN_SUPPORT_SESSION_REQUEST`, `activeGrantsFor` are
each declared once, in the task that creates them, and no later task redeclares or renames them.

**Risk sequencing honored.** Task 5 (persistence, touches `boot.ts`/`repository.ts`'s persistence
region) and Task 7 (support-access door, touches `repository.ts`'s door region) are both full tasks
with their own commits between them — never dispatched in parallel, per the design doc's own §4 note
and this project's "never dispatch multiple implementation subagents in parallel" rule.

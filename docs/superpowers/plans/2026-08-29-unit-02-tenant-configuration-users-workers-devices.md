# Workflow unit 2 — tenant configuration, users, Workers, qualifications, and devices — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship master prompt §24.2's second workflow unit as real product user interface — Location
Configuration (Site → Area → Location), Shift Management, Permissions/Roles/Access (tenant users and
role grants), Worker Lifecycle and Qualifications, and Devices — each reading and writing through the
§12.6 repository, each with its guided tour and its Live-Verification Ledger rows, replacing 9,525
lines of pre-rebuild document-style screens.

**Architecture:** No structural change to the runtime unit 1 built. Every write in this unit is
either (a) the existing generic `repository.create`/`update`/`transition` — safe to use directly
where the collection's `TRUTH_STORES` authority already yields the correct role floor, the write
touches one row, and no rule beyond the zod schema applies — or (b) a new named door on `Repository`,
following the exact shape `provisionTenant`/`inviteConsoleUser`/`decideApprovalRequest` already
established, where the generic floor is wrong, the write is atomic across rows, or a business rule
(overlap, referential, segregation-of-duties) lives outside the schema. **Measured, not assumed:**
`sites`/`areas`/`locations`/`shifts`/`workers`/`qualifications`/`qualification-grants`/`devices` are
all `'hub'` authority (floor `TENANT_OPERATIONAL_WRITERS` — TENANT_ADMIN/SUPERVISOR/QUALITY_MANAGER),
so their single-row creates can go through the generic door. **`users` and `role-grants` are
`'platform'` authority** (floor `PLATFORM_WRITERS` — ROOT_SUPER_ADMIN/ADMIN/PLATFORM_ENGINEER) — the
same `users` collection unit 1 used for platform console accounts is the only `users` collection that
exists, so **a Tenant Admin cannot create a tenant user or grant a tenant role through the generic
door at all**; Task 3 builds `createTenantUser`/`assignTenantRole` as new named doors with their own
tenant-role-scoped `AccessRequest`, exactly the gap `inviteConsoleUser` closed for the platform side.

**A schema finding that reorders the task sequence:** `Worker` (`src/data/schemas/org.ts`) carries no
`siteId`/`areaId` field. Scope — Site, Area, Shift — lives on `RoleGrant.siteIds`/`areaIds`/`shiftIds`,
keyed by `userId`. WF-WKR-005 ("Assigning Tenant, Site and Area scope") is therefore realized through
the **same role-grant door Task 3 builds**, not a separate Worker-schema field — so Task 3
(Permissions/Roles/Access, which creates the `users` row a `Worker` row's `userId` must reference, and
the `RoleGrant` row scope is written to) must ship **before** Task 4 (Worker Lifecycle, which consumes
both). The design doc's task order (Locations, Shifts, Worker Lifecycle, Permissions, Devices) is
revised here to (Locations, Shifts, Permissions/Roles/Access, Worker Lifecycle, Devices) for this
reason — same five screens, same scope, dependency-correct order.

Similarly, `Device` (org.ts) carries `locationId`, not `areaId` — "reassigning a device to another
Area" (`WF-DVC-002`'s label) is in schema terms reassigning to another `Location`, which itself
belongs to an `Area`. Task 5's device reassignment validates and displays the Location's Area, not an
Area field on `Device` directly.

`Qualification` (the certification record Worker Lifecycle enters) and `QualificationGrant` (the
Supervisor/Quality-Manager-granted *clearance* for an expired or never-held qualification, `status`
`requested`→`granted`→`delivered`→`in-force`→`lapsed`, `grantedBy` a role this unit does not build)
are different collections. Task 4's `recordQualification` writes `qualifications`, never
`qualification-grants` — the design doc's WF-DOH-04-CLEARANCE deferral to a later Command Center unit
is schema-confirmed, not just source-asserted.

**Tech Stack:** Next.js 16.3.1 App Router (`output: "export"`), React 19.2.8, TypeScript strict, zod
4.4.3, pnpm 11.20.0. Verification is real Google Chrome through the Chrome MCP server
(`mcp__plugin_superpowers-chrome_chrome__use_browser`) against the served static export.

**Spec:** `docs/superpowers/specs/2026-08-29-unit-02-tenant-configuration-users-workers-design.md`

## Global Constraints

- **No test cases.** Master prompt §2.3 and APP-020. Do not create, extend or repair any
  `*.test.ts`/`*.test.tsx`, Playwright spec, or snapshot. `/superpowers:test-driven-development` is
  policy-excluded.
- **Verification is live.** Each task's green step is a recorded run in real Chrome through the
  Chrome MCP server plus the compile-level checks: `pnpm typecheck`, `pnpm lint`,
  `node scripts/validate-collections.mjs`, `pnpm build`.
- **No backend, ever.** No API route, Route Handler, Server Action, middleware, `fetch` to any
  external origin, secret, or environment variable. `output: "export"` must keep building, and every
  dynamic segment must be enumerated by `generateStaticParams`.
- **No component imports a seed file.** Business truth reaches a component only through
  `src/data/repository.ts`, obtained from `useRepository()`/`useRepositoryQuery()`. Enforced by lint.
- **`src/ui/product/**` must never import `src/ui/demo/**`.** Enforced by `pnpm check:boundary-rules`.
- **§8.6.2 product fidelity.** No file this plan creates or rebuilds may render a blueprint line
  locator, a bare requirement identifier, a narrative paragraph, or a bullet list as the primary
  content of a product screen. Source citations belong in **code comments**, the traceability
  registry, and tour narration — never in rendered text.
- **Frozen source** sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`.
  Re-hash at task entry. A difference is source drift: stop and report. That stop is not waived.
- **Cite the blueprint, never the graph.** `graphify query` returns a lead; open the line it names
  and read it before citing it. Write **"master prompt §X"** for master-prompt sections — a bare
  `§9.6` collides with the blueprint's own chapter numbering.
- **A citation you cannot cheaply locate is a task step, never a guess.** If a business rule (e.g.
  which tenant roles may assign which other roles) needs a source line you can't find fast, write the
  step as "locate via `graphify query \"...\"`, open the line, cite it — if the source is silent, mark
  this a client-delegated choice and disclose the alternative on screen," not as an invented number.
- **Simulated clock only.** No `Date.now()`, no argument-less `new Date()`, no `Math.random()` in
  `src/data`, `src/ui/product` or `src/tours`.
- **Accessibility floor:** WCAG 2.2 AA. Visible focus ring, accessible name, keyboard operation,
  route-change focus, error-summary association, live-region status announcement, non-colour state
  communication, 200% zoom and reflow, forced colors.
- **Every control carries `data-control-id`**, matching an id in
  `registries/generated/actionable-controls.json` or added to it by the same task.
- **Unresolved source decisions are disclosed, not resolved.** Where the frozen source disagrees with
  itself, the screen shows this build's pick, labels it a client-delegated choice, and offers the
  alternative.
- **Implementers never run git.** The controller commits.
- **A named door mirrors the existing four's shape exactly**: its own `AccessRequest` constant with
  `action`/`allowedRoles`/`sourceRefs`, called through `evaluateAccess` once, up front, before any row
  is touched; its own result type (`WriteResult<T>` when one row and one failure shape is enough, a
  `partial`-armed union per `ProvisionTenantResult`'s pattern when two rows can diverge); a full doc
  comment stating which generic floor it replaces and why. Do not invent a different convention.
- **Referential integrity beyond the zod schema (a `siteId`/`areaId`/`locationId` must reference a
  real, same-tenant row) is not checked by `create`/`update`/`transition` or by `resolveTenantId`
  today** — write ONE shared helper (Task 1 ships it; every later task reuses it, never
  reimplements it) rather than five copies of the same lookup.

---

## File structure

| path | responsibility |
|---|---|
| `src/data/repository.ts` | new named doors: `createTenantUser`, `assignTenantRole`, plus whichever of Sites/Areas/Locations/Shifts/Qualifications/Devices measurably need one (decided per task, not assumed) |
| `src/data/scope-reference.ts` | new — the shared referential-integrity helper (Task 1) |
| `app/hub/location-configuration/` | rebuilt Site → Area → Location screen |
| `app/hub/shift-management/` | rebuilt Shift screen |
| `app/hub/permissions-roles-and-access/` | rebuilt tenant users + role grants screen |
| `app/hub/worker-lifecycle-and-qualifications/` | rebuilt Worker + Qualification screen |
| `app/hub/devices/` | rebuilt tenant device fleet screen |
| `src/data/collections/sites.json`, `areas.json`, `locations.json`, `shifts.json`, `users.json`, `role-grants.json`, `workers.json`, `qualifications.json`, `devices.json` | seed volume for this unit |
| `src/data/collections/tours.json` | the unit's tours |
| `registries/generated/modules.json` | MOD-DOH-02/03/04/09 status, and the devices module-id question (Task 8) |
| `docs/process/ledgers/live-verification-ledger.json` | the release evidence |

---

## Task 1: The shared scope-reference helper and Location Configuration

**Files:**
- Create: `src/data/scope-reference.ts`
- Rewrite: `app/hub/location-configuration/LocationConfigurationScreen.tsx`
- Modify: `src/data/repository.ts` — `archiveLocationTierEntity` (see Step 3)
- Modify: `src/data/collections/sites.json`, `areas.json`, `locations.json` — seed volume (Step 5)

**Interfaces:**
- Consumes: Task 1 (unit 1)'s runtime; `AppShell`, `PageHeader`, `DataTable`, `TableToolbar`,
  `Pagination`, `ObjectPage`, `DetailDrawer`, `ConfirmDialog`, `Form`, `TextField`, `SelectField`,
  `StatusPill`, `Toaster` from `@/ui/product`; `useRepository()`, `useAccessContext()`,
  `useRepositoryQuery()` from `@/ui/product/runtime`.
- Produces, and every later task in this unit depends on this exact name:

```ts
// src/data/scope-reference.ts
/**
 * Resolves and checks that a referenced Site/Area/Location row is real,
 * active (not archived), and in the SAME tenant as the row making the
 * reference — the class of check `resolveTenantId` does not perform
 * (that function answers "which tenant does THIS row belong to", never
 * "does the row THIS row points at actually exist and belong to the same
 * tenant"). Every later task in this unit calls this rather than
 * re-deriving the same three lookups.
 */
export type ScopeReferenceProblem =
  | { kind: 'not-found'; collection: 'sites' | 'areas' | 'locations'; id: string }
  | { kind: 'archived'; collection: 'sites' | 'areas' | 'locations'; id: string }
  | { kind: 'tenant-mismatch'; collection: 'sites' | 'areas' | 'locations'; id: string; expectedTenantId: string }
  | { kind: 'wrong-parent'; collection: 'areas' | 'locations'; id: string; expectedParentId: string }

export function checkSiteReference(store: Store, tenantId: string, siteId: string): ScopeReferenceProblem | null
export function checkAreaReference(store: Store, tenantId: string, areaId: string, expectedSiteId?: string): ScopeReferenceProblem | null
export function checkLocationReference(store: Store, tenantId: string, locationId: string, expectedAreaId?: string): ScopeReferenceProblem | null
```

Read `src/data/store.ts` for `Store`'s real read shape (`store.rows('sites')` or similar — quote its
actual method name, do not invent one) before writing this file.

- [ ] **Step 1: Re-hash the frozen source**

Run: `shasum -a 256 /Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md`
Expected: `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`. A mismatch is source drift —
stop and report.

- [ ] **Step 2: Reproduce live, before changing anything**

```
pnpm build && pnpm serve:out          # :4173
```

Open `http://localhost:4173/hub/location-configuration` in Chrome via the MCP server. Confirm and
screenshot the defect this task fixes: the rendered string `Screen annotation only, never a route key
(D1): SCR-DOH-04 Location hierarchy` at line 676 of the current file, and zero
`useRepository`/`useProductSession` calls (`grep -c "useRepository\|useProductSession"` on the current
file → `0`).

- [ ] **Step 3: Write `scope-reference.ts`, then decide the write shape for this module**

Build the three check functions above. Then, reading `authorizeWrite`'s existing behaviour for `'hub'`
authority (floor `TENANT_OPERATIONAL_WRITERS`, matches Tenant Admin/Supervisor/Quality Manager for
Site/Area/Location config per the module's stated ownership), decide per action:

- **Create Site**: `repository.create('sites', row, ctx)` — generic door. Floor matches, single row,
  no cross-collection reference to check (a Site is the root of the hierarchy).
- **Create Area**: needs `checkSiteReference` (the Area's `siteId` must be a real, active, same-tenant
  Site) before the write — a rule the generic `create()` does not run. Add
  `createAreaUnderSite(area: RowOf<'areas'>, ctx): Promise<WriteResult<RowOf<'areas'>>>` as a new named
  door that runs `checkSiteReference` then delegates to the same internal `createRow` the generic door
  uses (read how `inviteConsoleUser` delegates to `createRow` internally and follow that shape exactly
  — do not duplicate `authorizeWrite`'s logic).
- **Create Location**: same reasoning, `createLocationUnderArea`, checking `checkAreaReference`.
- **Archive at any tier**: `WF-DOH-02-CASCADE` (the spec's cited alternate path) means archiving a
  Site or Area must not silently orphan active Areas/Locations beneath it. Build
  `archiveLocationTierEntity(collection: 'sites' | 'areas' | 'locations', id: string, ctx):
  Promise<WriteResult<...> | { ok: false; kind: 'has-active-children'; children: readonly {collection: string; id: string; name: string}[] }>`
  — refuse the archive and name every active child, rather than cascading automatically (an automatic
  cascade is not a rule this build has source authority to invent; the refusal-with-names is the safe,
  honest behaviour, and is itself the `WF-DOH-02-CASCADE` alternate path this module demonstrates).

- [ ] **Step 4: Build the screen**

Three-tier tree: Site list (`DataTable`) → selecting a Site opens its Areas in a nested `DataTable` or
`ObjectPage` tab → selecting an Area opens its Locations the same way. Each tier: create action
(`Form` in a `DetailDrawer` or `Wizard` step, whichever this codebase's existing pattern favours — read
one more built screen if `TenantsScreen`'s create flow doesn't settle it), archive action
(`ConfirmDialog` naming the exact object; disabled with the `has-active-children` reason and the named
children when archive is refused), and the timezone field shown **only on Site** and rendered
read-only, inherited, on Area and Location rows (`Site.timezone` is the single source; Area/Location
carry no timezone field in the schema — confirm this against `org.ts` in Step 3 and do not invent one).

Fixture adequacy (§8.6.1) on whichever tier is the primary `DataTable`: search, a no-match empty state
distinct from no-rows-at-all, and — per spec risk 2 — real pagination. Check Step 5's seeded count
against `DataTable`'s page size before claiming this is satisfied.

- [ ] **Step 5: Seed volume, for the Bright Bikes tenant specifically, not the total**

`sites.json`/`areas.json`/`locations.json` hold 14/18/43 rows **across all 14 tenants**. Query how many
belong to the Bright Bikes tenant id (`grep` or a one-off `node -e` count) — if fewer than 20 Sites (or
whichever tier the primary table shows), raise it deterministically through the existing generator,
Bright Bikes cast emitted verbatim, every status (`active`, `archived`) represented, at least one
archived Site/Area with **no** active children (a clean archive) and at least one with active children
(to drive Step 3's refusal). Prove determinism: generate twice, compare sha256.

- [ ] **Step 6: Compile-level checks**

Run: `pnpm typecheck && pnpm lint && node scripts/validate-collections.mjs && pnpm build`, exit 0.

- [ ] **Step 7: Live-verify**

Drive as Tenant Admin: create Site/Area/Location happy path each with the confirm dialog naming real
objects; the `has-active-children` archive refusal with children named; a clean archive; search/
empty-state/pagination on the primary table; the timezone field showing on Site only and inherited
read-only below it; Supervisor and Quality Manager's identical create authority (floor is
`TENANT_OPERATIONAL_WRITERS`, all three); a cross-tenant id attempted via direct URL/state manipulation
refused by `checkSiteReference`'s tenant-mismatch arm. Screenshot each; keyboard-only; dark mode; 360px.

- [ ] **Step 8: Report** — the generator's two sha256 runs, Bright Bikes's per-tier row counts before
and after, and the ledger rows.

---

## Task 2: Shift Management

**Files:**
- Rewrite: `app/hub/shift-management/ShiftManagementScreen.tsx`
- Modify: `src/data/repository.ts` — `createShift`, `updateShift`
- Modify: `src/data/collections/shifts.json` — seed volume

**Interfaces:**
- Consumes: Task 1's `checkSiteReference`; `DataTable`, `Form`, `TextField` (or a time-of-day field —
  check `@/ui/product/fields` for one before building a new one), `ErrorSummary`.
- Produces: nothing later tasks import.

- [ ] **Step 1: Reproduce live** — `Screen annotation only, never a route key (D1): SCR-DOH-05, Shift
management` at line 707 of the current file. Screenshot.

- [ ] **Step 2: Write `createShift`/`updateShift`**

The rule the generic door cannot express: two Shifts at the same `siteId` with overlapping
`[startTime, endTime)` windows must be refused, naming the specific conflicting Shift (id and name),
not a generic "overlap" message. `startTime`/`endTime` are local time-of-day strings (`"06:00"`) per
the schema comment — compare them as such; do not construct a `Date` (Global Constraints: simulated
clock only, and a bare time-of-day has no date to attach one to). Both doors also run
`checkSiteReference` on `siteId`.

```ts
export type CreateShiftResult =
  | WriteResult<RowOf<'shifts'>>
  | { ok: false; kind: 'overlap'; conflictingShift: RowOf<'shifts'> }
  | { ok: false; kind: 'invalid-reference'; problem: ScopeReferenceProblem }
```

- [ ] **Step 3: Build the screen**

`DataTable` of Shifts (site, name, start/end, digest delivery time, area count, status) + create/edit
`Form` routing the three failure arms above to distinct, plain-language messages (the overlap message
names the conflicting shift and links to it). Archive follows Task 1's `archiveLocationTierEntity`
pattern if Shifts can have dependents (check `areaIds` — likely just a display link, not a cascade
concern, since Areas reference Shifts via `Area.shiftIds`, not the reverse ownership `sites`/`areas`
have); if no cascade concern exists, a plain `transition('shifts', id, 'archived', ctx)` through the
generic door is correct — do not build an unneeded door.

- [ ] **Step 4: Compile-level checks** — exit 0.

- [ ] **Step 5: Live-verify**

Create a Shift; create a second overlapping the first at the same Site, see the named refusal; a
non-overlapping Shift at a different Site with the same times succeeds; edit a Shift's time to
overlap an existing one, see the same refusal on update; archive; the `checkSiteReference`
invalid-reference arm via a tampered site id. Screenshot each; ledger rows.

- [ ] **Step 6: Report.**

---

## Task 3: Permissions, Roles and Access — tenant users and role grants

**Files:**
- Rewrite: `app/hub/permissions-roles-and-access/PermissionsScreen.tsx`
- Modify: `src/data/repository.ts` — `createTenantUser`, `assignTenantRole` (new named doors)
- Modify: `src/data/collections/users.json`, `role-grants.json` — seed volume

**Interfaces:**
- Consumes: Task 1's `checkSiteReference`/`checkAreaReference`; `DataTable`, `Form`, `SelectField`,
  `ConfirmDialog`, `Toaster`.
- Produces, and Task 4 depends on this exact name and shape:

```ts
export type AssignTenantRoleResult =
  | WriteResult<RowOf<'role-grants'>>
  | { ok: false; kind: 'segregation-of-duties'; grantorRole: RoleId; requestedRole: RoleId }
```

- [ ] **Step 1: Read the current screen's facts** — 1,636 lines, 35 locators, including a rendered
`SCR-DOH-01` two-track sign-in section and an `SCR-DOH-ROLE-01` landing section that belong to a
DIFFERENT screen than this one claims to be (lines 913-1008 of the current file) — list every fact,
note this misattribution explicitly in the report so Task 9's relocation does not silently inherit it.

- [ ] **Step 2: Locate the tenant role-assignment rule, or delegate it explicitly**

The frozen source's tenant role hierarchy (which of Tenant Admin/Supervisor/Quality Manager/Worker may
grant which other role) is not yet extracted into this codebase (no `ROLE_RANK`/similar constant
exists — confirmed by its absence from `roles.json` and `repository.ts`). Before writing
`assignTenantRole`: run `graphify query "which tenant role may assign which other tenant role"` and
`graphify query "segregation of duties tenant role grants"`, open every line the results name, and
record the real rule. **If the source states it, cite the exact line.** If the source is silent or
only implies it (the master prompt's own §7.5 candidate matrix — re-verify it against this unit's
frozen source rather than trusting the master-prompt summary quoted in the design doc), the safe,
disclosed default is: **Tenant Admin may grant any of the four tenant roles; Supervisor and Quality
Manager may grant only Worker** (never Supervisor, Quality Manager or Tenant Admin) — label this a
client-delegated choice on screen with the alternative (no tenant role may grant any role, all grants
require Tenant Admin) named and selectable evidence, per the Global Constraints citation rule.

- [ ] **Step 3: Write `createTenantUser`/`assignTenantRole`**

Both follow `inviteConsoleUser`'s exact shape: one `AccessRequest` each (`allowedRoles` is the tenant
roles Step 2 settled, **not** `PLATFORM_WRITERS` — this is the fix for the `'platform'`-authority gap
found in this plan's Architecture section), called once up front through `evaluateAccess`, then
delegating to the same internal `createRow`/write-commit path the generic door uses.
`createTenantUser` sets `User.tenantId` to the acting session's own tenant (never caller-supplied —
same class of guard `resolveTenantId`'s fix protects) and `User.role` from a closed tenant-role set
(never `ROOT_SUPER_ADMIN`/`ADMIN`/`PLATFORM_ENGINEER`/`SUPPORT` — a tenant door can never mint a
platform account). `assignTenantRole` returns the `segregation-of-duties` arm from Step 2's rule
before attempting any write.

- [ ] **Step 4: Build the screen**

Tenant user `DataTable` (name, email, role, granted-by, status) + `Invite user` `Form`
(`createTenantUser`) + a role-assignment action per row (`assignTenantRole`) with a `SelectField`
restricted, in its own options list, to roles the ACTING role may grant (per Step 2) — this is a
UI convenience, not the enforcement; the enforcement is Step 3's door, and the live-verify step must
prove the door refuses even when the UI is bypassed (drive the denial by calling through a role whose
`SelectField` still happens to show a wider list via a stale render, or via the demo chrome's direct
persona switch mid-flow, per spec risk 3).

- [ ] **Step 5: Compile-level checks** — exit 0.

- [ ] **Step 6: Live-verify — the denial gets its own row, not only the happy path**

Drive as Tenant Admin: invite a user; grant each of the four tenant roles; the invited user appearing
with correct scope. Drive as Supervisor: grant Worker (succeeds); attempt to grant Quality Manager —
**screenshot the segregation-of-duties refusal specifically**, with the exact reason rendered ("a
Supervisor may not grant Quality Manager" or whatever Step 2's cited/delegated rule states verbatim).
Drive the cross-tenant refusal (a role-grant targeting a user id from a different tenant). Ledger rows
for every one, the denial rows explicitly flagged in the report as the risk-3 evidence.

- [ ] **Step 7: Report** — Step 2's citation or delegated-choice statement, verbatim, plus the
misattributed-section finding from Step 1.

---

## Task 4: Worker Lifecycle and Qualifications

**Files:**
- Rewrite: `app/hub/worker-lifecycle-and-qualifications/WorkerLifecycleScreen.tsx`
- Modify: `src/data/repository.ts` — `createWorker`, `recordQualification`
- Modify: `src/data/collections/workers.json`, `qualifications.json` — seed volume

**Interfaces:**
- Consumes: Task 3's `createTenantUser` (a Worker's `userId` must reference a real User this task
  creates through that door, never a bare `repository.create('users', ...)` call) and
  `assignTenantRole` (Site/Area/Shift scope, per this plan's Architecture finding); Task 1's
  `checkAreaReference`; `DataTable`, `ObjectPage`, `Form`, `StatusPill`.
- Produces: nothing later tasks import.

- [ ] **Step 1: Read the current screen's facts** — 2,318 lines, 24 locators covering `SCR-DOH-07`
(worker list) and `SCR-DOH-08` (worker record and qualifications). List them.

- [ ] **Step 2: Write `createWorker`/`recordQualification`**

`createWorker(userId, workerFields, ctx)` — first confirms (via `repository.get('users', userId, ctx)`)
the referenced User exists, has role `'WORKER'`, and belongs to the acting session's tenant, then
creates the `Worker` row through the generic path (`'hub'` authority already admits
Tenant Admin/Supervisor/Quality Manager, which matches who may enter a worker record). If no matching
User exists yet, the screen's own "Add worker" flow calls Task 3's `createTenantUser` first
(role `'WORKER'`), then this door — one guided flow, two doors in sequence, exactly as Task 5 (unit 1)'s
Create Tenant → Task 8's acceptance was two screens across one handoff, not one door pretending to be
atomic across two collections it does not own together.

`recordQualification(qualification: RowOf<'qualifications'>, ctx)` — validates `workerId` references a
real, same-tenant Worker (reuse the tenant-check pattern, there is no `checkWorkerReference` yet;
either extend Task 1's helper module with one or inline the two-line check here and note in the report
which you chose and why), then creates through the generic `'hub'` floor.

- [ ] **Step 3: Build the screen**

Worker `DataTable` (name, email, role, Site/Area scope from their `RoleGrant`, qualification count,
status: `active`/`archived`/`reactivated`) → worker `ObjectPage`: identity, scope (rendered from Task
3's role-grant, with an edit action that IS Task 3's `assignTenantRole` door, called from here — do not
duplicate its logic), qualifications tab (a `DataTable` of `Qualification` rows: certification type,
Areas, certification/entry/expiry dates, status) with an `Enter qualification` `Form`, and an
invited-but-not-yet-activated state badge for a Worker whose linked User has no device activation yet
(per the spec's `WF-WKR-003` deferral — render the state, build no activation flow).

- [ ] **Step 4: Compile-level checks** — exit 0.

- [ ] **Step 5: Seed volume** — same per-Bright-Bikes-tenant check as Task 1. `workers.json` holds 42
total across 14 tenants; `qualifications.json` holds 32. Pad deterministically if Bright Bikes's own
slice won't fill the primary table's page, with sha256-proven determinism.

- [ ] **Step 6: Live-verify**

Create a worker via the two-door flow (new user + worker record) and via an existing unassigned user;
enter a qualification, see it on the worker's record; the expiry-date states (`valid`/`expiring`/
`expired` — render whichever the seed data reaches, do not fabricate a fourth); the invited/
not-yet-activated badge; scope shown and editable through Task 3's door; the cross-tenant worker
reference refused. Screenshot each; ledger rows.

- [ ] **Step 7: Report.**

---

## Task 5: Devices

**Files:**
- Rewrite: `app/hub/devices/DevicesScreen.tsx`
- Modify: `src/data/repository.ts` — `enrollDevice`, `reassignDevice`
- Modify: `src/data/collections/devices.json` — seed volume

**Interfaces:**
- Consumes: Task 1's `checkLocationReference`; `DataTable`, `Form`, `StatusPill`, `ConfirmDialog`.
- Produces: nothing later tasks import.

- [ ] **Step 1: Reproduce live** — `DevicesScreen.tsx:79` claims "uncatalogued, and claiming no
module." Confirm this is still true against the current `registries/generated/modules.json` (Task 8
decides what to do about it) and screenshot the current document-style body.

- [ ] **Step 2: Write `enrollDevice`/`reassignDevice`**

`Device.locationId` is nullable — an enrolled-but-unplaced device is real (schema allows it). Both
doors run `checkLocationReference` when a non-null `locationId` is supplied, refuse a tenant-mismatched
or archived Location by name, and go through the `'hub'` floor otherwise. `suspendDevice` needs no new
door — `Device.status` includes `'de-authorised'`, reachable via the existing generic
`transition('devices', id, 'de-authorised', ctx)`; **do not build a needless fourth door for a state
change the generic transition already covers correctly** (ponytail: the ladder's rung 2 — reuse what
already exists — applies here as much as anywhere in this plan).

- [ ] **Step 3: Build the screen**

Tenant device fleet `DataTable`: mode (`shared`/`personal`), current Location (or "unplaced"),
enrolled-by/-at, app/policy version, sync health, storage pressure, status. `Enroll device` `Form`
(`enrollDevice`); a `Reassign` action per row (`reassignDevice`) with a Location picker filtered to the
acting tenant's active Locations; a `Suspend` action (the generic `transition`) with the plain-language
consequence stated in the confirm dialog (no offline/wipe claim — that's `WF-DVC-003`/`004`/`006`,
explicitly out of this unit's scope per the spec).

- [ ] **Step 4: Compile-level checks** — exit 0.

- [ ] **Step 5: Seed volume** — `devices.json` holds 25 total across 14 tenants; check Bright Bikes's
slice, pad deterministically if thin.

- [ ] **Step 6: Live-verify**

Enroll a device (placed and unplaced); reassign to a real Location; the tenant-mismatch and
archived-Location refusals; suspend, see `de-authorised` render distinctly from every other status
(never collapsed to a generic "inactive" — Global Constraints' exact-state-vocabulary rule, same one
unit 1's retrospective names for captures/commands/notifications applies here to devices). Screenshot
each; ledger rows.

- [ ] **Step 7: Report** — including whether `DevicesScreen.tsx:79`'s "no module" claim still holds
against the current registry, for Task 8 to act on.

---

## Task 6: Cross-module integration and Hub shell wiring

**Files:**
- Modify: Hub shell navigation (find the current nav source — likely
  `src/surfaces/doh/nav.ts` or similar; confirm the real path before editing) if any of the five
  routes above is not already reachable from it
- Modify: worker `ObjectPage` (Task 4) and device `DataTable` (Task 5) — cross-links if a device's
  Location resolves to a Worker's Area (informational link only, not a new write)
- Modify: whichever of the five collections still reads thin for the Bright Bikes tenant after Tasks
  1-5's own padding (a final check across all five together, not per-screen in isolation)

**Interfaces:**
- Consumes: all of Tasks 1-5's screens and doors.
- Produces: nothing later tasks import — this is the seam-closing task, not a new capability.

- [ ] **Step 1: Confirm shell reachability**

For each of the five routes, confirm it is reachable from Hub navigation with zero direct-URL-only
routes (Global Constraint parity with unit 1's finding 1 — "a client could reach 18 of 102 pages, and
not one of the five surfaces"). If any is nav-orphaned, add its entry.

- [ ] **Step 2: Cross-link where the data actually connects**

Worker detail → the Devices screen filtered to devices at Locations within the Worker's scoped Areas
(a link with a query parameter, not a new repository method). Location detail (Task 1) → Shift
Management filtered to that Site (same shape). Do not invent a link the data does not support.

- [ ] **Step 3: Final seed-volume pass**

Re-run each task's per-Bright-Bikes-tenant count now that all five collections have Task 1-5's
padding. If any is still thin against its screen's page size, pad it here, sha256-proving determinism
same as before, rather than send this back to an already-closed task.

- [ ] **Step 4: Compile-level checks** — exit 0.

- [ ] **Step 5: Live-verify**

Navigate to each of the five screens from the Hub shell nav only (no direct URL); follow both
cross-links and confirm the filtered destination is correct; re-drive one happy-path action per screen
(the regression rule — this task touches shared nav, so it re-drives across all five). Screenshot each.

- [ ] **Step 6: Report.**

---

## Task 7: The unit's guided tours

**Files:**
- Modify: `src/data/collections/tours.json`

**Interfaces:**
- Consumes: the tour engine from `@/tours`; the `data-control-id` attributes Tasks 1-5 shipped.
- Produces: the tours the Workflow Index rows and "Watch how this works" affordances launch.

- [ ] **Step 1: Author the nominal tours**

One per closed workflow id in the spec's scope list (`WF-ORG-001/002/003`,
`WF-DOH-CONFIGURE-HIERARCHY`, `WF-DOH-03-SHIFT`, `WF-WKR-001/002/004/005/006`,
`WF-DOH-ENTER-QUALIFICATION`, `WF-DOH-04-QUAL`, `WF-DOH-09-PERM`, `WF-DOH-CREATE-USER`,
`WF-DOH-ASSIGN-ROLE`, `SEQ-007`, `WF-DVC-001/002`, the User/Device/Site legs of `SEQ-031`), each
driving the real controls through the real handlers. Narration is one or two plain-language sentences
per step, carrying the source classification and blueprint locator for that step — this is where every
fact Tasks 1-5's "read the current screen's facts" steps recorded now lives.

- [ ] **Step 2: Author the variant tours**

Per master prompt §9.5, this unit's authorization paths get exhaustive applicable coverage: the
segregation-of-duties refusal (Task 3), the shift-overlap refusal (Task 2), the `has-active-children`
archive refusal (Task 1), the cross-tenant reference refusals (Tasks 1, 4, 5). Each its own launchable
tour.

- [ ] **Step 3: Compile-level checks** — `node scripts/validate-collections.mjs` (every `controlId`
resolves), then `pnpm build`.

- [ ] **Step 4: Live-verify every tour to completion**

Drive each tour end to end in Chrome, assert each step's route/target/post-state, screenshot each step,
drive `Take over` at least once. Ledger rows per tour. A step that cannot find its target is a
release-blocking defect, never a silent skip.

- [ ] **Step 5: Report** — per-tour step counts, `Take over` evidence.

---

## Task 8: Locator relocation and registry reconciliation

**Files:**
- Modify: `registries/*` inputs so every fact removed from a screen is present in the registry
- Modify: `registries/generated/modules.json` — MOD-DOH-02/03/04/09 statuses and the devices
  module-id question
- Modify: `docs/process/audits/` — the relocation record

**Interfaces:**
- Consumes: the fact lists Tasks 1-5 recorded in their reports (including Task 3's misattributed
  section finding and Task 5's module-id question).
- Produces: the registry statuses the coverage indexes render and the ledger reconciles against.

- [ ] **Step 1: Prove nothing was lost**

For every blueprint locator removed from the five rebuilt screens, assert it lives in the traceability
registry or a tour step's narration metadata. Two-column table: locator, where it now lives. Task 3's
misattributed `SCR-DOH-01`/`SCR-DOH-ROLE-01` facts get their own explicit row noting they belong to a
DIFFERENT screen's registry entry, not this unit's five.

- [ ] **Step 2: Resolve the devices module-id question**

`DevicesScreen.tsx` has claimed no module id since before this unit (Task 5's report confirms whether
this still holds). Do not invent one. Either: (a) confirm the frozen source genuinely has no module id
for tenant device management and record the screen's status against whichever registry field
represents "real screen, no module id" honestly, or (b) if source re-reading during this unit's tasks
surfaced one, cite it and assign it. Do not silently leave this unresolved AND unmentioned — one of (a)
or (b) is a required outcome, not the absence of either.

- [ ] **Step 3: Update census statuses**

Every workflow, function, control and use case this unit demonstrated moves from `not-represented` to
`demonstrated-in-storyboard` via `scripts/build-registries.mjs`'s derivation from evidence, never
hand-typed.

- [ ] **Step 4: Verify the §8.6.2 scan on this unit's files**

Run the locator scan across every file this unit shipped or rebuilt. Expected: zero blueprint line
locators, zero bare requirement identifiers, zero narrative paragraphs in rendered content.

- [ ] **Step 5: Compile-level checks** — `pnpm build && pnpm ledger:reconcile`, exit 0, uncovered count
falls by exactly the number of rows this unit closed.

- [ ] **Step 6: Report** — the relocation table, the devices module-id resolution, the before/after
census tally.

---

## Task 9: Unit closure — live verification, ledger, and fresh whole-chain verify

**Files:**
- Modify: `docs/process/ledgers/live-verification-ledger.json`
- Create: `docs/process/2026-08-29-unit-02-verification.md`
- Modify: `docs/process/RESUME.md` §8 — the position at unit 2's close

**Interfaces:**
- Consumes: every prior task's ledger rows.
- Produces: the evidence the unit is shipped and unit 3 may start.

- [ ] **Step 1: Re-drive the regression set**

Every ledger row sharing a changed screen, repository method (`checkSiteReference` and friends are
shared by all five screens) or the Hub shell nav Task 6 touched is re-driven on the final bytes.

- [ ] **Step 2: Fresh whole-chain verification**

Run: `pnpm verify`. Expected: exit 0. Read the full output and record the exit code, not a recollection
of it. Save the log durably at `artifacts/evidence/unit-02-close-verify/pnpm-verify-close.txt` with its
exit code appended, matching the entry-verify evidence path this unit started from. Then `pnpm serve:out`
and re-open this unit's five screens one final time on the exported bytes.

- [ ] **Step 3: Seal**

Run: `node scripts/seal-manifests.mjs`.

- [ ] **Step 4: Write the verification record**

`docs/process/2026-08-29-unit-02-verification.md`, mirroring
`docs/process/2026-08-29-unit-01-verification.md`'s structure: exact commands, exit codes, ledger row
totals, census delta, screenshot manifest paths, every open item (including Step 2's devices module-id
outcome and Task 3's segregation-of-duties rule — cited or delegated), and the honest statement of
what is simulated versus real. No completion language beyond what the evidence carries.

- [ ] **Step 5: Update `RESUME.md` §8** with the measured position at unit 2's close, in the same
form the unit-1 closure entry used (frozen source re-hash result, fresh `pnpm verify` result and
commit, census before/after, Live-Verification Ledger row count and pass/fail/blocked split, findings
carried forward named rather than fixed, and what the next session should do with it) — appended above
the unit-1 material, never overwriting it.

---

## Self-review

**Spec coverage.** The design doc's five screens map to Tasks 1, 2, 3, 4, 5 (reordered for the
Task-3-before-Task-4 dependency this plan's Architecture section found and justified). §4's
architecture note (named door vs. generic write, per-collection) is threaded through every task's
Step 2/3 rather than centralized, because the decision is genuinely per-write. §5's fidelity rules are
the global constraints plus Task 8's scan. §6's verification is every task's live step plus Task 9.
§7's four risks: risk 1 (five write surfaces) is Tasks 1-5 each shipping and live-verifying its own
writes rather than deferring to a closing task; risk 2 (thin seed volume) is each task's own Step
5-ish seed check plus Task 6 Step 3's final pass; risk 3 (segregation-of-duties) is Task 3 Steps 2, 3
and 6 specifically; risk 4 (Location tier has no separate registry id) is Task 1 Step 4's explicit
"confirm against org.ts, do not invent one" instruction plus Task 8 Step 1's relocation table. The
spec's full workflow-id list is closed by Tasks 1-5 with tours in Task 7 and statuses in Task 8.

**Placeholders.** None. Every step names its command, its real schema/interface names (verified
against `src/data/schemas/org.ts`, `platform.ts`, `src/data/repository.ts`, `src/data/truth-stores.ts`
and `src/ui/product/index.ts` while writing this plan, not assumed), or the exact decision procedure
where a source citation cannot be located cheaply (Task 3 Step 2). Two decisions are deliberately left
to the implementer with the ruling already made in the step: Task 2 Step 3 (do not build a needless
archive door if the generic transition covers it) and Task 5 Step 2 (reuse the generic `transition`
for device suspension rather than adding a fourth door).

**Type consistency.** `checkSiteReference`/`checkAreaReference`/`checkLocationReference`/
`ScopeReferenceProblem` are declared once in Task 1 and referenced by those exact names in Tasks 2, 4
and 5. `createTenantUser`/`assignTenantRole`/`AssignTenantRoleResult` are declared once in Task 3 and
consumed by those exact names in Task 4. `WriteResult<T>`, `RowOf<N>`, `AccessContext` are reused from
`src/data/repository.ts` and never redeclared, matching unit 1's own established convention.

**A correction to the design doc surfaced while planning, not hidden:** the design doc's Architecture
section (§4) states new write methods go through `evaluateAccess` "no shortcuts through a generic
`update(collection, id, patch)`" as if that were a blanket rule for all fifteen named methods it
listed. Measured against `src/data/truth-stores.ts` and `src/data/repository.ts` while writing this
plan: the generic door is fine, and is the ponytail-correct choice, for every `'hub'`-authority
single-row write with no cross-collection reference (Site creation, Shift archive, device suspension).
The blanket claim was wrong in the direction of over-building; this plan corrects it per-task rather
than proposing a design-doc amendment, since the correction narrows scope rather than changing it and
every task's own step already states its specific reasoning. The one place the design doc
under-stated the gap: it did not know `users`/`role-grants` are `'platform'`-authority, which makes
Task 3's new doors **structurally required**, not merely an authorization-narrowing nicety like the
others — that finding is the plan's single most consequential correction and is called out at the top
of the Architecture section above rather than buried in Task 3 alone.

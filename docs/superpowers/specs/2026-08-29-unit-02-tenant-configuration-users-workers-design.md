# Workflow unit 2 — tenant configuration, users, Workers, qualifications, and devices

**Status:** approved — real-user go-ahead this session ("go with it... production level"), under the
same standing autonomous-decision authority (APP-012/018) unit 1 ran under. Parent design:
`docs/superpowers/specs/2026-08-26-product-fidelity-rebuild-design.md` §9.
**Frozen source:** `AVIIXA_Production_Product_Blueprint.md`
sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`,
18,565,031 bytes / 122,241 lines. Re-hashed at session entry, unchanged.

---

## 1. Why this unit is next

Master prompt §24.2's arc: platform bootstrap and tenant provisioning (unit 1, closed) →
**tenant configuration, users, Workers, qualifications, and devices** → Studio authoring →
Hub Job/Run and official truth → Frontline execution → offline/reconnect → Command Center →
notifications/schedules/audit → artificial intelligence → platform controls/suspension/incidents →
branch closure. A tenant exists after unit 1; nothing about how it actually runs exists until this
unit — no sites, no shifts, no workers, no one to assign a Job to.

## 2. Entry position, measured

- Frozen source unchanged. HEAD `ce93da0`. Fresh `pnpm verify` exit 0, log at
  `artifacts/evidence/unit-02-entry-verify/pnpm-verify-entry.txt`.
- Census unchanged since unit 1's close: 277/5,015 demonstrated (277 demonstrated-in-storyboard, 10
  mounted-elsewhere, 22 not-applicable, 4,706 not-represented). Live-Verification Ledger: 30 rows
  (28 pass, 1 fail, 1 blocked), all from unit 1.
- `src/data/collections/` already holds validated, seeded JSON for every entity this unit touches:
  `sites.json` (14), `areas.json` (18), `locations.json` (43), `shifts.json` (15), `workers.json`
  (42), `qualifications.json` (32), `qualification-grants.json` (6), `devices.json` (25),
  `roles.json` (9), `role-grants.json` (80), `users.json` (96). **The data layer is not the gap.**
- `src/data/repository.ts` (2,236 lines) exposes generic read primitives usable against any
  collection (`list`, `page`, `get`, `where`, `sort`, `all`, `count`, `first`, `total`) plus four
  named privileged writes built in unit 1: `provisionTenant`, `acceptInvitation`,
  `inviteConsoleUser`, `decideApprovalRequest`. **It has zero named write methods for sites, areas,
  locations, shifts, workers, qualifications, tenant users/role-grants, or devices.** Unit 1 found
  every write path it touched latently broken (cache-key miss, stale access-context, tenant-id
  self-resolution, dangling-vs-absent reference confusion) the first time something actually wrote
  through it. Budget the same here — these are five write surfaces nothing has exercised yet.
- All five target screens, measured directly, are still fully pre-rebuild document-style — zero
  `useRepository`/`useProductSession` imports, and the literal string `Screen annotation(s) only,
  never a route key (D1):` rendered as page content in every one of them:

  | screen file | lines | locator tokens rendered |
  |---|---|---|
  | `app/hub/location-configuration/LocationConfigurationScreen.tsx` | 1,846 | 24 |
  | `app/hub/shift-management/ShiftManagementScreen.tsx` | 1,443 | 11 |
  | `app/hub/worker-lifecycle-and-qualifications/WorkerLifecycleScreen.tsx` | 2,318 | 24 |
  | `app/hub/permissions-roles-and-access/PermissionsScreen.tsx` | 1,636 | 35 |
  | `app/hub/devices/DevicesScreen.tsx` | 1,201 | 7 |

  9,525 lines total, all in scope for full rebuild — not a restyle.

## 3. Scope

**Screens (all `SURF-DOH`), each rebuilt as real product user interface over the repository:**

| screen | route | shape |
|---|---|---|
| Location Configuration | `/hub/location-configuration` | Site → Area → Location tree, drill-in detail, create/edit/archive at each tier, timezone anchored at Site |
| Shift Management | `/hub/shift-management` | Shift list + create/edit form, timing + overlap validation, digest delivery time |
| Worker Lifecycle and Qualifications | `/hub/worker-lifecycle-and-qualifications` | Worker DataTable (search/filter/sort/pagination) → worker detail: identity, Tenant/Site/Area scope, qualification records, invite/activate state |
| Permissions, Roles and Access | `/hub/permissions-roles-and-access` | Tenant user DataTable + invite form + role-grant assignment with scope binding |
| Devices | `/hub/devices` | Tenant device fleet DataTable, enroll, reassign to Area/worker group, suspend |

**Workflows closed by this unit** (registry ids, `not-represented` unless marked):
`WF-ORG-001` `WF-ORG-002` `WF-ORG-003` `WF-DOH-CONFIGURE-HIERARCHY` `WF-DOH-02-CASCADE`
(archival cascade) `WF-DOH-03-SHIFT` ·
`WF-WKR-001` `WF-WKR-002` `WF-WKR-005` `WF-WKR-006` `WF-DOH-ENTER-QUALIFICATION` `WF-DOH-04-QUAL` ·
`WF-WKR-004` (already `demonstrated`, re-anchored to a real screen, same treatment unit 1 gave
`WF-ROLE-004`) ·
`WF-DOH-09-PERM` `WF-DOH-CREATE-USER` `WF-DOH-ASSIGN-ROLE` `SEQ-007` ·
`WF-DVC-001` (re-anchored) `WF-DVC-002` `WF-DVC-005` ·
`SEQ-031` — **partial**: this unit closes only the User, Device and Site suspension legs; the
sequence's tenant leg is unit 1's, already closed.

**Explicitly deferred, named rather than silently dropped:**
- `WF-WKR-003` (device activation) — worker record shows an "invited / not yet activated" state;
  the activation flow itself is Frontline's, a later unit.
- `WF-DOH-04-CLEARANCE` — clearance-*granting* is a Client Command Center action (master prompt's
  closed CC action set); this unit shows the qualification record, not the grant action.
- `WF-WKR-007` (qualification expiry schedule) — scheduled-work unit.
- `WF-DVC-003` `WF-DVC-004` `WF-DVC-006` (lost/stolen/wipe) — offline/incident unit; these need the
  command-queue infrastructure unit 8 builds, not this unit's.

Anything not on either list belongs to a later unit and is left alone.

## 4. Architecture — no structural change, five write surfaces

Unit 1 already moved the runtime to where product screens can reach it
(`ProductRuntime` → `useRepository()` / `useProductSession()`) and established the pattern: generic
reads through the query primitives, every write as its own named, authorized, validated method on
`Repository`. This unit adds to that method set — it does not change the shape of it.

- Each module task adds its own named write methods (e.g. `createSite`, `createArea`,
  `createLocation`, `archiveLocationTierEntity`; `createShift`, `updateShift`; `createWorker`,
  `inviteWorker`, `recordQualification`, `assignWorkerScope`; `createTenantUser`,
  `assignTenantRole`; `enrollDevice`, `reassignDevice`, `suspendDevice`), each going through
  `evaluateAccess` and returning the typed accept/deny/validation-failed result per master prompt
  §12.1 — no shortcuts through a generic `update(collection, id, patch)`.
- Tenant isolation applies to every one of these: a write must resolve and check the acting
  session's tenant against the target row's tenant, the same class of bug unit 1's
  `resolveTenantId` finding was.
- Cross-entity referential rules are real here for the first time: a Shift references a Site's
  timezone; a Worker's Area must exist under its Site; a device reassignment must target a real
  Area; a role grant's scope must nest inside a role a tenant is actually permitted to assign
  (segregation-of-duties per master prompt §7.4/§7.5 — a Supervisor cannot grant Quality Manager).

## 5. Product-fidelity rules this unit is held to

Unchanged from unit 1 — zero rendered locators/requirement text (relocate to registry + §10.6 tour
narration, delete nothing), the deletion test, the screenshot test, every control a real
`ControlDefinition`, every denial in plain language with source-unresolved alternatives disclosed,
WCAG 2.2 AA on every state.

## 6. Verification

Per §2.3/APP-020: no test case is written. Compile-level: `pnpm typecheck`, `pnpm lint`,
`node scripts/validate-collections.mjs`, `pnpm build`, plus the two scans and
`pnpm ledger:reconcile` `pnpm verify` chains. Release evidence is the Live-Verification Ledger,
driven in real Chrome through the Chrome MCP server against `pnpm serve:out` (:4173).

Regression rule: this unit's shared surface is the Hub shell navigation these five screens mount
into, and any repository method a later screen also calls. Its re-drive set is the five module
entry routes plus unit 1's tenant-detail (which links out to two of these screens) and the
coverage/workflow indexes.

## 7. Risks

1. **Five write surfaces, none exercised yet.** Same shape as unit 1's four latent bugs. Mitigated
   the same way: each module task ships its writes and drives them live before moving on, not
   deferred to a closing task.
2. **Seed volume may be thin per-tenant.** 14 sites / 42 workers / 25 devices are totals across all
   14 tenants; the Bright Bikes tenant's own slice may not fill a 20-row page. Each module task
   checks its own table against real pagination and pads deterministically (Bright Bikes cast
   verbatim, never invented over) if it doesn't.
3. **Segregation-of-duties on role assignment is easy to get wrong in the direction that looks
   fine.** A role-grant screen that lets a Supervisor grant Quality Manager passes every visual
   check and is a real safety defect. Task 4 gets its own live-verification row for the denial, not
   only the happy path.
4. **Location Configuration is a three-tier tree (Site → Area → Location) and the registry only
   names Site and Area workflows explicitly.** The Location tier's create/archive is real product
   behaviour this screen must have; it is documented in scope as part of `WF-DOH-CONFIGURE-HIERARCHY`
   rather than invented a new id, and called out here so the gap is visible rather than silent.

# Unit 2, Task 8 — locator relocation and registry reconciliation

Frozen source: `AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`. Verified unchanged before and
after this task.

Shape reference used: `docs/process/audits/2026-08-28-unit-01-task-11-locator-relocation.md` (Unit
1's own equivalent task). This document follows its method: cite the file/line where a fact now
lives rather than hand-describe it, and separate what changed from what was already true.

## Step 1 — the relocation table

The five rebuilt screens (`LocationConfigurationScreen.tsx` [Task 1], `ShiftManagementScreen.tsx`
[Task 2], `PermissionsScreen.tsx` [Task 3], `WorkerLifecycleScreen.tsx` [Task 4],
`DevicesScreen.tsx` [Task 5]) each already carry their own "LOCATOR RELOCATION" header section
(or, for Permissions, a "STEP 1" section) written at build time, naming every identifier their
outgoing `./fixtures.ts` carried and where the fact now lives. Those sections are the primary,
line-cited record; this table is the consolidated index over them, not a re-derivation — every row
below is a locator (or group) named in the cited file's own header, condensed to one line, with a
pointer back to the exact section for the full reading.

| Locator(s) | Where it now lives |
|---|---|
| **Location Configuration** (`app/hub/location-configuration/LocationConfigurationScreen.tsx:57-167`) | |
| `OBJ-DOH-SITE`/`OBJ-DOH-AREA`/`OBJ-DOH-CELL` (L27106) | Real `Site`/`Area`/`Location` schemas (`@/data/schemas/org.ts`) |
| D21 (scope-pending/unbound/archiving flags) | NOT carried forward — no flags field in the real schema; `archiveLocationTierEntity` takes the source's own alternate "refuse and name every active child" path (`WF-DOH-02-CASCADE`) |
| D22 (certification types as closed list) | NOT carried forward — real schema uses free text (`Location.requiredCertification: z.string().nullable()`), resolving D22's own open question by construction |
| CTL-01 "View the location tree" (L27117, L27215) | The three-tier `DataTable` set, gated by `VIEW_REQUEST` |
| CTL-02 "Create a Site, an Area or a Location" (L27118, L26919) | `createSite`/`createAreaUnderSite`/`createLocationUnderArea` (`repository.ts`), Tenant-Admin-only per the corrective task |
| CTL-03 "Edit a name, an address or a contact" (L27119) | NOT BUILT — disclosed gap, out of Task 1's Step 4 scope |
| CTL-04 "Re-parent a Location..." (L27149, L27185) | NOT BUILT — disclosed gap |
| CTL-05 "Split, merge or re-parent an Area..." (L27121) | NOT BUILT — `explicitly-prohibited` for every role at V1 by every reading; no deviation |
| CTL-06 "Archive a Site or an Area" (L27122, L112908) | `archiveLocationTierEntity` + per-row Archive control, Tenant-Admin-only |
| CTL-07 "Reassign a paused Job during the cascade" (L27123) | NOT BUILT — no paused-Job state exists to reassign (see D21). **Was falsely credited `demonstrated-in-storyboard` in the committed census** by a stray `control:` label still sitting in the orphaned, unimported `fixtures.ts`'s dead `CONTROL_MATRIX` array — investigated for removal (see "Over-claiming investigated" below); left in place because the array is load-bearing for `scripts/build-doh-module-reach.mjs`, and the census defect is disclosed here and in the report instead |
| CTL-08 "Set the Site timezone" (L27124, `AC-SCOPE-034` L2612) | Site create form's Timezone field + read-only "Inherited from Site" line |
| CTL-09 "Set a Location's required certification" (L27125, L27215) | Location create form's free-text field |
| CTL-10 "View a map of locations" (L27126) | NOT BUILT — deferred beyond V1, no deviation |
| CTL-11 "Create an equipment record" (L27127, `TEST-DOH-02-D4` L27246) | NOT BUILT — equipment not a first-class entity at V1, no deviation |
| `SEEDED_ROLE_SCOPES`/`visibleSiteIds`/`visibleAreaIds` | NOT carried forward as a second scope model — `repository.ts`'s own `withinScope` is the one real mechanism |
| `AS_OF`/`Connection`/`STATE-07`/`STATE-08`/`STATE-13` | NOT carried forward — this surface has no offline mode (D7) |
| `UNSPECIFIED_IN_SOURCE`/`UNRESOLVED_IN_SOURCE` (9+5 open questions) | Folded inline wherever one bears on a decision the file makes; the remainder are real, still-open facts about the source, not re-litigated |
| **Shift Management** (`app/hub/shift-management/ShiftManagementScreen.tsx:62-142`) | |
| `OBJ-DOH-SHIFT` (L27281) | Real `Shift` schema (`org.ts`) |
| CTL "View Shifts" (L27297) | `VIEW_REQUEST` + `DataTable` |
| CTL "Create/Edit/Archive a Shift" (L27291/92/93) | `createShift`/`updateShift`/generic `update()` (`repository.ts`), Tenant-Admin-only per the corrective task |
| `AC-51-13` (L113055, Shift overlap) | Overlap refusal, re-keyed Shift-to-Site (brief's own reading) rather than the outgoing fixture's Shift-to-Area reading — `Shift` carries no per-Area window in the real schema |
| "Bind a Shift to Areas" (L27294), `DEC-SHIFT-001` | NOT BUILT — `Shift.areaIds` renders as a read-only count; binding is a future task's control |
| "Set the per-Shift digest delivery time" (L27295, `SCR-TEN-SHIFT-01` L118001) | Create/Edit form's "Digest delivery time" field |
| Inherited-timezone panel / override-timezone (L27296) | NOT carried forward as a mechanism — `Shift` carries no `timezone` field in the real schema, true by construction |
| `scheduledRunIds`, archival refusal, `NOTIF-DOH-03-3` | NOT carried forward — no Job/Run integration at this collection's authority yet |
| `SEEDED_ROLE_SCOPES`/`shiftsVisibleTo` | NOT carried forward, same reasoning as Task 1 |
| Seven-row control matrix, thirteen-state `ScreenStateBoundary`, `SHIFT_ANCHORS`, `UNSPECIFIED_IN_SOURCE`/`UNRESOLVED_IN_SOURCE` | Folded inline where they bear on a real decision; remainder are real, still-open, not repeated |
| **Permissions, Roles and Access** (`app/hub/permissions-roles-and-access/PermissionsScreen.tsx:46-153`, Task 3's own report) | |
| `SCR-DOH-01` ("the two-track sign-in", outgoing file lines 913-1008) | **Belongs to a DIFFERENT screen, not this unit's five.** The address-resolution/SSO-decision screen. Left where it is — not carried into this route, not force-fit into this unit's registry entries. Its eventual home is that screen's own future registry entry, outside this unit. |
| `SCR-DOH-ROLE-01` ("the landing, in its two views", outgoing file ~lines 1007-1072) | **Same — belongs to a DIFFERENT screen, not this unit's five.** The role-explanation family (by-person held/refused/absent breakdown, role-definition card). Same disposition as `SCR-DOH-01` above. |
| Remaining ~33 of the outgoing file's 35 locators (the real `SCR-DOH-18`/`SCR-DOH-019` "Users, roles and scopes" content) | `PermissionsScreen.tsx` itself — the roster `DataTable`, `createTenantUser`/`assignTenantRole` doors, the on-screen role-grant-rule disclosure. Full per-locator account in Task 3's own report (`task-3-report.md`, "What was implemented"). |
| `MTX-TEN-02a` (L22015), `TRN-ACC-04` (L18976) — the tenant-role-grant rule | `TENANT_ROLE_GRANT_MATRIX`'s comment (`repository.ts`) and this screen's `sourceRefs` arrays. **Fixed this task**: both ids were also rendered as bare tokens in two visible strings (the role-grant-rule `<details>` disclosure and the segregation-of-duties `<p role="alert">`, plus `repository.ts`'s matching `explain` string) — a §8.6.2 gap Task 3's own round-1 fix caught for spelled-out line numbers but not for these two non-numeric ids. Removed from all three rendered strings this task; citations remain in comments/`sourceRefs` only. |
| **Worker Lifecycle and Qualifications** (`app/hub/worker-lifecycle-and-qualifications/WorkerLifecycleScreen.tsx:67-152`) | |
| `OBJ-DOH-WORKER`/`OBJ-DOH-QUAL` (L27437) | Real `Worker`/`Qualification` schemas |
| "Create or edit a worker record" (L27470, `FUNC-DOH-04-1.1.1`) | `WORKER_WRITE_REQUEST` + `createWorker` (`repository.ts`), Tenant Admin + Supervisor only |
| "View a worker record" (L27471) | `VIEW_REQUEST` — Tenant Admin/Supervisor/Quality Manager/Read-only Auditor; Worker's "own record only" cell NOT built (D11, no Hub route for Worker) |
| "Enter a qualification" (L27472, `FUNC-DOH-04-2.1.1`) | `QUALIFICATION_WRITE_REQUEST` + `recordQualification` (`repository.ts`) |
| "Record a recertification" (L27473) | NOT BUILT — disclosed gap, a future task's dedicated flow |
| "Back-date an issue date" (L27475) | The entry form's independent `certificationDate`/`entryDate` fields |
| "Set the instruction-difficulty profile" (L27476) | Worker form's `instructionDifficultyProfile` field, same door as every other Worker field |
| "Grant a clearance..." (L27479-L27482) | NOT BUILT — `WF-DOH-04-CLEARANCE` is a Client Command Center action, explicitly deferred out of this task |
| "Archive a worker"/"Reactivate a departed worker"/"Bulk import workers" (L27478, L27484) | NOT BUILT — disclosed gaps, out of Task 4's Step scope |
| `L27602`/`L27610`/`L28112`/`L28136`/`L52800`/`L64415` (workflow/alert/escalation/command-channel narrative) | NOT carried forward as rendered mechanism — no scheduler/notification/command-channel infrastructure exists at this build's authority; the qualification's real `status` field is rendered instead |
| `SCR-DOH-23`/`OBJ-DOH-CLEAR` | **Belongs to a DIFFERENT screen** (the Qualification Calendar / Clearance object) — left there, not kept here under the wrong name, matching Permissions' own SCR-DOH-01 correction |
| **Devices** (`app/hub/devices/DevicesScreen.tsx`, Task 5's own report; module-id question resolved in Step 2 below) | |
| `WF-DVC-001` "Enrolling a device" (L53091, `MOD-SA-13` matrix L45543) | `ENROLL_DEVICE_REQUEST`/`enrollDevice` (`repository.ts`), Tenant-Admin-only; `EnrollAction`/`DetailDrawer` on screen |
| `WF-DVC-002` "Reassigning a device" (L53124) | `REASSIGN_DEVICE_REQUEST`/`reassignDevice` (`repository.ts`), Tenant-Admin-only; per-row Reassign control |
| `WF-DVC-003`/`004`/`005`/`006` (lost/stolen/suspend/wipe) | `de-authorised`/`wiped-and-de-authorised` render as real, distinct seeded statuses; no write path exists on this screen for any of them (WF-DVC-005/006 are Super Admin-console-only per the source's own Denied paths, WF-DVC-003/004 partially cross-surface) — see Task 5's "Research" section for the full per-workflow citation |
| "Suspend a device" (outgoing fixture control label) | NOT BUILT, deliberately — Task 5's central finding: the source explicitly withholds suspend/de-authorise authority from every tenant role including Tenant Admin at this surface; the correct fix is no door, not a narrower one. A visible on-screen note explains the absence in plain prose. |
| "Enrol a device" (outgoing fixture control label, L61357) | **Was falsely credited** `demonstrated-in-storyboard` in the committed census — its real citation is `SCR-DOH-LANDING-EMPTY`'s DISABLED quick-link ("Device enrolment is performed by the platform team from the Super Admin platform console"), a DIFFERENT screen's fact that directly contradicts `WF-DVC-001`'s own tenant-self-service reading. The false credit came from the orphaned, unimported `app/hub/devices/fixtures.ts` still declaring this exact label. Fixed this task — see "Over-claiming found" below. |
| `SB-SEC-005` (critical-class wipe approval storyboard) | **Was falsely credited** `demonstrated-in-storyboard` — only ever cited in the same orphaned `fixtures.ts`, never in the real `DevicesScreen.tsx` (no wipe/critical-approval flow was built, per Task 5's own "no suspendDevice door" finding). Fixed this task. |
| "Retire a device" (`SCR-DOH-DEVICES`, outgoing fixture control label, L67861) | Correctly `not-represented` — genuinely not built (no retire control on this screen); unaffected by this task |

## Step 2 — the devices module-id question, resolved

**Resolution: option (a).** The frozen source genuinely has no module id for tenant-side device
management. `WF-DVC-001`/`WF-DVC-002`'s own inline citation ("Module `MOD-DOH-13`") is a
source-internal mislabel, independently re-confirmed this task by direct re-reading:

- The canonical Delivery Operations Hub module enumeration (§4.1, `AVIIXA_Production_Product_Blueprint.md` around line 2436) lists exactly nineteen Band A/B modules by name. The thirteenth Band A item, verbatim, is "...Audit and Retention; Integration Surface on the tenant side; and **Tenant View of Platform Administration**." — confirmed to be `MOD-DOH-13` in `registries/generated/modules.json` (label "Tenant View of Platform Administration", route `/hub/tenant-view-of-platform-administration/`). No device-management module appears anywhere in that nineteen-item list.
- `WF-DVC-001`'s own body text at L53085 reads, verbatim: "**Enrolling a device into the tenant's fleet** — `WF-DVC-001` · Surface: Delivery Operations Hub · Module `MOD-DOH-13`" — a direct, non-extraction-artifact citation from the source's own prose, not a build misreading.
- `src/surfaces/doh/modules.ts:30-32` (the real SURF-DOH spine, unrelated code, written independently by an earlier slice) already states this finding in its own header: *"The devices matrix is absent from the list below because that screen is uncatalogued and claims no module (D4, D5) — it has no route for a rail to offer, and so no reach entry either."*
- Task 5's own report reaches the identical conclusion independently.

Three independent lines of evidence (the canonical module list, the raw source citation, and the
spine's own code comment) all agree: this is a genuine source-level contradiction between
`WF-DVC-001`/`002`'s loose inline module reference and the source's own canonical module table, not
a build defect and not something a later, more careful source-reading resolves differently. No new
module id was invented, per the brief's explicit instruction.

**Where this is recorded, honestly, without inventing an id:**
`registries/generated/actionable-controls.json`'s "retire control" row (raw source `SCR-DOH-DEVICES`,
CHK-021.json line 191/350, itself extracted with `"module_id": "unstated"` before this task ever
started) already carries `moduleDescriptor: "SCR-DOH-DEVICES"` — the established convention this
project's own raw extraction already uses for "a real, source-named screen with no module id": the
screen's own id stands in for the missing module id, distinct from a real `MOD-` value, rather than
a blank field a reader could mistake for an oversight. This is not new to this task (it predates
Unit 2 entirely, in `registries/raw/extract/CHK-021.json`); this task's contribution is verifying it
still correctly reflects the resolved state and citing it as the answer to the brief's Step 2, rather
than leaving the module-id question undocumented in this unit's own record. No row was added to
`modules.json` — inventing `MOD-DOH-20` (or reusing `MOD-DOH-13`) would misrepresent a source gap as
a source fact.

## Over-claiming found and corrected — one orphaned `fixtures.ts` deleted

`scripts/build-registries.mjs`'s own documented design (`walkRouteTree`'s R4-B03 comment) scans
every `.ts`/`.tsx` file's whole text for a `control:` label, deliberately without regard to import
status, to catch modules mounted via `src/` imports. This correctly widens coverage in the intended
case, and incorrectly credits a screen with a fact when a stale, unimported `fixtures.ts` sitting in
its route directory still declares the label.

**`app/hub/devices/fixtures.ts`** (1,202 lines, superseded by Task 5's rebuild) was confirmed fully
orphaned — `grep -rn` found zero imports of it, by any path, anywhere in `app/` or `src/` — unlike
`app/hub/location-configuration/fixtures.ts`, which `app/studio/qualification-requirements/fixtures.ts`
still imports `SEEDED_CERTIFICATION_TYPES` from (confirmed live-load-bearing; left untouched). Its
mere presence was causing two false `demonstrated-in-storyboard` census rows (`actionable-controls:Enrol
a device` and `ai-storyboards:SB-SEC-005`, both detailed in the relocation table above). Deleted.
`pnpm typecheck && pnpm lint && node scripts/validate-collections.mjs && pnpm build` all re-verified
exit 0 afterward; `scripts/build-doh-module-reach.mjs` confirmed unaffected (`devices` is not a member
of `DOH_MODULES` — see Step 2 above — so no module-reach computation ever read this file).

**`app/hub/location-configuration/fixtures.ts`'s own `CONTROL_MATRIX` array** (also fully dead code —
nothing imports it, confirmed) causes the same class of defect for exactly one row (`CTL-07`,
"Reassign a paused Job during the cascade" — see the relocation table above). **Investigated, not
removed**: `scripts/build-doh-module-reach.mjs` reads this exact array by static/AST inspection
(independent of the ES module import graph) to derive `MOD-DOH-02`'s real per-role `rolesReaching`
map, which `src/surfaces/doh/modules.ts` — and, through it, the live nav rail — depends on at
runtime. Deleting the array (attempted, then reverted this task after `pnpm build:registries` failed
with `app/hub/location-configuration/fixtures.ts exports 0 non-empty *MATRIX arrays whose rows carry
the surface classification`) would have broken real, shipped navigation behaviour to fix one census
row. Left in place; the resulting single false-positive is disclosed here, in the relocation table,
and in the Task 8 report rather than silently left unmentioned.

## Step 3 — census statuses

`registries/generated/modules.json`'s `MOD-DOH-02`/`03`/`04`/`09` all already read
`demonstrated-in-storyboard` with the correct route, before and after this task's own regeneration —
Tasks 1-4's own `pnpm build` runs (which chain `build:registries`) had already kept the committed
registries in sync with the shipped code. This task's own `pnpm build:registries` run reproduced the
committed state exactly except for the two rows the orphaned `devices/fixtures.ts` was inflating (see
above), confirming no under-claiming (a real, shipped fact reading `not-represented` in error) exists
anywhere in this unit's five registries beyond what the over-claiming fix corrected. See the Task 8
report for the exact before/after command output.

## Step 4 — §8.6.2 scan

Scanned every file this unit shipped or rebuilt: `git diff --name-only 857486c..HEAD -- app src`
(18 files: the five screens + their `page.tsx` wrappers, `src/data/repository.ts`,
`src/data/scope-reference.ts`, `src/ui/product/fields/TextField.tsx`, and this unit's collection
JSON files), plus `app/hub/devices/fixtures.ts` before its deletion.

Two violations found and fixed, both in `PermissionsScreen.tsx`/`repository.ts` (Task 3's own
round-1 fix caught the spelled-out `line NNNNN` form in the same two locations but not these
non-numeric bare ids):

- `PermissionsScreen.tsx`'s role-grant-rule `<details>` disclosure rendered `MTX-TEN-02a` and
  `TRN-ACC-04` as bare tokens in visible prose.
- `PermissionsScreen.tsx`'s segregation-of-duties `<p role="alert">` (and `repository.ts`'s matching
  `createTenantUser` `explain` string, rendered via the same alert for the other refusal branch)
  rendered `MTX-TEN-02a`, `MOD-DOH-09` and `TRN-ACC-04` as bare tokens.

Both fixed by removing the bare tokens from the rendered strings; the underlying citations remain in
`sourceRefs` arrays and this file's own header comment (never rendered). Re-scanned after the fix:
zero blueprint line locators (`L#####` and spelled-out `line NNNNN`), zero bare requirement
identifiers, in rendered content across all 18 files. `dohModuleById('MOD-DOH-NN')` calls in all five
screens are function arguments, not rendered text — the rendered value is `MODULE.name` (a
human-readable label). Two `{/* CTL-08, L27124... */}` occurrences in
`LocationConfigurationScreen.tsx` are JSX comments, confirmed non-rendered.

Live-verified in real Chrome (`pnpm build && pnpm serve:out`, signed in as Dana Whitfield, Tenant
Admin, Bright Bikes, via `/super-admin/sign-in/` — this build's one shared sign-in surface): the
role-grant-rule disclosure renders the corrected prose with no bare ids, confirmed via the page's
own rendered markdown extraction and a screenshot
(`task8-permissions-disclosure-fixed.png`, this directory's sibling task folder). The
segregation-of-duties alert could not be re-driven live — Task 3's own fix round 1 already narrowed
`VIEW_REQUEST`/`WRITE_REQUEST` so only Tenant Admin reaches this screen's controls at all, and a
Tenant Admin's own `assignTenantRole` call can never hit the `segregation-of-duties` branch (Tenant
Admin can grant all four roles) — the same reachability gap Task 3's own report used a headless
script to work around. This task's edit there is a substring removal with no logic change, verified
by `pnpm typecheck`/`pnpm lint`/`pnpm build` (all exit 0) rather than by re-driving an unreachable UI
path.

## Step 5 — compile-level checks

`pnpm build && pnpm ledger:reconcile` — both exit 0. Frozen source hash unchanged.

`pnpm ledger:reconcile`: registry census 5,015 rows across 14 registries; live-verification ledger
30 rows (all from Unit 1's own Task 12, `candidateId: unit01-task12-...`; none from this unit — this
unit's Tasks 1-7 recorded their live-verification evidence in their own task reports/screenshot
caches, not in `docs/process/ledgers/live-verification-ledger.json`). Direction A (uncovered:
registry rows with no ledger row) **5,003 of 5,015, unchanged before and after this task** — this
metric is keyed purely on ledger-row presence (`pathId` membership), not on registry `status`, so
neither Step 3's confirmation nor the over-claiming fix moves it; matches Unit 1's own Task 11
precedent, which reported the identical metric as "Unchanged by any of this task's work" for the
same structural reason. Populating this unit's own ledger rows from Tasks 1-7's already-completed
live-verification evidence is Unit 2's remaining Task 9's work, not this task's (mirroring Unit 1's
own Task 11 → Task 12 split); this task does not add ledger rows. Direction B (orphaned: ledger rows
naming a path no registry contains) 0, exit code contribution zero either way.

## Census, before and after

| State | demonstrated-in-storyboard | not-represented | not-applicable | mounted-in-another-screen | total |
|---|---|---|---|---|---|
| Committed before this task | 278 | 4,705 | 22 | 10 | 5,015 |
| After this task (orphaned `devices/fixtures.ts` deleted) | 276 | 4,707 | 22 | 10 | 5,015 |

Net: −2 demonstrated-in-storyboard, both over-claiming corrections (`actionable-controls:Enrol a
device`, `ai-storyboards:SB-SEC-005`), detailed in the relocation table and the "Over-claiming found"
section above. `MOD-DOH-02`/`03`/`04`/`09` unaffected — all four already read
`demonstrated-in-storyboard` and still do. No row's `id` was added or removed; total row count
unchanged at 5,015.

Exact command run for both counts:
```
node -e "const fs=require('fs');let t=0;for(const f of fs.readdirSync('registries/generated').filter(x=>x.endsWith('.json'))){const r=JSON.parse(fs.readFileSync('registries/generated/'+f,'utf8'));for(const row of r.rows||[])if(row.status==='demonstrated-in-storyboard')t++}console.log(t)"
```

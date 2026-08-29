# Unit 1, Task 11 — locator relocation and registry reconciliation

Frozen source: `AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines. Re-hashed at
the start of this task; unchanged.

This is the permanent relocation record master prompt §24.3 requires. The full narrative — every
compile-level command, the under-claiming sweep, and the reconcile discussion — is in
`.superpowers/sdd/2026-08-28-unit-01-platform-bootstrap-and-tenant-provisioning/task-11-report.md`.
This document carries only the table and the census movement.

## Which of the eight screens are rebuilds vs. new builds

Only four of the eight screens named in this task's scope had an outgoing (pre-unit-01) version to
relocate locators FROM. Verified by `git log --oneline --follow --diff-filter=A` on each file:

| Screen | File | History |
|---|---|---|
| Super Admin overview | `OverviewScreen.tsx` | REBUILD (`3824f5a` MOD-SA-01 → `0db53b6` Task 3) |
| Tenants list | `TenantsScreen.tsx` | REBUILD (`9a2a1ae` MOD-SA-09 → `fcc4214` Task 4) |
| Console users & approvals | `ConsoleUsersScreen.tsx` | REBUILD (`90559b6` MOD-SA-08 → `9393693` Task 7) |
| Tenant metrics | `TenantMetricsScreen.tsx` | REBUILD (`73e588c` MOD-SA-10 → `87640e4` Task 9) |
| Tenant detail | `TenantDetailScreen.tsx` | NEW (`ae50ab2`, Task 6) — no outgoing version |
| Create wizard | `CreateTenantWizard.tsx` | NEW (`837c08c`, Task 5) — no outgoing version |
| Sign-in | `SignInScreen.tsx` | NEW (`665d0e2`, Task 2) — no outgoing version |
| Acceptance | `AcceptInvitationScreen.tsx` | NEW (`6f3fe9d`, Task 8) — no outgoing version |

The four NEW screens have nothing to relocate — no prior file existed for git history to hold.

## Locator relocation — the four rebuilds

Each rebuild task produced and reviewed its own two-column table at the time the fact was
extracted, per the standing instruction carried since Task 3. Those tables are the primary record;
this task re-verified every row rather than re-deriving them, and corrects two places where the
already-reviewed table was overtaken by a later, undiscovered defect.

- **Overview** — `task-3-report.md`, "Locator relocation table" (17 rows). Re-verified: every row
  is either realized in real code (KPI tiles, `RequireSession`, the `sourceRefs` array on the
  tenant-drill-through gate) or carried comment-only with a stated reason (no incident-management /
  connectivity-loss / agent-health surface exists in the rebuilt product). One row, `SB-RISK-01`,
  needs a **correction**: it was additionally present as literal (non-comment) text inside
  `app/super-admin/platform-overview-and-health/fixtures.ts`, a file unimported by any route since
  Task 3's rebuild replaced it — a false citation the table's own author did not know existed. See
  "Over-claiming found" below.
- **Tenants list** — `task-4-report.md`, "The outgoing screen's extracted facts, and the locator
  relocation table" (10 rows, plus fix-round corrections for `SB-SA-01`/`SB-SEC-013` belonging to
  Task 3's file). Re-verified. The "Lifecycle transitions… carried forward untouched to Task 6"
  row is what makes `app/super-admin/tenants-lifecycle-and-pilots/fixtures.ts` legitimate as a
  *documentation* home — but that file, too, was unimported by any route, and falsely cited four
  ids as demonstrated. See "Over-claiming found" below.
- **Console users & approvals** — `task-7-report.md`, "Locator relocation table" (7 rows), amended
  three times across three fix rounds (`WF-ROLE-037` restored via `sourceRefs`; fourteen ids
  verified against their own source line and earned back; `WF-ROLE-021` correctly dropped because
  the screen asserts a re-notification the build never performs; `SB-RBAC-05`/`AC-SA-08-02` kept
  OUT of `sourceRefs` because the build follows the conflicting storyboard). Re-verified against
  the current file: every citation checked in this task sits inside a real `sourceRefs` array
  feeding an `evaluateAccess` call, never in rendered text. No correction needed.
- **Tenant metrics** — `task-9-report.md`, "Locator-relocation table", superseded by two fix
  rounds after the original table wrongly discarded `L107350`/`L107315`/`L45160` as phantom (they
  are real; a task claimed otherwise by grepping for line numbers as text, corrected by the
  reviewer's `sed -n` reads). Current, true state: `L107350`, `L107315`, `L45160`, `L45173`,
  `L45162`, `L21098`, `L45202`, `L97154`/`L97155` all realized in the two `sourceRefs` arrays at
  `TenantMetricsScreen.tsx:432,445`. **One gap, not a defect of this task**: `SB-SA-10` (L45160,
  "filterable by period") is genuinely implemented (`availablePeriods`/`period`/`inPeriod`) but the
  literal token sits only in a comment — the same class of gap `OverviewScreen.tsx` already
  resolved for `SB-SEC-013` by leaving it comment-only, because forcing the id into `sourceRefs`
  would misattribute permission authority to a UI filter, and no other real, non-decorative,
  non-rendered code location exists for it. Correctly `not-represented`; recorded rather than
  forced. See task-11-report.md's under-claiming sweep for six more instances of this exact,
  already-reviewed pattern (`FEAT-SA-09-04`, `WF-ROLE-004`, `OBJ-032`, `NOTIF-SA-08-04`, and the
  two source-conflict ids `SB-SA-08`/`SB-RBAC-05`, which must NOT be cited).

**No locator was found unaccounted for.** Every fact removed from a rebuilt screen resolves to one
of: real code the screen consumes, a `sourceRefs` array on the call governing that exact decision,
tour narration (Task 10), or a documented, reasoned `not-represented` (the fact is real but no
honest, non-decorative citation location exists, or the fact was deliberately not built and the
ledger already rules why).

## Over-claiming found — two orphaned `fixtures.ts` files

Both files predate this unit (last touched in the pre-unit-01 build of the screen they sit beside)
and became orphaned the moment Task 3 and Task 4 stopped importing them — the same false-coverage
class Task 7 and Task 9 each found once already (an unimported `fixtures.ts` under `app/` is still
scanned by `scripts/build-registries.mjs`, which walks every file under `app/` whether imported or
not). Confirmed unimported by grep across the whole tree (no `import … from` statement references
either path, anywhere), safe to delete for `typecheck`/`build` (zero importers), and confirmed
against `docs/process/ledgers/product-candidate-manifest.json` that no live check depends on the
path continuing to exist (that manifest is a sealed slice-11 historical hash record, not a live
gate).

| File deleted | Falsely-demonstrated rows it alone carried | Why the fact isn't real on the rebuilt screen |
|---|---|---|
| `app/super-admin/platform-overview-and-health/fixtures.ts` (344 lines) | `ai-storyboards:SB-RISK-01`, `ai-storyboards:SB-SCHED-17`, `workflows:SB-SCHED-17` | Platform health / fleet telemetry / agent health / review cadence / tenant connectivity aggregate panels, and a site-wide connectivity-loss incident tracker. `OverviewScreen.tsx`'s real KPI row is Tenants / Active tenants / Active pilots / Needs attention / Platform users / Devices enrolled / AI requests / Open critical-class approvals — none of these concepts. The screen's own header comment already says so ("no incident-management, connectivity-loss, or agent-health surface exists anywhere in the rebuilt product yet"). |
| `app/super-admin/tenants-lifecycle-and-pilots/fixtures.ts` (544 lines) | `scheduled-work:SCHED-022`, `scheduled-work:SCHED-023`, `workflows:WF-PLT-004`, `workflows:WF-PLT-005` | `WF-PLT-005` ("blocking, unblocking and controlled restoration") is the workflow Task 6's own binding ruling explicitly REMOVED from this unit ("Blocking… belong together in unit 10") — this row directly contradicted a ruling already recorded in this unit's ledger. `WF-PLT-004` ("applying soft and hard suspension") is likewise not built: `TenantDetailScreen.tsx`'s only lifecycle action is `Activate`; suspension is displayed as read-only status, never set. `SCHED-022` (non-payment day-count evaluation) has no day-count logic anywhere. `SCHED-023` (pilot-expiry tracking) is the one partially-real case — `tenant.pilotExpiresAt` is genuinely rendered — but the literal token has no honest code home either (same class as `SB-SA-10` above). |

Census effect: **283 → 276** (seven rows, all `demonstrated-in-storyboard → not-represented`).
`ai-storyboards` 84→82, `workflows` 70→67, `scheduled-work` 3→1. No other registry changed.
Verified by regenerating `pnpm build:registries` before and after the deletion.

## §8.6.2 rendered-content scan — two violations found and fixed

Command run (there is no dedicated npm script; this reuses the project's own comment-stripper,
which is what `scripts/build-registries.mjs` and every prior task's manual check has used):

```
node --input-type=module -e '
import { readFileSync } from "fs";
import { stripComments } from "./scripts/lib/strip-comments.mjs";
... stripComments(text), then regex for L\d{4,6}, requirement-id prefixes, and build vocabulary
'
```
run over the eight screen files, followed by manually tracing every surviving (non-comment) hit
back to its call site to confirm it sits in a `sourceRefs` array or a module-lookup key (never
rendered), not in a JSX text node or a string prop the shared primitives render.

Two violations found, both bare requirement identifiers baked into rendered strings, both fixed by
removing the identifier and keeping the fact (the citation already exists, or now exists, in the
file's own header comment — nothing lost):

1. `TenantsScreen.tsx`'s `DataTable` `emptyState.whatCreatesIt` rendered `"…(AC-SA-09-01)."` via
   `DataTable.tsx`'s own `<p>{emptyState.whatCreatesIt}</p>`. `AC-SA-09-01` is not a tracked
   registry id in any of the fourteen registries — the fix has zero census effect.
2. `OverviewScreen.tsx`'s `CRITICAL_APPROVALS_UNKNOWN_REASON` rendered `"…(MOD-SA-08) names the
   concept…"` via `StatTile.tsx`'s own `<p>{data.reason}</p>` on the "Open critical-class
   approvals" tile. `MOD-SA-08` remains demonstrated via its own screen
   (`console-users-roles-and-change-approvals/`) — the fix has zero census effect on that row.

Zero blueprint line locators and zero bare requirement identifiers now render in any of the eight
files. One phrase — "No … collection exists in this build" / "in this build's data model", used on
several `StatTileData` unknown-reason captions in `TenantMetricsScreen.tsx` and
`ConsoleUsersScreen.tsx` — was checked against the two named forbidden phrases ("seeded", "this
unit's scope") and against the general "build-process vocabulary" category, and judged acceptable:
it reads as "this deployed system" (comparable to a real product saying "not available in this
plan"), not as a reference to the authoring process, and it survived two full OPUS review rounds
each specifically auditing caption honesty on that exact screen. Recorded rather than changed.

## Under-claiming sweep

Every comment-only, tracked-registry identifier across the eight screen files was enumerated and
checked against a live sourceRefs/decision fit. Full list and reasoning in the accompanying task
report. None qualified for restoration: each is either a real fact with no non-decorative,
non-permission-decision code location honest enough to carry it (matches the `SB-SEC-013`
precedent `OverviewScreen.tsx` already established and had reviewed), or an identifier that must
NOT be cited because the build follows a conflicting storyboard (`SB-SA-08`, `SB-RBAC-05`), or an
identifier for an act the build correctly never performs (`WF-ROLE-021`, already dropped).

## Census, before and after this task

| | demonstrated | mounted | not-applicable | not-represented | total |
|---|---|---|---|---|---|
| Before (regenerated at task start, matches the brief's "measured position") | 283 | 10 | 22 | 4700 | 5015 |
| After | 276 | 10 | 22 | 4707 | 5015 |

By registry, only these three moved: `ai-storyboards` 84→82, `workflows` 70→67,
`scheduled-work` 3→1. All seven rows are named in the "Over-claiming found" table above.

## Compile-level checks (all exit 0)

`pnpm typecheck`, `pnpm validate:collections`, `pnpm lint`, `pnpm check:gate-ordering`,
`pnpm check:boundary-rules`, `pnpm build`, `pnpm scan:no-external-network` (0 violations, 701
source files + 5,846 built HTML files), `pnpm scan:no-fallback-shells` (0 fallback shells, 5,846
built HTML files), `pnpm ledger:reconcile` (exit 0; Direction B, orphaned ledger rows, is 0 both
before and after).

## `pnpm ledger:reconcile` — before and after

Unchanged: registry census 5,015 rows across 14 registries; live-verification ledger 0 rows;
Direction A (uncovered) 5,015 of 5,015 both before and after this task. This task's status
corrections move rows between `demonstrated-in-storyboard` and `not-represented` — they do not add
or remove a registry ROW (id), and `scripts/ledger-reconcile.mjs`'s census keys on row presence,
not status. `docs/process/ledgers/live-verification-ledger.json` is explicitly seeded at zero rows
by design ("Every row from here forward is added … at the time that unit actually runs the Chrome
MCP sequence — never reconstructed afterward from memory or from a report's prose summary") and is
not in this task's file scope (`registries/*`, `scripts/build-registries.mjs`,
`docs/process/audits/`). See the accompanying report for the full discussion and the concern this
raises against this task's own brief wording.

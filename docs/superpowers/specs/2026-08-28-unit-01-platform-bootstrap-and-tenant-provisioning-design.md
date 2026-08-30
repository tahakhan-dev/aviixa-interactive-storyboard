# Workflow unit 1 — platform bootstrap and tenant provisioning

**Status:** approved under APP-021 (standing authority; APP-018 released the client's own read of
each unit spec, not the reviews).
**Parent design:** `docs/superpowers/specs/2026-08-26-product-fidelity-rebuild-design.md` §9.
**Frozen source:** `AVIIXA_Production_Product_Blueprint.md`
sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`,
18,565,031 bytes / 122,241 lines. Re-hashed at session S14 entry, unchanged.

---

## 1. Why this unit is first

Master prompt §24.2 names the arc and puts **platform bootstrap and tenant provisioning** at its
head, because nothing downstream exists until a platform and a tenant do. §8.6.2's canonical
example is this unit, almost verbatim: *the Super Admin opens the platform login screen, sees the
branded sign-in form, enters credentials into real inputs, sees inline validation, clicks Sign in,
lands on the platform dashboard showing real seeded metrics and navigation, opens Tenant
Management, sees the populated tenant table with search and filters, clicks Create Tenant,
completes the multi-step form with validation, and sees the new tenant appear with its state,
audit trail, and follow-on actions.*

That sentence is this unit's acceptance bar, taken literally.

## 2. Entry position, measured

- Runway 19/19 closed. `pnpm verify` exit 0 on HEAD `65d95c0`.
- `src/ui/product` holds the primitives; **`src/ui/product/AppShell` is mounted in zero routes.**
- `src/data` holds 40 validated collections — 14 tenants, 81 users, 9 roles, 80 role grants,
  12 entitlements, 5 feature controls, 4 access sessions, 417 audit rows.
- **No route reaches the repository.** `boot()` is called only by `src/ui/demo/DemoChrome`, which
  the root layout mounts as a *sibling* of `{children}` — so no product screen can consume it.
- The unit's screens are still document-style. `TenantsScreen.tsx:234` renders
  `Screen annotations only, never route keys (D1): SCR-SA-14 …` as page content.
- There is no platform sign-in route at all.

## 3. Scope

**Screens (all `SURF-SA` unless noted), each rebuilt as real product user interface:**

| screen | route | shape |
|---|---|---|
| Platform sign-in | `/super-admin/sign-in` (new) | branded form, inline validation, six outcome states |
| Platform overview and health | `/super-admin/platform-overview-and-health` | dashboard: stat tiles, charts with table equivalents, drill-down |
| Tenants — list | `/super-admin/tenants-lifecycle-and-pilots` | DataTable: search, filters, sort, pagination, bulk, row → detail |
| Create Tenant | `/super-admin/tenants-lifecycle-and-pilots/create` (new) | Wizard, real validation, repository write |
| Tenant detail | `/super-admin/tenants-lifecycle-and-pilots/[tenantId]` (new) | ObjectPage, tabs, lifecycle actions, audit trail |
| Console users, roles and approvals | `/super-admin/console-users-roles-and-change-approvals` | user table + invite form + maker-checker approval queue |
| Tenant metrics and aggregates | `/super-admin/tenant-metrics-and-aggregates` | aggregate dashboard, freshness-stamped |
| Accept invitation (`SURF-DOH`) | `/hub/accept-invitation` (new) | the first Tenant Admin's own acceptance and landing |

**Workflows closed by this unit** (registry ids, all currently `not-represented` unless marked):
`SEQ-001` `SEQ-002` `SEQ-003` `SEQ-004` `SEQ-005` · `SB-001@L61090` `SB-001@L61276` ·
`WF-TEN-001` `WF-TEN-002` · `WF-TENANT-ONBOARD` `WF-SA-TENANT-ONBOARD` ·
`unnumbered@L75141` `unnumbered@L75270` `unnumbered@L75557` `unnumbered@L76102` ·
`WF-ROLE-001` `WF-ROLE-002` `WF-ROLE-003` `WF-ROLE-004` (already `demonstrated`, re-anchored to
real screens) · `WF-ROLE-037` `WF-ROLE-038` · `WF-ROLE-019` `WF-ROLE-020` `WF-ROLE-021`
(critical-class approve / decline / re-notify) · `WF-TENANT-PILOT` `SB-SCHED-21` (pilot expiry).

Anything not on that list belongs to a later unit and is left alone. Tier changes, entitlements
authoring, suspension propagation to devices, support/JBS sessions, archival and data lifecycle
are **units 10 and 11** — this unit renders tenant lifecycle *state* and the two actions the
source puts at provisioning time (activate, and block before first activation), and no more.

## 4. Architecture — the one structural change this unit makes

`DemoChrome` currently owns `boot()`, `ProductSessionContext` and `DemoDataContext`, and is
mounted where product screens cannot reach it. Product may never import demo (`pnpm
check:boundary-rules`), so the runtime moves **down**, not sideways:

```
app/layout.tsx
  └── <ProductRuntime>            ← src/ui/product/runtime, boots the repository ONCE
        ├── {children}            ← every product screen: useRepository(), useProductSession()
        └── <DemoChrome/>         ← demo consumes the same runtime; keeps DemoControllerContext
```

- `ProductRuntime` owns: the single `Repository`, the `Store`, `ProductSessionContext` (the
  simulated signed-in identity, §7.3.1), and the persistence-capability gate.
- `DemoChrome` keeps `DemoControllerContext` (persona, connectivity, clock, failure injection,
  checkpoint) and the tour runner, and reads the repository from `ProductRuntime` instead of
  booting its own. **One boot, one store** — two would be two truths.
- The §7.3.1 separation is unchanged and is now *structural*: changing the demo persona writes to
  `DemoControllerContext`; signing in writes to `ProductSessionContext`; neither is the other.
- Screens read business truth **only** through `useRepository()`. The no-seed-import lint rule
  already forbids the alternative.

`ProductSession` gains `signedIn: boolean` and `sessionId`. A screen rendered without a signed-in
session redirects to `/super-admin/sign-in` rather than showing a default persona's data — the
§12.4 no-default-persona-flash rule, applied to identity as well as to storage.

## 5. Product-fidelity rules this unit is held to

1. Zero blueprint line locators, requirement identifiers, narrative paragraphs or bullet lists as
   the primary content of any screen this unit ships or rebuilds. Their content moves to the
   traceability registry and to §10.6 tour narration; nothing is deleted, it is relocated.
2. The deletion test: remove every paragraph of prose from a shipped screen and it must still be
   fully functional.
3. The screenshot test: a capture with demo chrome hidden must be indistinguishable from a real
   enterprise product screen.
4. Every control resolves to a `ControlDefinition` and does one of the five §13 things. No dead
   control, no `href="#"`, no console-only handler.
5. Every denial renders the governing reason in plain language and, where the source is
   unresolved, discloses the alternatives with this build's pick labelled a client-delegated
   choice (the limit APP-012 preserved and no delegation waives).
6. WCAG 2.2 AA on every state: focus ring, accessible name, keyboard operation, route-change
   focus, error-summary association, live-region status, non-colour state communication.

## 6. Verification

Per §2.3 and APP-020: **no test case is written.** Compile-level checks are `pnpm typecheck`,
`pnpm lint`, `node scripts/validate-collections.mjs`, `pnpm build`, plus the two scans and
`pnpm ledger:reconcile` that `pnpm verify` chains. Release evidence is the Live-Verification
Ledger: real Google Chrome through the Chrome MCP server against the served static export
(`pnpm serve:out`, :4173), one row per path with screenshots at each material state, console
errors, and every network request observed — any external-origin request is a Critical defect.

Regression rule: every change re-drives its own ledger rows **and** every row sharing a changed
screen, component, repository method or state machine. The runtime provider in Task 1 is shared
by all 102 routes, so its re-drive set is the five surface entry routes plus the workflow and
coverage indexes.

## 7. Risks

1. **The runtime move touches every route.** Mitigated by shipping it alone, as Task 1, with its
   own live re-drive of all five surfaces before any screen is rebuilt.
2. **A rebuilt screen silently dropping registry coverage.** Mitigated by Task 11's relocation
   pass being a *task*, not a step: every locator removed from a screen is asserted present in the
   registry or a tour before the unit closes.
3. **Seed data too thin for a real table.** 14 tenants fills a table but not pagination at 20/page.
   Task 4 adds rows to `tenants.json` to reach realistic volume per §12.6, deterministically
   generated, with the recurring Bright Bikes cast emitted verbatim and never invented over.

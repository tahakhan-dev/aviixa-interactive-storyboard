# Workflow unit 1 — platform bootstrap and tenant provisioning — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship master prompt §24.2's first workflow unit as real product user interface — a
platform sign-in, a platform dashboard, a tenant list with working search and filters, a Create
Tenant wizard, a tenant detail page, the console-user and approval screens, the tenant-metrics
dashboard, and the first Tenant Admin's own acceptance on the Hub — each reachable, each driven by
the §12.6 repository, each with its guided tour and its Live-Verification Ledger rows.

**Architecture:** The repository boot moves out of `src/ui/demo/DemoChrome` into a new
`src/ui/product/runtime` provider that wraps `{children}` in the root layout, so product screens
can reach business truth without importing demo code (the one-way edge stays intact and is now
structural). Every screen in this unit is then rebuilt on `AppShell` + the Task 9-13 product
primitives, reading through `useRepository()` and writing through `repository.create/update/
transition`, with permission results from `evaluateAccess`. The document-style bodies being
replaced carry real extracted source facts; those facts move into the new screens' behaviour and
their locators move into the traceability registry and tour narration.

**Tech Stack:** Next.js 16.3.1 App Router (`output: "export"`), React 19.2.8, TypeScript strict,
zod 4.4.3, CSS custom properties in `app/globals.css` via `src/ui/product/tokens.ts`, pnpm 11.20.0.
Verification is real Google Chrome through the Chrome MCP server
(`mcp__plugin_superpowers-chrome_chrome__use_browser`) against the served static export.

**Spec:** `docs/superpowers/specs/2026-08-28-unit-01-platform-bootstrap-and-tenant-provisioning-design.md`

## Global Constraints

- **No test cases.** Master prompt §2.3 and APP-020. Do not create, extend or repair any
  `*.test.ts`/`*.test.tsx`, Playwright spec, or snapshot. There are none left in the repository
  and none may return. `/superpowers:test-driven-development` is policy-excluded.
- **Verification is live.** Each task's green step is a recorded run in real Chrome through the
  Chrome MCP server plus the compile-level checks: `pnpm typecheck`, `pnpm lint`,
  `node scripts/validate-collections.mjs`, `pnpm build`.
- **No backend, ever.** No API route, Route Handler, Server Action, middleware, `fetch` to any
  external origin, secret, or environment variable. `output: "export"` must keep building, and
  every dynamic segment must be enumerated by `generateStaticParams`.
- **No component imports a seed file.** Business truth reaches a component only through
  `src/data/repository.ts`, obtained from `useRepository()`. Enforced by lint.
- **`src/ui/product/**` must never import `src/ui/demo/**`.** Enforced by
  `pnpm check:boundary-rules`. Demo may import product.
- **§8.6.2 product fidelity.** No file this plan creates or rebuilds may render a blueprint line
  locator (`L42806`), a bare requirement identifier, a narrative paragraph, or a bullet list as the
  primary content of a product screen. Source citations belong in **code comments**, the
  traceability registry, and tour narration — never in rendered text.
- **Frozen source** sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`.
  Re-hash at task entry. A difference is source drift: stop and report. That stop is not waived.
- **Cite the blueprint, never the graph.** `graphify query` returns a lead; open the line it names
  and read it before citing it. Write **"master prompt §X"** for master-prompt sections — a bare
  `§9.6` means the blueprint and the two collide.
- **Simulated clock only.** No `Date.now()`, no argument-less `new Date()`, no `Math.random()` in
  `src/data`, `src/ui/product` or `src/tours`.
- **Accessibility floor:** WCAG 2.2 AA. Visible focus ring, accessible name, keyboard operation,
  route-change focus, error-summary association, live-region status announcement, non-colour state
  communication, 200% zoom and reflow, forced colors.
- **Every control carries `data-control-id`**, matching the id registered in
  `registries/generated/actionable-controls.json` or added to it by the same task.
- **Unresolved source decisions are disclosed, not resolved.** Where the frozen source disagrees
  with itself, the screen shows this build's pick, labels it a client-delegated choice, and offers
  the alternative. That limit survives every delegation.
- **Implementers never run git.** The controller commits.

---

## File structure

| path | responsibility |
|---|---|
| `src/ui/product/runtime/ProductRuntime.tsx` | boots the one `Repository`, owns `ProductSessionContext`, renders children |
| `src/ui/product/runtime/useRepository.ts` | `useRepository()`, `useAccessContext()`, `useRepositoryQuery()` |
| `src/ui/product/runtime/session.ts` | `ProductSessionState`, sign-in / sign-out reducers, the six outcome states |
| `src/ui/product/runtime/index.ts` | barrel |
| `app/super-admin/sign-in/` | the platform sign-in route |
| `app/super-admin/platform-overview-and-health/` | rebuilt dashboard |
| `app/super-admin/tenants-lifecycle-and-pilots/` | rebuilt list; `create/` wizard; `[tenantId]/` detail |
| `app/super-admin/console-users-roles-and-change-approvals/` | rebuilt users + approvals |
| `app/super-admin/tenant-metrics-and-aggregates/` | rebuilt aggregate dashboard |
| `app/hub/accept-invitation/` | the first Tenant Admin's acceptance |
| `src/data/collections/tenants.json`, `users.json`, `role-grants.json`, `audit.json` | seed volume for this unit |
| `src/data/collections/tours.json` | the unit's tours |
| `docs/process/ledgers/live-verification-ledger.json` | the release evidence |

---

## Task 1: The product runtime — one repository boot, reachable from every route

**Files:**
- Create: `src/ui/product/runtime/ProductRuntime.tsx`
- Create: `src/ui/product/runtime/useRepository.ts`
- Create: `src/ui/product/runtime/session.ts`
- Create: `src/ui/product/runtime/index.ts`
- Modify: `app/layout.tsx` — wrap `{children}` and `<DemoChrome/>` in `<ProductRuntime>`
- Modify: `src/ui/demo/DemoChrome.tsx` — delete its own `boot()` call and its
  `ProductSessionContext`; read both from the runtime; keep `DemoControllerContext`, the tour
  runner context and `DemoDataContext` (now a thin re-export of the runtime's repository plus the
  reviewer `AccessContext`)
- Modify: `src/ui/product/index.ts` — export the runtime barrel

**Interfaces:**
- Consumes: `boot()` from `@/data/boot`; `Repository`, `Store`, `AccessContext`,
  `scenarioStateFor` from `@/data/repository`; `ProductSession` from `@/ui/product/AppShell`.
- Produces, and every later task depends on these exact names:

```ts
// src/ui/product/runtime/session.ts
export type SignInOutcome =
  | { kind: 'signed-in'; session: ProductSession }
  | { kind: 'invalid-credentials' }
  | { kind: 'account-locked'; until: string }
  | { kind: 'account-suspended'; reason: string }
  | { kind: 'tenant-suspended'; tenantId: TenantId; lifecycle: string }
  | { kind: 'step-up-required'; challenge: string }

export interface ProductSessionState {
  readonly session: ProductSession | null   // null === not signed in
  readonly sessionId: string | null
  readonly lastOutcome: SignInOutcome | null
}

export interface ProductSessionApi extends ProductSessionState {
  signIn(email: string, password: string): SignInOutcome
  signOut(): void
}

// src/ui/product/runtime/useRepository.ts
export function useRepository(): Repository            // throws outside <ProductRuntime>
export function useStore(): Store
export function useAccessContext(): AccessContext      // built from the CURRENT product session
export function useProductSession(): ProductSessionApi
export function useRepositoryQuery<T>(select: (r: Repository, ctx: AccessContext) => T): T
export function useRuntimeReady(): boolean             // false until boot() resolves
```

`useRepositoryQuery` subscribes via `repository.subscribe` and `useSyncExternalStore`, with a
server snapshot of the pre-boot value — the static export prerenders with no repository, exactly
as `useTourRunnerState` already does.

- [ ] **Step 1: Re-hash the frozen source**

Run: `shasum -a 256 /Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md`
Expected: `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`. Anything else is
source drift — stop and report it as a blocker.

- [ ] **Step 2: Reproduce the gap live, before changing anything**

Serve the current export and confirm the defect this task exists to fix:

```
pnpm build && pnpm serve:out          # :4173
```

In Chrome via the MCP server, open `http://localhost:4173/super-admin/` and record: no product
screen can call `useRepository` because none exists, and `boot()` has exactly one caller
(`grep -rn "boot()" src app` → `src/ui/demo/DemoChrome.tsx` only). Screenshot the page as the
before-state. This is the live analogue of a failing test; the report must carry both facts.

- [ ] **Step 3: Write `session.ts`**

The six outcomes are resolved from the `users` and `tenants` collections, not invented:

```ts
export function resolveSignIn(
  repository: Repository, ctx: AccessContext, email: string, password: string,
): SignInOutcome {
  const user = repository.list('users', ctx).where((u) => u.email === email).first()
  if (!user || password.length === 0) return { kind: 'invalid-credentials' }
  if (user.status === 'locked') return { kind: 'account-locked', until: user.lockedUntil ?? '' }
  if (user.status === 'suspended') return { kind: 'account-suspended', reason: 'Account suspended by a platform administrator.' }
  const tenant = user.tenantId ? repository.get('tenants', user.tenantId, ctx) : undefined
  if (tenant && tenant.lifecycle !== 'active' && tenant.lifecycle !== 'pilot') {
    return { kind: 'tenant-suspended', tenantId: tenant.id as TenantId, lifecycle: tenant.lifecycle }
  }
  if (user.role === 'ROOT_SUPER_ADMIN') return { kind: 'step-up-required', challenge: 'authenticator' }
  return { kind: 'signed-in', session: sessionFor(user) }
}
```

Read `users.json`'s real `status` vocabulary first and match it exactly; if `locked`/`suspended`
are not among its values, add them to the schema **and** seed at least one user in each state, so
every branch above is reachable from seed data rather than only from a type.

The Root step-up branch is source behaviour, not decoration — master prompt §7.5 and the
blueprint's root-hardening workflow (`WF-ROLE-003`, `WF-ROLE-004`) require the enforced-invariant
acknowledgement at first root sign-in. Cite the blueprint line in a code comment.

- [ ] **Step 4: Write `ProductRuntime.tsx`**

```tsx
'use client'
export function ProductRuntime({ children }: { children: ReactNode }) {
  const [data, setData] = useState<{ repository: Repository; store: Store } | null>(null)
  const [sessionState, setSessionState] = useState<ProductSessionState>(SIGNED_OUT)
  useEffect(() => { let live = true; void boot().then((r) => { if (live) setData(r) }); return () => { live = false } }, [])
  // ... contexts ...
}
```

Two rules the implementation must honour and the report must state:
1. **One boot.** `boot()` is called here and nowhere else. `grep -rn "boot()" src app` must return
   exactly one call site after this task.
2. **No default-persona flash.** Before boot resolves, `useRuntimeReady()` is `false` and screens
   render their loading state — never a signed-in default identity, never seeded tenant names.
   This is the §12.4 rule applied to identity.

- [ ] **Step 5: Refactor `DemoChrome` onto the runtime**

Delete `DemoChrome`'s `boot()` effect and its `ProductSessionContext` declaration. Re-export
`useProductSession` from the runtime so existing importers keep compiling, or update them — either
is fine, but there must be exactly **one** `ProductSessionContext` in the tree afterwards
(`grep -rn "ProductSessionContext" src` proves it). `DemoControllerContext` is untouched:
§7.3.1's separation is the point of this task, not a casualty of it.

- [ ] **Step 6: Compile-level checks**

Run: `pnpm typecheck && pnpm lint && pnpm check:boundary-rules && node scripts/validate-collections.mjs && pnpm build`
Expected: all exit 0. `check:boundary-rules` is the one that proves the runtime landed in
`product` and not in `demo`.

- [ ] **Step 7: Live-verify the shared-surface re-drive set**

Per the spec's regression rule, this task's change is shared by all 102 routes, so re-drive in
Chrome against `pnpm serve:out`: `/`, `/super-admin`, `/hub`, `/studio`, `/command-center`,
`/frontline`, `/workflows`, `/coverage`. For each: screenshot, zero console errors, zero
external-origin requests, and the demo chrome still opening and switching persona. Record one
Live-Verification Ledger row per route with the exact step sequence and observations.

- [ ] **Step 8: Report**

The report states: the one-call-site grep output, the one-context grep output, the eight ledger
rows with their screenshot paths, and any behaviour that changed for a reader (there should be
none — this task moves plumbing, not pixels).

---

## Task 2: The platform sign-in screen

**Files:**
- Create: `app/super-admin/sign-in/page.tsx` (server, metadata only)
- Create: `app/super-admin/sign-in/SignInScreen.tsx` (`'use client'`)
- Modify: `src/data/collections/users.json` — seed one locked and one suspended platform user if
  Task 3's read found none
- Modify: `registries/generated/` inputs as needed so the screen's controls are registered

**Interfaces:**
- Consumes: `useProductSession()`, `useRepository()`, `useRuntimeReady()` from Task 1;
  `Form`, `TextField`, `ErrorSummary`, `Button`, `Banner` from `@/ui/product` and `@/ui/primitives`.
- Produces: `SignInScreen` — the entry point every other Super Admin route redirects to when
  `useProductSession().session === null`.

- [ ] **Step 1: Reproduce live**

`http://localhost:4173/super-admin/sign-in` → 404. Screenshot it. That is the gap.

- [ ] **Step 2: Build the screen**

A real branded sign-in, not a persona picker:

- centred card on the platform surface's own token background, product wordmark (the neutral text
  wordmark — never invent a client logo), one `<h1>`;
- `email` and `password` `TextField`s with real `type`, `autocomplete`, `required`, and inline
  validation on blur and on submit;
- `ErrorSummary` above the form on submit failure, focused, with `#field-email` / `#field-password`
  links that move focus to the offending field;
- a `Sign in` submit `Button` with a pending state;
- the six `SignInOutcome` branches each rendering a distinct, plain-language result:
  invalid credentials (generic — never disclose whether the address exists), account locked with
  the release condition, account suspended with the governing authority, tenant suspended naming
  the lifecycle state, step-up required rendering the enforced-invariant acknowledgement the root
  must accept before landing, and success navigating to `/super-admin/platform-overview-and-health`;
- the prototype disclosure sentence `AppShell` already centralises — this screen is outside
  `AppShell`, so it renders that same sentence from the same constant, never a second wording.

Below the form, a small **"Storyboard sign-in"** panel, visually part of the demo chrome family
rather than the product card, listing the seeded platform identities a reviewer can use. It is
demo affordance, so it must be collapsible and absent from a chrome-hidden screenshot.

- [ ] **Step 3: Compile-level checks**

Run: `pnpm typecheck && pnpm lint && node scripts/validate-collections.mjs && pnpm build`
Expected: exit 0, and `out/super-admin/sign-in/index.html` exists.

- [ ] **Step 4: Live-verify all six outcomes plus keyboard and dark mode**

In Chrome, against the served export, drive and screenshot each: empty submit (both field errors,
summary focused); bad password; locked account; suspended account; a tenant-suspended user; the
root's step-up acknowledgement; and a successful sign-in landing on the dashboard. Then: keyboard-
only completion from the address bar to landing; `prefers-color-scheme: dark`; 360px width; 200%
zoom. Zero console errors, zero external requests on every capture.

- [ ] **Step 5: Report** — ledger rows, screenshot paths, and the exact `users.json` rows each
outcome resolved through.

---

## Task 3: Platform overview and health — the dashboard a sign-in lands on

**Files:**
- Rewrite: `app/super-admin/platform-overview-and-health/OverviewScreen.tsx`
- Modify: `app/super-admin/platform-overview-and-health/page.tsx` if its exports change
- Delete: nothing yet — the document-style body is replaced in place, and Task 11 asserts its
  locators arrived in the registry

**Interfaces:**
- Consumes: Task 1's runtime; `AppShell`, `PageHeader`, `StatTile`, `Chart`, `DataTable`,
  `FreshnessStamp`, `StatusPill` from `@/ui/product`.
- Produces: nothing later tasks import. It is a leaf screen.

- [ ] **Step 1: Read what the current screen knows**

`app/super-admin/platform-overview-and-health/OverviewScreen.tsx` is 768 lines carrying 17 source
locators. Read it and list every *fact* it asserts (which metrics the source names for this
module, which roles reach it, which states it must show). Those facts survive; their rendering
does not. Record the list in the report — it is the input to Task 11's relocation.

- [ ] **Step 2: Build the dashboard**

Every number is computed from the repository at render time; none is a literal:

- a KPI row of `StatTile`s: tenants by lifecycle, active pilots, platform users, open critical-class
  approvals, devices enrolled, AI requests in the current window. `StatTile` cannot render zero for
  unknown — its type forbids it — so a metric with no data renders its unknown state, not `0`;
- a `Chart` of tenants by tier with its synchronized table equivalent;
- a "needs attention" `DataTable`: tenants not in `active`/`pilot`, with lifecycle, tier, days in
  state, and a row link to the tenant detail page (Task 6);
- a `FreshnessStamp` on every panel, reading the simulated clock — never the wall clock;
- role results: all four platform roles reach this screen; Support sees it read-only; the
  drill-down into a tenant is governed by `evaluateAccess` and renders its denial reason inline
  for a role that cannot follow it.

- [ ] **Step 3: Compile-level checks** — `pnpm typecheck && pnpm lint && pnpm build`, exit 0.

- [ ] **Step 4: Live-verify**

Drive: land from sign-in; every tile shows a number traceable to a collection count you verify by
hand; the chart's table equivalent carries the same values; the attention table sorts and its row
link reaches the right tenant; each of the four platform personas renders its own version;
the unknown-metric state renders (temporarily point one tile at an empty collection to see it, then
restore byte-exact and say so in the report). Screenshot each. Ledger rows for all of it.

- [ ] **Step 5: Report** — including the by-hand count for at least three tiles, so the report
proves the numbers rather than asserting them.

---

## Task 4: The tenant list — search, filters, sort, pagination that mean something

**Files:**
- Rewrite: `app/super-admin/tenants-lifecycle-and-pilots/TenantsScreen.tsx`
- Modify: `src/data/collections/tenants.json` — raise to realistic volume (see Step 2)
- Modify: `scripts/generate-seed.mjs` if the added rows are generated rather than hand-authored

**Interfaces:**
- Consumes: Task 1's runtime; `DataTable`, `TableToolbar`, `Pagination`, `StatusPill`, `AppShell`.
- Produces: the route `/super-admin/tenants-lifecycle-and-pilots/[tenantId]` is linked from here;
  Task 6 creates it. Until Task 6 lands, the row link target must still be a real route — build
  Task 6's route stub in Task 6, and have Task 4's `rowHref` point at it, so a live drive of Task 4
  before Task 6 is honest about a not-yet-built destination rather than silently linking nowhere.

- [ ] **Step 1: Seed volume**

`tenants.json` holds 14 rows and `DataTable`'s default page size is 20 — pagination cannot be
exercised, which master prompt §8.6.1's fixture-adequacy rule forbids. Raise it to **60-80
tenants**: deterministic, generated through the existing generator so the run is reproducible, with
every lifecycle state and every tier represented and at least one row in each of `invited`,
`pending-downgrade` and `archived`. The recurring Bright Bikes cast is emitted verbatim and never
regenerated over. Prove determinism by generating twice and comparing sha256.

- [ ] **Step 2: Build the list**

- `DataTable` over `repository.list('tenants', ctx)` with columns: name, lifecycle (`StatusPill`),
  tier, pilot, regulated mode, Worker-Shifts this month, onboarded, and a row link;
- search matching name and id, with a genuine no-match empty state distinct from the
  no-rows-at-all empty state (`Query#total()` vs `count()` is exactly this distinction);
- filters on lifecycle and tier, each changing the visible row set;
- sort on name, onboarded date and usage;
- selection with one bulk action the source authorises at this stage, or none at all — do not
  invent a bulk action to fill the affordance;
- a `Create tenant` primary action in the `PageHeader`, permission-gated: Root and Admin may act,
  Platform Engineer and Support see it disabled with the plain-language reason and the governing
  authority, never hidden.

- [ ] **Step 3: Compile-level checks** — `pnpm typecheck && pnpm lint && node scripts/validate-collections.mjs && pnpm build`, exit 0.

- [ ] **Step 4: Live-verify the fixture-adequacy record**

Per master prompt §8.6.1 every one of these needs a positive result, an empty/no-match result, a
boundary condition and an observable before/after: search, each filter, each sort, pagination
(first page, a middle page, the last partial page), and the disabled-action reason for each of the
two roles that cannot create. Screenshot each. Also drive 360px (card fallback), keyboard-only
paging, and dark mode.

- [ ] **Step 5: Report** — the generator's two sha256 runs, the row counts per lifecycle state, and
the ledger rows.

---

## Task 5: Create Tenant — the wizard, its validation, and the row that appears

**Files:**
- Create: `app/super-admin/tenants-lifecycle-and-pilots/create/page.tsx`
- Create: `app/super-admin/tenants-lifecycle-and-pilots/create/CreateTenantWizard.tsx`

**Interfaces:**
- Consumes: `Wizard`, `Form`, the field set, `ErrorSummary`, `ConfirmDialog`, `Toaster`;
  `useRepository()`, `useAccessContext()`; the `Tenant` zod schema from `@/data/schemas/platform`.
- Produces: on completion, a real `repository.create('tenants', …)` write whose `WriteResult`
  carries the audit rows Task 6's detail page renders.

- [ ] **Step 1: Reproduce live** — the route 404s today. Screenshot.

- [ ] **Step 2: Build the wizard**

Four steps, each validating before `Next` advances, with `Back` preserving every value:

1. **Identity** — name, primary locale, regulated-industry mode.
2. **Commercial** — tier, pilot flag, and the pilot expiry date when pilot is set. The tier
   thresholds are source values (Starter below 100 Worker-Shifts, Growth 100-199, Enterprise 200+)
   — render the band the chosen tier implies, and cite the blueprint line in a comment.
3. **First administrator** — the invitation address for the first Tenant Admin. This is the row
   Task 8's acceptance screen consumes.
4. **Review** — every value, the resulting lifecycle state (`invited`, not `active` — a tenant is
   not operating until its administrator accepts), and a `ConfirmDialog` that names the fictional
   objects and the resulting simulated state without implying a real platform change.

The submit validates through the **repository's own `Tenant` schema**, never a hand-copied set of
rules, and routes its three `WriteResult` arms to three different screens: success (navigate to the
new tenant's detail page with a toast), `denied` (the permission decision's own explanation, values
retained), `persistence-unavailable` (the §12.4 capability message, values retained, the action
refused rather than half-applied).

- [ ] **Step 3: Compile-level checks** — `pnpm typecheck && pnpm lint && pnpm build`, exit 0.

- [ ] **Step 4: Live-verify**

Drive as Admin: blocked `Next` on each step with the summary focused; `Back` preserving values; a
schema-rejecting value (a negative usage figure, an empty name); the confirm dialog; the successful
create; the new tenant appearing in Task 4's list with its `invited` state; its audit row existing.
Then drive as Platform Engineer: the denial, with values retained. Then drive with persistence
unavailable (the demo chrome's failure injection) and confirm the third arm renders and nothing was
written. Screenshot each; ledger rows for each.

- [ ] **Step 5: Report** — including the audit row ids the successful write produced.

---

## Task 6: Tenant detail — the object page, its tabs, and its lifecycle actions

**Files:**
- Create: `app/super-admin/tenants-lifecycle-and-pilots/[tenantId]/page.tsx` with
  `generateStaticParams` enumerating every seeded tenant id
- Create: `app/super-admin/tenants-lifecycle-and-pilots/[tenantId]/TenantDetail.tsx`

**Interfaces:**
- Consumes: `ObjectPage`, `DetailDrawer`, `ConfirmDialog`, `Timeline`, `DataTable`, `StatusPill`,
  `FreshnessStamp`; `useRepository()`, `useAccessContext()`, `evaluateAccess`.
- Produces: the route Task 4's rows link to and Task 5's success navigates to.

- [ ] **Step 1: `generateStaticParams`**

Every tenant id in the seed, enumerated at build time. A tenant created at runtime has no static
page — so the detail route must render a deterministic "created in this session" state from the
repository for an id that exists in the store but not in the export, rather than a 404. Decide and
implement one of the two honest shapes: a catch-all page that reads the id from the store, or the
list linking runtime-created rows to a drawer instead of a route. **Take the first**; a created
tenant with no page is exactly the "silently linking nowhere" defect this build has shipped before.

- [ ] **Step 2: Build the tabs**

- **Overview** — lifecycle, tier, pilot and expiry, regulated mode, locale, usage against the tier
  band with its 80% / 100% / 125% thresholds rendered as a meter, onboarded date, legal hold.
- **People** — the tenant's users from `users`, their roles from `role-grants`, the invitation state
  of the first Tenant Admin. Worker rows show no productivity figure of any kind (master prompt
  §15.2).
- **Entitlements** — the tier's entitlements and caps, read-only at this unit's scope, with the
  platform floor distinguished from the tenant's desired value.
- **Audit** — a `Timeline` over `audit` rows for this tenant, newest first, each showing actor,
  effective role, action, result and the denial reason where there is one.

Actions, in the `PageHeader`, each `evaluateAccess`-gated with its reason rendered when refused:
`Activate` (only from `invited`, and only once the administrator has accepted — before that it is
disabled with that condition stated), and `Block` (the pre-activation refusal state). Suspension,
restoration and archival are **unit 10** and must not appear here; a reader must not meet a control
this unit cannot honour.

- [ ] **Step 3: Compile-level checks** — `pnpm typecheck && pnpm lint && pnpm build`, exit 0, and
`out/super-admin/tenants-lifecycle-and-pilots/<some-id>/index.html` exists for every seeded id.

- [ ] **Step 4: Live-verify**

Drive: each tab; the audit timeline against the collection by hand for one tenant; the usage meter
at a value below 80%, between 80 and 100, and above 125% (pick three seeded tenants that sit in
those bands, or seed them); `Activate` disabled with its condition before acceptance; the four
platform roles' different views; a deep link straight to the URL in a fresh tab reconstructing the
same state; the created-this-session tenant from Task 5 opening correctly. Screenshot each.

- [ ] **Step 5: Report.**

---

## Task 7: Console users, roles and change approvals — maker-checker, enacted

**Files:**
- Rewrite: `app/super-admin/console-users-roles-and-change-approvals/ConsoleUsersScreen.tsx`
- Modify: `src/data/collections/users.json`, `role-grants.json` — enough platform users and
  pending change requests to populate the queue

**Interfaces:**
- Consumes: `DataTable`, `Form`, `ConfirmDialog`, `DetailDrawer`, `StatusPill`, `Toaster`;
  `evaluateAccess`.
- Produces: the approvals queue Task 10's `WF-ROLE-019`/`020`/`021` tours drive.

- [ ] **Step 1: Read the current screen's facts** — 1,180 lines, 34 locators. List the facts, as in
Task 3 Step 1.

- [ ] **Step 2: Build it**

Two regions on one screen:

- **Console users** — a `DataTable` of the four platform roles' accounts: name, role, status, last
  sign-in, granted by. An `Invite console user` action, Admin-and-Root only, opening a real form
  with role selection; Platform Engineer and Support see the disabled reason.
- **Change approvals** — the maker-checker queue. Each row: what is requested, by whom, its class,
  and its age. Approve and Decline are **refused for the requester's own request** — segregation of
  duties, rendered as its own distinct reason, not as a generic denial. A critical-class request is
  Root-only; an aging one carries its re-notification state. Missing approver blocks; nothing
  auto-approves and a timeout is never an approval (master prompt §15.1).

Root Super Admin invariants are rendered as statements, never as editable controls: exactly one
Root exists, a second cannot be created, and the account is backend-created. `WF-ROLE-037`'s
refusal is reachable — attempting it produces the refusal, it is not merely described.

- [ ] **Step 3: Compile-level checks** — exit 0.

- [ ] **Step 4: Live-verify**

Drive: the invite form's validation and its denial for two roles; approve and decline on a
non-critical request; the segregation-of-duties refusal on one's own request; the critical-class
request refused for Admin and allowed for Root; the aging request's re-notify state; the
second-Root refusal. Screenshot each; ledger rows.

- [ ] **Step 5: Report.**

---

## Task 8: The first Tenant Admin's acceptance — the unit's cross-surface handoff

**Files:**
- Create: `app/hub/accept-invitation/page.tsx`
- Create: `app/hub/accept-invitation/AcceptInvitationScreen.tsx`
- Modify: `app/hub/page.tsx` if the Hub landing must show a first-run state for a just-activated
  tenant

**Interfaces:**
- Consumes: Task 1's runtime; `AppShell` with `surface="SURF-DOH"`; `Form`, `Banner`.
- Produces: the state transition Task 6's `Activate` action depends on.

- [ ] **Step 1: Reproduce live** — the route 404s. Screenshot.

- [ ] **Step 2: Build it**

The invitation the Task 5 wizard issued, accepted on the tenant's own surface: the invited address,
the tenant it belongs to, an accept action that sets credentials, and the landing in the Hub as
Tenant Admin. Also the branches: an expired invitation, an already-accepted one, and one whose
tenant was blocked between issue and acceptance — each with its own plain-language state and its
own safe next step.

Acceptance writes through the repository so the Super Admin's tenant detail page (Task 6) shows the
new state on its next read. **The handoff must be visible**: the report names the exact object and
version the Hub received, and the live drive shows the Super Admin screen changing after it.

- [ ] **Step 3: Compile-level checks** — exit 0.

- [ ] **Step 4: Live-verify the cross-surface propagation**

One continuous drive: create a tenant (Task 5) → open its detail page, `Activate` disabled with the
awaiting-acceptance condition → switch surface to the Hub → accept the invitation → return to the
Super Admin detail page → the state has moved and `Activate` is now permitted → activate → the
tenant appears `active` in Task 4's list. Screenshot at every step. This single drive is the unit's
spine and its ledger rows are the ones a reviewer reads first.

- [ ] **Step 5: Report.**

---

## Task 9: Tenant metrics and aggregates

**Files:**
- Rewrite: `app/super-admin/tenant-metrics-and-aggregates/TenantMetricsScreen.tsx`

**Interfaces:**
- Consumes: `StatTile`, `Chart`, `DataTable`, `FreshnessStamp`; `useRepository()`.
- Produces: nothing later tasks import.

- [ ] **Step 1: Read the current screen's facts** — 767 lines, 39 locators. List them.

- [ ] **Step 2: Build it**

Aggregate-only, and the support-not-surveillance rule (master prompt §15.2) is a hard constraint
here rather than a note: no worker ranking, no per-worker productivity, no raw worker identifier in
a platform-level view. Cells, lines, runs, shifts, risk, work state, quality state and freshness
are the vocabulary. Every panel carries an as-of stamp and states its completeness; unknown,
stale and partial values render as themselves and never as zero.

- [ ] **Step 3: Compile-level checks** — exit 0.

- [ ] **Step 4: Live-verify** — every panel, its table equivalent, its stale and partial states, the
four platform roles, dark mode, 360px, keyboard-only. Screenshot each. Then grep the built HTML for
any worker identifier reaching a platform aggregate view; finding one is a Critical.

- [ ] **Step 5: Report.**

---

## Task 10: The unit's guided tours

**Files:**
- Modify: `src/data/collections/tours.json`
- Modify: `src/tours/registry.ts` if the unit needs a new step action kind

**Interfaces:**
- Consumes: the tour engine from `@/tours` (Task 15 of the runway) and the `data-control-id`
  attributes every screen above shipped.
- Produces: the tours the Workflow Index rows and the `Watch how this works` affordances launch.

- [ ] **Step 1: Author the nominal tours**

One per workflow in the spec's scope list, each driving the real controls through the real
handlers: platform sign-in → dashboard → tenant list → create → detail → Hub acceptance →
activation. Narration is one or two plain-language sentences per step — **this is where the story
text that used to be on the screens now lives**, together with the source classification and the
blueprint locator for the step.

- [ ] **Step 2: Author the variant tours**

Per master prompt §9.5's risk rules, this unit's authorization and audit paths get exhaustive
applicable coverage: the denied create (Platform Engineer), the segregation-of-duties refusal, the
second-Root refusal, the expired invitation, the persistence-unavailable create, and the
tenant-suspended sign-in. Each is its own launchable tour — *"Watch what happens when the approval
is denied"*.

- [ ] **Step 3: Compile-level checks** — `node scripts/validate-collections.mjs` (every
`controlId` must resolve — the recursive dangling-reference check from runway Task 1 is what
catches a tour step pointing at a control that does not exist), then `pnpm build`.

- [ ] **Step 4: Live-verify every tour to completion**

Master prompt §10.6: a step that cannot find its target or produce its expected post-state is a
release-blocking defect, never a silent skip. Drive each tour end to end in Chrome, assert each
step's route, target and post-state, screenshot each step, and drive `Take over` at least once,
confirming control lands at the exact current state. Ledger rows per tour.

- [ ] **Step 5: Report** — the per-tour step counts and the `Take over` handoff evidence.

---

## Task 11: Locator relocation and registry reconciliation

**Files:**
- Modify: `registries/*` inputs so every fact removed from a screen is present in the registry
- Modify: `scripts/build-registries.mjs` only if a status cannot otherwise be represented
- Modify: `docs/process/audits/` — the relocation record

**Interfaces:**
- Consumes: the fact lists Tasks 3, 7 and 9 recorded in their reports.
- Produces: the registry statuses the coverage indexes render and the ledger reconciles against.

- [ ] **Step 1: Prove nothing was lost**

For every blueprint locator removed from a rebuilt screen, assert it is present in either the
traceability registry or a tour step's narration metadata. Produce the two-column table: locator,
where it now lives. A locator in neither is a Critical — that is risk 2 of the spec, and it is the
whole reason this is a task and not a step.

- [ ] **Step 2: Update census statuses**

Every workflow, function, control, feature and use case this unit demonstrated moves from
`not-represented` to `demonstrated-in-storyboard`, with its route and evidence. Statuses are
derived by `scripts/build-registries.mjs` from evidence, not hand-typed — if a row cannot be
derived as demonstrated, it is not demonstrated, and the honest move is to fix the evidence rather
than the status.

- [ ] **Step 3: Verify the §8.6.2 scan on this unit's files**

Run the locator scan across every file the unit shipped or rebuilt. Expected: zero blueprint line
locators, zero bare requirement identifiers and zero narrative paragraphs in rendered content.
Comments are exempt and required; rendered text is not.

- [ ] **Step 4: Compile-level checks** — `pnpm build && pnpm ledger:reconcile`, exit 0, and the
reconcile's uncovered count falls by exactly the number of rows this unit closed.

- [ ] **Step 5: Report** — the relocation table and the before/after census tally.

---

## Task 12: Unit closure — live verification, ledger, and fresh whole-chain verify

**Files:**
- Modify: `docs/process/ledgers/live-verification-ledger.json`
- Create: `docs/process/2026-08-28-unit-01-verification.md`
- Modify: `docs/process/RESUME.md` §8 — the position at unit 1's close

**Interfaces:**
- Consumes: every prior task's ledger rows.
- Produces: the evidence the unit is shipped and the next unit may start.

- [ ] **Step 1: Re-drive the regression set**

Per master prompt §2.3: every ledger row sharing a changed screen, component, repository method or
state machine is re-driven on the final bytes — not on the bytes it was first recorded against.
Name the set explicitly in the record; a re-drive set chosen by memory is how a regression ships.

- [ ] **Step 2: Fresh whole-chain verification**

Run: `pnpm verify`
Expected: exit 0. Read the full output and record the exit code, not a recollection of it.
Then `pnpm serve:out` and re-open the unit's spine drive one final time on the exported bytes.

- [ ] **Step 3: Seal**

Run: `node scripts/seal-manifests.mjs`. Both manifests re-seal on the committed tree, excluding
their own two outputs (the non-self-referential scope ruled in runway Task 18).

- [ ] **Step 4: Write the verification record**

`docs/process/2026-08-28-unit-01-verification.md`: the exact commands, their exit codes, the ledger
row totals, the census delta, the screenshot manifest paths, every open item, and the honest
statement of what is simulated rather than real. No completion language beyond what the evidence
carries.

- [ ] **Step 5: Update `RESUME.md` §8** with the measured position at unit 1's close, so the next
session starts from the record rather than from recollection.

---

## Self-review

**Spec coverage.** §3's eight screens map to Tasks 2-9; the §4 architecture change is Task 1; §5's
fidelity rules are the global constraints plus Task 11's scan; §6's verification is every task's
live step plus Task 12; §7's three risks map to Task 1 shipping alone (risk 1), Task 11 existing at
all (risk 2), and Task 4 Step 1's seed volume (risk 3). The spec's workflow id list is closed by
Tasks 2-8 with their tours in Task 10 and their statuses in Task 11.

**Placeholders.** None. Every step names its command, its expected result, or the exact shape to
build. Two decisions are deliberately left to the implementer with the ruling already made in the
step: Task 6 Step 1 (take the catch-all shape) and Task 4 Step 2 (do not invent a bulk action).

**Type consistency.** `ProductSessionApi`, `SignInOutcome`, `useRepository`, `useAccessContext`,
`useRepositoryQuery`, `useRuntimeReady` are declared once in Task 1 and referenced by those exact
names in Tasks 2-9. `ProductSession` is reused from `@/ui/product/AppShell` and never redeclared —
`DemoChrome` already established that convention and Task 1 inherits it.

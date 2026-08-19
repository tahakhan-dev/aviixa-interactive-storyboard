# Slice 4 — Tenant Setup (SURF-DOH) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the Delivery Operations Hub's setup half — eight modules covering tenant lifecycle, locations, shifts, workers, qualifications, users and the tenant administration area — as a browser-only static-export storyboard that demonstrates every workflow without claiming a single production capability.

**Architecture:** A shared SURF-DOH spine (tenant-state gate, scope resolution, access-condition ordering, Hub chrome, screen-state treatment) that every module consumes. One route per module under `app/hub/<slug>/`. All access decisions through the existing `evaluateAccess`; all mutation through `ScenarioCommandGateway`.

**Spec:** `docs/superpowers/specs/2026-08-19-slice-04-tenant-setup-design.md`
**Census:** `docs/census/2026-08-19-surf-doh-slice04-build-map.md`

## Global Constraints

- **No backend.** Static export. No API routes, Server Actions, middleware, databases, secrets, or mutating network calls.
- **Never claim a production capability that is only simulated.** SSO does not connect to an identity provider; End-session terminates nothing; device controls reach no device. Each renders in a seeded command state.
- **The tenant state gate is ONE DATA TABLE**, not scattered conditionals, and its contents equal the source enumerations verbatim.
- **No persisted table or fixture has a worker identifier as a grouping key for a behavioural measure.** Escalation keys on `(Area, Shift)`, never `(Worker)`.
- **The Worker role gets no Hub screen** — it renders `Unavailable` throughout, and the cost is stated on screen.
- **Three-digit `SCR-DOH-NNN` literals are forbidden anywhere.** Catalogue B (`SCR-DOH-01`…`23`) is canonical.
- **Deferred scoping (Cell, Job, worker) renders ABSENT, never disabled.** A disabled control implies a roadmap promise.
- **Prohibition renderings apply BY RULE:** ABSENT (exists for no one, **or** a rule categorically forbids this role) · DISABLED WITH A NAMED REASON (exists; this role is simply not granted it here) · CLASS BADGE (a critical-class action seen by a role that cannot approve it).
- Five tenant roles: `ROLE-TEN-ADMIN`, `ROLE-TEN-SUP`, `ROLE-TEN-QM`, `ROLE-TEN-AUD`, `ROLE-TEN-WKR`. Affordances are driven per-control, never by a module-level role list.
- TypeScript `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`. No `any`, no suppressed diagnostics. Typed failures, never thrown exceptions on expected paths.
- Closed vocabularies use `as const satisfies readonly T[]` with a real exhaustiveness check.
- Determinism: no ambient `Date.now()`, `new Date()`, `Math.random()` in `src/`.
- WCAG 2.2 AA on every route and state. One `<h1>` per route. **No dead controls** — an enabled control carries a handler, a disabled one carries a reason.

---

## Task 1: The SURF-DOH spine

**Files:**
- Create: `src/surfaces/doh/modules.ts` — the eight slice-4 modules with slugs
- Create: `src/surfaces/doh/tenant-state.ts` — the write-class table as data
- Create: `src/surfaces/doh/scope.ts` — Tenant/Site/Area, additive, narrowing only
- Create: `src/surfaces/doh/access-conditions.ts` — the nine conditions in **evaluation order**
- Create: `src/surfaces/doh/screens.ts` — catalogue B, names canonical
- Create: `src/ui/doh/HubChrome.tsx` · `BannerRegion.tsx` · `SeamNotice.tsx`
- Test: `tests/unit/doh-spine.test.ts`, `tests/component/doh-spine.test.tsx`

**Produces:** `DOH_MODULES`, `TENANT_STATES` (5), `TENANT_WRITE_CLASSES`, `DOH_SCOPES` (3), `ACCESS_CONDITIONS` (9, ordered), `DOH_SCREENS`, `HubChrome`, `SeamNotice`.

- [ ] **Step 1: Failing test — the closed sets**

```ts
it('carries five operating tenant states; pilot is a flag, not a state', () => {
  expect(TENANT_STATES).toHaveLength(5)
  expect(TENANT_STATES).not.toContain('pilot')
  expect(TENANT_STATES).not.toContain('draft')
})

it('orders the nine access conditions safety-first', () => {
  expect(ACCESS_CONDITIONS).toHaveLength(9)
  expect(ACCESS_CONDITIONS[0]).toBe('safety-controls')
  expect(ACCESS_CONDITIONS.indexOf('role-permission')).toBeLessThan(
    ACCESS_CONDITIONS.indexOf('assigned-scope'),
  )
})

it('holds exactly three scope dimensions — Cell, Job and worker are deferred', () => {
  expect(DOH_SCOPES).toEqual(['tenant', 'site', 'area'])
})
```

- [ ] **Step 2: RED.** `pnpm vitest run tests/unit/doh-spine.test.ts`
- [ ] **Step 3: Implement**, each set `as const satisfies` with an exhaustiveness check.
- [ ] **Step 4: The write-class table as DATA**

```ts
it('encodes the write classes verbatim: soft keeps recertification open', () => {
  expect(writeAllowed('soft-suspended', 'recertify-worker')).toBe(true)
  expect(writeAllowed('soft-suspended', 'create-worker')).toBe(false)
  expect(writeAllowed('soft-suspended', 'edit-configuration')).toBe(false)
})

it('applies the stricter interpretation where state cannot be determined', () => {
  expect(writeAllowed('indeterminate', 'recertify-worker')).toBe(false)
})
```

- [ ] **Step 5: `SeamNotice`** — a named cross-slice interface, never an inline stub. Renders which slice owns the missing half.
- [ ] **Step 6: GREEN, typecheck, lint. Commit.**

---

## Task 2: The Hub shell and module index

**Files:** Modify `app/hub/page.tsx`; create `app/hub/HubShell.tsx`. Test: `tests/component/doh-shell.test.tsx`.

- [ ] Index lists the eight slice-4 modules; the other eleven render as **not in this slice**, naming the slice that owns each. Routes are keyed by slug, never by screen number.
- [ ] The three-slot banner region: suspension · support session · announcement.
- [ ] The role switcher offers five tenant roles, and **Worker renders as not-a-Hub-user** with the cost stated.
- [ ] RED → GREEN → axe → commit.

---

## Tasks 3–10: The eight modules, in dependency order

Per-module contract — every screen must:

1. Wrap in `HubShell`, showing module id and `SCR-DOH-NN` as an **annotation** (never a route key).
2. Handle the applicable screen states. `STATE-10`/`STATE-11` never apply here. Connection loss splits per D7: loaded content → `STATE-08` with freshness and as-of; failed read → `STATE-12` naming what failed and whether anything was written; **every write control disabled with a named reason, never queued**; reconnect → `STATE-13`, refetching tenant state before re-enabling a write.
3. Apply the tenant state gate **before any write control renders**.
4. Drive every affordance per-control through `evaluateAccess`, showing what each of the five tenant roles sees — including when it may not act.
5. Use the three prohibition renderings by rule.
6. State that audit is in the same transaction; on an audit-write failure, say **the action did not happen**.
7. Render deferred scoping ABSENT.
8. Name every cross-slice seam with `SeamNotice`.
9. Carry the prototype disclosure.
10. Render an explicit **"unspecified in source"** panel naming each undefined affordance. **Do not invent a control.**

| Task | Module | Notes from the census |
|---|---|---|
| 3 | `MOD-DOH-01` Tenant Lifecycle and Tier | Five states. **State machine only — the Worker-Shift meter is a `SeamNotice` to slice 6.** Tier upgrade **blocked under soft suspension** (D15), banner naming the reason. `pilot` is a flag. |
| 4 | `MOD-DOH-09` pass one Permissions | Owns `OBJ-DOH-USER` — the only module creating tenant accounts. **Tenant scope only** in this pass. Two-track sign-in. Deny-by-default: an unevaluable condition is a refusal. |
| 5 | `MOD-DOH-12` SSO | `FEAT-DOH-1201` **only**. The connection record, rendered as a seeded fixture — it connects to nothing, and says so. |
| 6 | `MOD-DOH-02` Location Configuration | Site · Area · Cell (Cell ABSENT, deferred). **Site is mandatory and a default Site exists before any Tenant Admin signs in** (D25). `scope-pending`, `Unbound`, `Archiving` are flags on `active` (D21). Archival cascade → `SeamNotice` slice 6. |
| 7 | `MOD-DOH-09` pass two | Enable Site and Area scope. Scopes are additive, narrow only, and **do not merge across grants**. |
| 8 | `MOD-DOH-03` Shift Management | Shift with Site binding and **timezone inherited from Site**. Many-to-many Areas, no overlap on one Area; **cardinality otherwise deferred** (D6). Digest-time field only — **delivery is a `SeamNotice` to slice 10**. |
| 9 | `MOD-DOH-04` Worker Lifecycle and Qualifications | **The heaviest module and the surveillance-critical one.** Worker ≠ User. No self-attestation. The 14/7/1/0 expiry ladder, which may gain earlier stages, never later. Tenant Admin **may** enter a qualification and record a recertification (D9); **may not** grant a clearance — DISABLED with reason, not absent (D10). **The clearance register is read-only with no grant control** (D23). Recertification **blocked under hard suspension** (D16), with the consequence stated. Certification types are a **seeded fixture with no CRUD** (D22). Escalation keys on `(Area, Shift)`. Two of three enforcement points are `SeamNotice`s to slice 6. |
| 10 | `MOD-DOH-14` Qualification Calendar + `MOD-DOH-13` + devices | Calendar: a 60-day read-only projection; roles from the `MOD-DOH-14` matrix (D24). `MOD-DOH-13`: its three card features; Platform Access History is a **read-through view over a seeded audit fixture** with the slice-10 dependency declared (D14); banner on all three access classes, **End-session on the support session only** (D13); any signed-in tenant user may press it (D12). Devices: `SCR-DOH-DEVICES`, uncatalogued, behind the `tenantDeviceEnrolment` flag (D3); mark-lost is **a state plus a request record only** (D27). |

Each task: failing test → RED → implement → GREEN → axe → commit.

---

## Task 11: The slice gates

**Files:** Create `tests/coverage/slice-04-gates.test.ts`

Eight gates, **each proven able to fail by planting a violation on the axis the gate is for**, and **reading the built artefact wherever the claim is about what renders**:

- [ ] G1 — No three-digit `SCR-DOH-NNN` literal anywhere.
- [ ] G2 — The write-class table is one structure and equals the source enumerations verbatim.
- [ ] G3 — No worker identifier is a grouping key for a behavioural measure; escalation keys on `(Area, Shift)`.
- [ ] G4 — No Worker-role Hub screen; the switcher renders Worker as not-a-Hub-user.
- [ ] G5 — Every write control is disabled-with-a-reason under connection loss, never queued.
- [ ] G6 — Deferred scoping renders ABSENT, never disabled.
- [ ] G7 — No accepted action renders as done.
- [ ] G8 — Every cross-slice seam is a `SeamNotice`, not an inline stub.

Plus the gate-file sequence guard (gates 1..N gapless) carried from slice 3.

---

## Task 12: Slice verification

- [ ] Clean rebuild `rm -rf out .next && pnpm verify`, exit 0.
- [ ] All eight module routes in the static export, one `<h1>` each.
- [ ] axe clean on every new route and state.
- [ ] `out/` carries no blueprint filename, no absolute author path.
- [ ] Registry: the eight DOH modules move to `demonstrated-in-storyboard`; the dashboard reconciles.
- [ ] **Whole-branch review and cross-module review BEFORE merge**, not after.

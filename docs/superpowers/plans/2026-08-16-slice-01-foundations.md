# AVIIXA Interactive Storyboard — Slice 1: Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the frozen shared contracts — deterministic transition kernel, permission engine, identity simulation, route registry, five surface shells, design tokens, and atomic IndexedDB persistence — that every one of slices 2–13 depends on.

**Architecture:** A pure, framework-free transition kernel returns an immutable `ProposedTransition`. A `PersistenceCoordinator` commits the next domain snapshot plus all required audit/queue/command/notification records in one IndexedDB transaction, then publishes a `CommittedTransition`. React components read only through role-aware selectors and dispatch only through `ScenarioCommandGateway`. Five surface shells are projections over one shared `ScenarioDomainState`.

**Tech Stack:** Next.js 16.3.1 (App Router, `output: 'export'`), React 19.2.8, TypeScript 7.0.2 strict, Tailwind CSS 4.3.3, Zod 4.4.3, Vitest 4.1.10, Playwright 1.62.1, `@axe-core/playwright` 4.13.0, `fake-indexeddb` 6.2.5, pnpm 11.20.0.

**Spec:** `docs/superpowers/specs/2026-08-16-aviixa-interactive-storyboard-design.md` (sha256 `707128071d78fe58b49962aac69038328a0cb91542422f6743820e9247dcb98a`)

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the spec.

- **No runtime backend.** No API routes, Route Handlers acting as a backend, Server Actions, middleware, runtime redirects/rewrites/headers, ISR, Draft Mode, runtime cookies/headers, real auth providers, databases, secrets, or external telemetry.
- **No external-origin network request at runtime.** Only same-origin `GET`/`HEAD` reads of files present in the emitted static-export build manifest.
- **`output: 'export'` is mandatory.** Server Actions and intercepting routes throw under export — this is a feature, it enforces the no-backend boundary at build time.
- **`i18n` config THROWS under export.** English/Spanish is implemented as authored content dictionaries selected from `PresentationState`. No `next-intl`, no routing-based locales, no runtime translation. Matches `MOD-STU-17` "no runtime translation anywhere".
- **`images.unoptimized: true`.** Local assets only. The default image loader throws under export.
- **`headers`/`redirects`/`rewrites` only warn and do not take effect.** CSP and security headers are deployment-dependent, shipped as host recipes, never claimed as application-enforced.
- **Five surfaces exactly:** `SURF-SA`, `SURF-DOH`, `SURF-STU`, `SURF-CC`, `SURF-FL`. Tenant Administration is part of `SURF-DOH`, never a sixth surface.
- **Nine human security roles exactly:** platform `ROOT_SUPER_ADMIN`, `ADMIN`, `PLATFORM_ENGINEER`, `SUPPORT`; tenant `TENANT_ADMIN`, `SUPERVISOR`, `QUALITY_MANAGER`, `READONLY_AUDITOR`, `WORKER`. No Tenant Super Admin. Job Owner is an object field, not a role.
- **`DEC-PLUS-001` reading:** "and above" is an enumerated grant, never an inference from rank. "Supervisor and above" = Supervisor + Quality Manager, and excludes Tenant Admin.
- **Explicit deny wins. Scopes intersect.** Unauthorised values must be absent from the rendered DOM and accessibility tree — never hidden with CSS.
- **Audit atomicity (`MOD-DOH-17`):** a business action and its required audit record commit in one transaction. Audit failure refuses the action rather than creating unaudited success.
- **Determinism:** no ambient `Date.now()`, `new Date()`, `Math.random()`, locale-dependent ordering, or uncontrolled timers anywhere in the transition kernel. Clocks are injected.
- **No dead controls.** Every visible control navigates, mutates simulated state, opens meaningful detail, demonstrates a governed denial, or uses non-control semantics.
- **Accessibility:** WCAG 2.2 AA for every in-scope route and state.
- **Support-not-surveillance:** no worker pace timers, ranking, comparison, per-worker performance analytics, or productivity inference anywhere.
- **Source confidentiality:** the blueprint never enters `app/`, `src/`, `public/`, fixtures, generated source, source maps, screenshots, or `out/`.
- **Package manager:** pnpm. Lockfile committed. No unreviewed remote scripts or CDNs.

---

## File Structure

```
AVIIXA_Interactive_Storyboard/
  package.json                       pnpm manifest, scripts, pinned deps
  next.config.ts                     output:'export', images.unoptimized, trailingSlash
  tsconfig.json                      strict, no implicit any, noUncheckedIndexedAccess
  postcss.config.mjs                 @tailwindcss/postcss
  vitest.config.ts                   node + jsdom projects
  playwright.config.ts               runs against served ./out, never the dev server
  app/
    layout.tsx                       root layout, theme + locale bootstrap, neutral locked shell
    page.tsx                         entry: mode chooser (Guided Story / Explore / Review Evidence)
    not-found.tsx                    accessible generated 404
    globals.css                      Tailwind v4 @theme token layer
  src/
    domain/
      ids.ts                         branded ID types + constructors
      surfaces.ts                    the five SurfaceDefinition records
      roles.ts                       the nine RoleDefinition records + grants
      state.ts                       ScenarioDomainState, partitions, IdentitySimulationState,
                                     PresentationState, ReviewState
      commands.ts                    ScenarioCommand union
      transition.ts                  ProposedTransition, CommittedTransition, reason codes
      clock.ts                       injected Clock interface + fixed canonical clock
      hash.ts                        canonical serialisation + SHA-256 state hashing
    policy/
      decision.ts                    PermissionDecision union + reason codes
      evaluate.ts                    the nine-stage effective-access evaluator
    kernel/
      reduce.ts                      pure reducer: (state, command, ctx) => ProposedTransition
      handlers/                      one pure handler per command family
    persistence/
      schema.ts                      IndexedDB object stores + versioned migrations
      bootstrap.ts                   StorageBootstrapState machine
      coordinator.ts                 PersistenceCoordinator, single-transaction commit
    registry/
      types.ts                       Zod schemas for every registry record
      load.ts                        runtime-validated registry loader
    routes/
      definitions.ts                 RouteDefinition[] for all five surfaces
      manifest.ts                    generated route manifest + broken-link report
    ui/
      tokens.ts                      semantic token accessors
      primitives/                    Button, Link, Table, Dialog, Drawer, Field, StatusPill,
                                     Tabs, Breadcrumbs, Toast, LiveRegion, FocusManager
      shells/                        SuperAdminShell, HubShell, StudioShell,
                                     CommandCenterShell, FrontlineShell
    scenario/
      gateway.ts                     ScenarioCommandGateway (the only mutation entry point)
      store.ts                       client store + role-aware selectors
  registries/
    raw/                             extraction output (build-time input, not shipped)
    generated/                       validated, data-minimised registries the app imports
  tests/
    unit/                            kernel, policy, hash, clock
    component/                       primitives, shells
    e2e/                             served-out flows
    accessibility/                   axe over every route
    coverage/                        registry closure + no-network + substance gates
```

---

## Task 1: Project scaffold and static-export proof

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/not-found.tsx`, `app/globals.css`
- Test: `tests/coverage/static-export.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: a `pnpm build` that emits `out/` containing only static files; `pnpm serve:out` on port 4173.

- [ ] **Step 1: Write the failing test**

`tests/coverage/static-export.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'out')

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

describe('static export', () => {
  it('emits an out/ directory', () => {
    expect(existsSync(OUT)).toBe(true)
  })

  it('emits index.html and 404.html', () => {
    expect(existsSync(join(OUT, 'index.html'))).toBe(true)
    expect(existsSync(join(OUT, '404.html'))).toBe(true)
  })

  it('contains no server-only artifacts', () => {
    const files = walk(OUT)
    const forbidden = files.filter((f) =>
      /\/api\/|middleware|\.node$|server\.js$/.test(f),
    )
    expect(forbidden).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/coverage/static-export.test.ts`
Expected: FAIL — `out/` does not exist.

- [ ] **Step 3: Create the scaffold**

`package.json`:

```json
{
  "name": "aviixa-interactive-storyboard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "packageManager": "pnpm@11.20.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "serve:out": "serve out -p 4173 -L",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test:unit": "vitest run --project unit",
    "test:component": "vitest run --project component",
    "test:e2e": "playwright test",
    "verify": "pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:component && pnpm build && pnpm test:e2e"
  },
  "dependencies": {
    "next": "16.3.1",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.13.0",
    "@playwright/test": "1.62.1",
    "@tailwindcss/postcss": "4.3.3",
    "@testing-library/react": "16.3.2",
    "@types/node": "24.10.1",
    "@types/react": "19.2.8",
    "@types/react-dom": "19.2.8",
    "eslint": "10.8.1",
    "fake-indexeddb": "6.2.5",
    "jsdom": "27.0.1",
    "serve": "14.2.6",
    "tailwindcss": "4.3.3",
    "typescript": "7.0.2",
    "vitest": "4.1.10"
  }
}
```

`next.config.ts`:

```ts
import type { NextConfig } from 'next'

// Static export only. Server Actions, intercepting routes, middleware,
// runtime headers/redirects/rewrites, and i18n config are all incompatible
// and are deliberately absent. See spec section 5.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  typedRoutes: true,
}

export default nextConfig
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out", ".next"]
}
```

`postcss.config.mjs`:

```js
export default { plugins: { '@tailwindcss/postcss': {} } }
```

`app/globals.css`:

```css
@import "tailwindcss";

/* Clean enterprise SaaS. Light neutral base, blue primary, conventional density.
   Status colour is rationed: it never carries meaning alone. Every state also
   carries an icon and a text label. See spec section 15.7. */
@theme {
  --color-canvas: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-sunken: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-ink: #0f172a;
  --color-ink-muted: #475569;
  --color-ink-subtle: #64748b;

  --color-primary: #1d4ed8;
  --color-primary-hover: #1e40af;
  --color-primary-ink: #ffffff;

  --color-status-ok: #047857;
  --color-status-info: #0369a1;
  --color-status-attention: #b45309;
  --color-status-blocked: #b91c1c;
  --color-status-stale: #6d28d9;
  --color-status-neutral: #475569;

  --spacing-gutter: 1rem;
  --radius-control: 0.375rem;
  --radius-surface: 0.5rem;

  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
}

:root { color-scheme: light; }

html, body { height: 100%; }

body {
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-sans);
}

/* Visible, unobscured focus everywhere. WCAG 2.2 AA. */
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-control);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

`app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AVIIXA Interactive Storyboard',
  description:
    'Client-validation storyboard for the AVIIXA platform. Simulated behaviour only; no production system is connected.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-[var(--color-surface)] focus:px-4 focus:py-2 focus:shadow"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
```

`app/page.tsx`:

```tsx
export default function EntryPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">
        AVIIXA
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Interactive Storyboard</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        A client-validation walkthrough of the AVIIXA platform. Every action
        here is simulated against local fixtures. No production system is
        connected and no real data is used.
      </p>
    </main>
  )
}
```

`app/not-found.tsx`:

```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-3 text-[var(--color-ink-muted)]">
        This storyboard location does not exist. It may have been renamed, or
        the scenario state it needed was never prepared.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-[var(--color-primary)] underline"
      >
        Return to the storyboard entry page
      </Link>
    </main>
  )
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts', 'tests/coverage/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['tests/component/**/*.test.tsx'],
        },
      },
    ],
  },
})
```

- [ ] **Step 4: Install and verify the toolchain**

Run:
```bash
pnpm install
pnpm typecheck
```
Expected: install succeeds; typecheck passes with zero errors.

If `pnpm typecheck` fails with a TypeScript 7 incompatibility (unrecognised
compiler option, Next plugin failure, or a crash rather than a type error),
this is a real toolchain incompatibility and not a code defect. Record it in
`docs/process/ledgers/research-ledger.json` as a superseding row, then set
`"typescript": "6.0.3"` in `package.json`, re-run `pnpm install`, and repeat.
If 6.0.3 also fails, fall back to `"typescript": "5.9.3"`. Do not weaken
`strict`, `noUncheckedIndexedAccess`, or `exactOptionalPropertyTypes` to make
the typecheck pass.

- [ ] **Step 5: Build and run the test to verify it passes**

Run:
```bash
pnpm build
pnpm vitest run tests/coverage/static-export.test.ts
```
Expected: build succeeds and prints route output; all three tests PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml next.config.ts tsconfig.json postcss.config.mjs vitest.config.ts app tests
git commit -m "feat(slice-01): scaffold Next.js static export with token layer"
```

---

## Task 2: Branded identifiers and the five surfaces

**Files:**
- Create: `src/domain/ids.ts`, `src/domain/surfaces.ts`
- Test: `tests/unit/surfaces.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type SurfaceId = 'SURF-SA' | 'SURF-DOH' | 'SURF-STU' | 'SURF-CC' | 'SURF-FL'`
  - `const SURFACES: readonly SurfaceDefinition[]` (length 5)
  - `function surfaceById(id: SurfaceId): SurfaceDefinition`
  - branded types `TenantId`, `ScenarioRunId`, `ObjectId`, `ModuleId`, `RouteId`, `PersonaId`
  - `function brand<T>(raw: string): T` constructors: `tenantId`, `scenarioRunId`, `moduleId`, `routeId`, `personaId`

- [ ] **Step 1: Write the failing test**

`tests/unit/surfaces.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SURFACES, surfaceById, type SurfaceId } from '@/domain/surfaces'

describe('surfaces', () => {
  it('defines exactly five surfaces', () => {
    expect(SURFACES).toHaveLength(5)
  })

  it('uses the canonical identifiers', () => {
    expect(SURFACES.map((s) => s.id).sort()).toEqual([
      'SURF-CC',
      'SURF-DOH',
      'SURF-FL',
      'SURF-SA',
      'SURF-STU',
    ])
  })

  it('gives every surface a full human-readable name with no bare acronym', () => {
    for (const s of SURFACES) {
      expect(s.name.length).toBeGreaterThan(10)
      expect(s.name).not.toMatch(/^SURF-/)
    }
  })

  it('never defines Tenant Administration as a surface', () => {
    expect(SURFACES.map((s) => s.name).join(' ')).not.toMatch(
      /Tenant Administration/i,
    )
  })

  it('resolves a surface by id', () => {
    expect(surfaceById('SURF-CC' as SurfaceId).name).toBe(
      'Client Command Center',
    )
  })

  it('records the module id prefix and expected module count for each surface', () => {
    const counts = Object.fromEntries(
      SURFACES.map((s) => [s.id, s.canonicalModuleCount]),
    )
    expect(counts).toEqual({
      'SURF-SA': 19,
      'SURF-DOH': 19,
      'SURF-STU': 18,
      'SURF-CC': 13,
      'SURF-FL': 12,
    })
    const total = SURFACES.reduce((n, s) => n + s.canonicalModuleCount, 0)
    expect(total).toBe(81)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/surfaces.test.ts`
Expected: FAIL — cannot resolve `@/domain/surfaces`.

- [ ] **Step 3: Write minimal implementation**

`src/domain/ids.ts`:

```ts
declare const brandSymbol: unique symbol

type Brand<T, B extends string> = T & { readonly [brandSymbol]: B }

export type TenantId = Brand<string, 'TenantId'>
export type ScenarioRunId = Brand<string, 'ScenarioRunId'>
export type ObjectId = Brand<string, 'ObjectId'>
export type ModuleId = Brand<string, 'ModuleId'>
export type RouteId = Brand<string, 'RouteId'>
export type PersonaId = Brand<string, 'PersonaId'>
export type CorrelationId = Brand<string, 'CorrelationId'>
export type IdempotencyKey = Brand<string, 'IdempotencyKey'>

export const tenantId = (raw: string): TenantId => raw as TenantId
export const scenarioRunId = (raw: string): ScenarioRunId =>
  raw as ScenarioRunId
export const objectId = (raw: string): ObjectId => raw as ObjectId
export const moduleId = (raw: string): ModuleId => raw as ModuleId
export const routeId = (raw: string): RouteId => raw as RouteId
export const personaId = (raw: string): PersonaId => raw as PersonaId
export const correlationId = (raw: string): CorrelationId =>
  raw as CorrelationId
export const idempotencyKey = (raw: string): IdempotencyKey =>
  raw as IdempotencyKey
```

`src/domain/surfaces.ts`:

```ts
export type SurfaceId =
  | 'SURF-SA'
  | 'SURF-DOH'
  | 'SURF-STU'
  | 'SURF-CC'
  | 'SURF-FL'

export interface SurfaceDefinition {
  readonly id: SurfaceId
  /** Full human-readable name. Never a bare acronym. Spec section 20.6. */
  readonly name: string
  /** One plain-language sentence a non-specialist can follow. */
  readonly purpose: string
  /** URL segment under which this surface's routes live. */
  readonly basePath: string
  /** Prefix of the module identifiers this surface owns. */
  readonly modulePrefix: string
  /** Canonical module count from the frozen source, L1089 and AC-COV-112. */
  readonly canonicalModuleCount: number
  /** What this surface authoritatively owns. Spec section 3.3. */
  readonly ownership: string
}

export const SURFACES: readonly SurfaceDefinition[] = [
  {
    id: 'SURF-SA',
    name: 'Super Admin Platform Console',
    purpose:
      'The platform control plane. It runs the platform itself and the tenants on it, without browsing tenant operational records.',
    basePath: '/super-admin',
    modulePrefix: 'MOD-SA-',
    canonicalModuleCount: 19,
    ownership: 'Platform configuration, tenant lifecycle, and platform audit.',
  },
  {
    id: 'SURF-DOH',
    name: 'Delivery Operations Hub',
    purpose:
      'The tenant operational system of record. Jobs, Runs, assignments, summaries and qualifications live here officially.',
    basePath: '/hub',
    modulePrefix: 'MOD-DOH-',
    canonicalModuleCount: 19,
    ownership:
      'Authoritative tenant operational records and the tenant audit trail.',
  },
  {
    id: 'SURF-STU',
    name: 'Standards and Operations Studio',
    purpose:
      'Where the work is defined. Workflows, instructions, specifications and training are authored, approved and published here.',
    basePath: '/studio',
    modulePrefix: 'MOD-STU-',
    canonicalModuleCount: 18,
    ownership: 'Definition, version and work-package truth.',
  },
  {
    id: 'SURF-CC',
    name: 'Client Command Center',
    purpose:
      'The monitoring cockpit. It watches the shift and can take ten light operational actions, and it owns no record of its own.',
    basePath: '/command-center',
    modulePrefix: 'MOD-CC-',
    canonicalModuleCount: 13,
    ownership:
      'Nothing. Every action is a command against a Delivery Operations Hub record, executed through the owning service.',
  },
  {
    id: 'SURF-FL',
    name: 'Frontline Worker Application',
    purpose:
      'What the worker holds on the floor. It runs the work, captures the evidence, and keeps working when the network does not.',
    basePath: '/frontline',
    modulePrefix: 'MOD-FL-',
    canonicalModuleCount: 12,
    ownership:
      'The local origin of worker operational captures, contributed to the official record at synchronisation.',
  },
] as const

const BY_ID = new Map(SURFACES.map((s) => [s.id, s]))

export function surfaceById(id: SurfaceId): SurfaceDefinition {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown surface: ${id}`)
  return found
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/surfaces.test.ts`
Expected: all six tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/ids.ts src/domain/surfaces.ts tests/unit/surfaces.test.ts
git commit -m "feat(slice-01): branded ids and the five canonical surfaces"
```

---

## Task 3: The nine human roles and their grants

**Files:**
- Create: `src/domain/roles.ts`
- Test: `tests/unit/roles.test.ts`

**Interfaces:**
- Consumes: `SurfaceId` from `@/domain/surfaces`
- Produces:
  - `type RoleId` — nine members
  - `type SecurityDomain = 'PLATFORM' | 'TENANT'`
  - `const ROLES: readonly RoleDefinition[]` (length 9)
  - `function roleById(id: RoleId): RoleDefinition`
  - `function rolesInDomain(d: SecurityDomain): readonly RoleDefinition[]`
  - `const SUPERVISOR_AND_ABOVE: readonly RoleId[]` — the `DEC-PLUS-001` enumeration
  - `const QUALITY_MANAGER_AND_ABOVE: readonly RoleId[]`

- [ ] **Step 1: Write the failing test**

`tests/unit/roles.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  ROLES,
  roleById,
  rolesInDomain,
  SUPERVISOR_AND_ABOVE,
  QUALITY_MANAGER_AND_ABOVE,
} from '@/domain/roles'

describe('roles', () => {
  it('defines exactly nine human security roles', () => {
    expect(ROLES).toHaveLength(9)
  })

  it('splits four platform roles and five tenant roles', () => {
    expect(rolesInDomain('PLATFORM')).toHaveLength(4)
    expect(rolesInDomain('TENANT')).toHaveLength(5)
  })

  it('never defines a Tenant Super Admin', () => {
    expect(ROLES.map((r) => r.name).join(' ')).not.toMatch(
      /Tenant Super Admin/i,
    )
  })

  it('never treats Job Owner as a role', () => {
    expect(ROLES.map((r) => r.name).join(' ')).not.toMatch(/Job Owner/i)
  })

  it('never treats Plant Manager or Quality Director as a role', () => {
    const names = ROLES.map((r) => r.name).join(' ')
    expect(names).not.toMatch(/Plant Manager/i)
    expect(names).not.toMatch(/Quality Director/i)
  })

  it('marks Root Super Admin as the single backend-created account', () => {
    const root = roleById('ROOT_SUPER_ADMIN')
    expect(root.backendCreatedOnly).toBe(true)
    expect(root.maxInstances).toBe(1)
  })

  // DEC-PLUS-001: "and above" is an enumerated grant, never inferred from rank.
  it('enumerates "Supervisor and above" without Tenant Admin', () => {
    expect([...SUPERVISOR_AND_ABOVE].sort()).toEqual([
      'QUALITY_MANAGER',
      'SUPERVISOR',
    ])
    expect(SUPERVISOR_AND_ABOVE).not.toContain('TENANT_ADMIN')
  })

  it('enumerates "Quality Manager and above" as Quality Manager alone', () => {
    expect([...QUALITY_MANAGER_AND_ABOVE]).toEqual(['QUALITY_MANAGER'])
  })

  it('gives every role a plain-language purpose and a home surface', () => {
    for (const r of ROLES) {
      expect(r.purpose.length).toBeGreaterThan(20)
      expect(r.homeSurface).toBeTruthy()
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/roles.test.ts`
Expected: FAIL — cannot resolve `@/domain/roles`.

- [ ] **Step 3: Write minimal implementation**

`src/domain/roles.ts`:

```ts
import type { SurfaceId } from './surfaces'

export type SecurityDomain = 'PLATFORM' | 'TENANT'

export type RoleId =
  // Platform security domain — four fixed console roles (MOD-SA-08).
  | 'ROOT_SUPER_ADMIN'
  | 'ADMIN'
  | 'PLATFORM_ENGINEER'
  | 'SUPPORT'
  // Tenant security domain — exactly five fixed tenant roles (MOD-DOH-09).
  | 'TENANT_ADMIN'
  | 'SUPERVISOR'
  | 'QUALITY_MANAGER'
  | 'READONLY_AUDITOR'
  | 'WORKER'

export interface RoleDefinition {
  readonly id: RoleId
  /** Full human-readable name shown in the interface. */
  readonly name: string
  readonly domain: SecurityDomain
  /** One plain-language sentence: who this is and what they are here to do. */
  readonly purpose: string
  /** The surface this role lands on after signing in. */
  readonly homeSurface: SurfaceId
  /** Surfaces this role may reach at all. */
  readonly reachableSurfaces: readonly SurfaceId[]
  /** True only for the one backend-created root account. */
  readonly backendCreatedOnly: boolean
  /** null means unlimited. */
  readonly maxInstances: number | null
  /** Source locator for this role's definition. */
  readonly sourceRef: string
}

export const ROLES: readonly RoleDefinition[] = [
  {
    id: 'ROOT_SUPER_ADMIN',
    name: 'Root Super Admin',
    domain: 'PLATFORM',
    purpose:
      'The one account created behind the scenes when the platform is first stood up, held in the client’s custody.',
    homeSurface: 'SURF-SA',
    reachableSurfaces: ['SURF-SA'],
    backendCreatedOnly: true,
    maxInstances: 1,
    sourceRef: 'MOD-SA-08 / §8.8',
  },
  {
    id: 'ADMIN',
    name: 'Admin',
    domain: 'PLATFORM',
    purpose:
      'Runs the platform console day to day, under maker-checker so no single person changes something critical alone.',
    homeSurface: 'SURF-SA',
    reachableSurfaces: ['SURF-SA'],
    backendCreatedOnly: false,
    maxInstances: null,
    sourceRef: 'MOD-SA-08 / §8.8',
  },
  {
    id: 'PLATFORM_ENGINEER',
    name: 'Platform Engineer',
    domain: 'PLATFORM',
    purpose:
      'Looks after the platform’s technical health and configuration, and is held to the same maker-checker boundaries.',
    homeSurface: 'SURF-SA',
    reachableSurfaces: ['SURF-SA'],
    backendCreatedOnly: false,
    maxInstances: null,
    sourceRef: 'MOD-SA-08 / §8.8',
  },
  {
    id: 'SUPPORT',
    name: 'Support',
    domain: 'PLATFORM',
    purpose:
      'Helps tenants who raise a problem. Read-only except for the small set of support actions the source names.',
    homeSurface: 'SURF-SA',
    reachableSurfaces: ['SURF-SA'],
    backendCreatedOnly: false,
    maxInstances: null,
    sourceRef: 'MOD-SA-08, MOD-SA-15 / §8.8, §8.15',
  },
  {
    id: 'TENANT_ADMIN',
    name: 'Tenant Admin',
    domain: 'TENANT',
    purpose:
      'Sets up and runs their own factory’s workspace: sites, shifts, people, roles and settings.',
    homeSurface: 'SURF-DOH',
    reachableSurfaces: ['SURF-DOH', 'SURF-STU', 'SURF-CC'],
    backendCreatedOnly: false,
    maxInstances: null,
    sourceRef: 'MOD-DOH-09 / §3.5',
  },
  {
    id: 'SUPERVISOR',
    name: 'Supervisor',
    domain: 'TENANT',
    purpose:
      'Runs the shift. Schedules Runs, assigns qualified workers, and watches the floor while it works.',
    homeSurface: 'SURF-DOH',
    reachableSurfaces: ['SURF-DOH', 'SURF-STU', 'SURF-CC'],
    backendCreatedOnly: false,
    maxInstances: null,
    sourceRef: 'MOD-DOH-09 / §3.5',
  },
  {
    id: 'QUALITY_MANAGER',
    name: 'Quality Manager',
    domain: 'TENANT',
    purpose:
      'Owns quality decisions. The only role that can release a lot hold, including an automatic Severity 1 hold.',
    homeSurface: 'SURF-DOH',
    reachableSurfaces: ['SURF-DOH', 'SURF-STU', 'SURF-CC'],
    backendCreatedOnly: false,
    maxInstances: null,
    sourceRef: 'MOD-DOH-09, MOD-CC-13 / §3.5, §6.14.2',
  },
  {
    id: 'READONLY_AUDITOR',
    name: 'Read-only Auditor',
    domain: 'TENANT',
    purpose:
      'Checks what happened without changing anything. Reads tenant-wide records and takes no action at all.',
    homeSurface: 'SURF-DOH',
    reachableSurfaces: ['SURF-DOH'],
    backendCreatedOnly: false,
    maxInstances: null,
    sourceRef: 'MOD-DOH-09 / §3.5',
  },
  {
    id: 'WORKER',
    name: 'Worker',
    domain: 'TENANT',
    purpose:
      'Does the work on the floor, on a tablet, and records the evidence that the work was done correctly.',
    homeSurface: 'SURF-FL',
    reachableSurfaces: ['SURF-FL'],
    backendCreatedOnly: false,
    maxInstances: null,
    sourceRef: 'MOD-DOH-09, MOD-FL-A2 / §3.5, §7.4',
  },
] as const

const BY_ID = new Map(ROLES.map((r) => [r.id, r]))

export function roleById(id: RoleId): RoleDefinition {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown role: ${id}`)
  return found
}

export function rolesInDomain(
  domain: SecurityDomain,
): readonly RoleDefinition[] {
  return ROLES.filter((r) => r.domain === domain)
}

/**
 * DEC-PLUS-001. While the decision remains open this blueprint reads "and
 * above" as an enumerated grant, never an inference from a rank ordering.
 * "Supervisor and above" is the Supervisor grant and the Quality Manager
 * grant. It does NOT include Tenant Admin, who is explicitly not an in-shift
 * actor and is prohibited on all ten Command Center rows.
 */
export const SUPERVISOR_AND_ABOVE: readonly RoleId[] = [
  'SUPERVISOR',
  'QUALITY_MANAGER',
] as const

/**
 * DEC-PLUS-001. No operational tenant role sits above Quality Manager, so
 * "Quality Manager and above" is the Quality Manager grant alone.
 */
export const QUALITY_MANAGER_AND_ABOVE: readonly RoleId[] = [
  'QUALITY_MANAGER',
] as const
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/roles.test.ts`
Expected: all nine tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/roles.ts tests/unit/roles.test.ts
git commit -m "feat(slice-01): nine human roles with DEC-PLUS-001 enumeration"
```

---

## Task 4: Injected clock and canonical state hashing

**Files:**
- Create: `src/domain/clock.ts`, `src/domain/hash.ts`
- Test: `tests/unit/clock.test.ts`, `tests/unit/hash.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface Clock { now(): number; logicalTick(): number }`
  - `function fixedClock(epochMs: number): Clock`
  - `const CANONICAL_EPOCH_MS: number` — 2026-03-02T06:00:00Z
  - `function canonicalSerialize(value: unknown): string`
  - `async function sha256Hex(input: string): Promise<string>`
  - `async function hashState(value: unknown): Promise<string>`

- [ ] **Step 1: Write the failing tests**

`tests/unit/clock.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

describe('clock', () => {
  it('returns the same instant until advanced', () => {
    const c = fixedClock(CANONICAL_EPOCH_MS)
    expect(c.now()).toBe(CANONICAL_EPOCH_MS)
    expect(c.now()).toBe(CANONICAL_EPOCH_MS)
  })

  it('issues a strictly increasing logical tick', () => {
    const c = fixedClock(CANONICAL_EPOCH_MS)
    const a = c.logicalTick()
    const b = c.logicalTick()
    expect(b).toBeGreaterThan(a)
  })

  it('pins the canonical epoch so replays are reproducible', () => {
    expect(new Date(CANONICAL_EPOCH_MS).toISOString()).toBe(
      '2026-03-02T06:00:00.000Z',
    )
  })
})
```

`tests/unit/hash.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { canonicalSerialize, sha256Hex, hashState } from '@/domain/hash'

describe('canonical serialisation', () => {
  it('orders object keys so hashing is stable', () => {
    expect(canonicalSerialize({ b: 1, a: 2 })).toBe(
      canonicalSerialize({ a: 2, b: 1 }),
    )
  })

  it('preserves array order, which is meaningful', () => {
    expect(canonicalSerialize([1, 2])).not.toBe(canonicalSerialize([2, 1]))
  })

  it('distinguishes undefined from absent', () => {
    expect(canonicalSerialize({ a: undefined })).not.toBe(
      canonicalSerialize({}),
    )
  })
})

describe('hashing', () => {
  it('produces a 64-character lowercase hex digest', async () => {
    const h = await sha256Hex('aviixa')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })

  it('hashes equal states to equal digests regardless of key order', async () => {
    const a = await hashState({ x: 1, y: [1, 2] })
    const b = await hashState({ y: [1, 2], x: 1 })
    expect(a).toBe(b)
  })

  it('hashes different states to different digests', async () => {
    const a = await hashState({ x: 1 })
    const b = await hashState({ x: 2 })
    expect(a).not.toBe(b)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/clock.test.ts tests/unit/hash.test.ts`
Expected: FAIL — cannot resolve `@/domain/clock` and `@/domain/hash`.

- [ ] **Step 3: Write minimal implementation**

`src/domain/clock.ts`:

```ts
/**
 * The kernel never reads ambient time. Every timestamp it records comes from
 * an injected Clock, so an identical command sequence replays to an identical
 * state hash. Spec section 6.
 */
export interface Clock {
  /** Fictional scenario time, in milliseconds since the Unix epoch. */
  now(): number
  /** A strictly increasing sequence number for ordering within a run. */
  logicalTick(): number
  /** Advance fictional scenario time. Only the scenario engine calls this. */
  advance(ms: number): void
}

/**
 * The pinned start of the canonical story: Monday 2 March 2026, 06:00 UTC —
 * the start of the morning shift at the fictional Riverside plant.
 */
export const CANONICAL_EPOCH_MS = Date.UTC(2026, 2, 2, 6, 0, 0, 0)

export function fixedClock(epochMs: number): Clock {
  let current = epochMs
  let tick = 0
  return {
    now: () => current,
    logicalTick: () => ++tick,
    advance: (ms: number) => {
      if (ms < 0) throw new Error('Scenario time never runs backwards')
      current += ms
    },
  }
}
```

`src/domain/hash.ts`:

```ts
/**
 * Deterministic serialisation. Object keys are sorted so two structurally
 * equal states hash identically; array order is preserved because it carries
 * meaning. `undefined` is encoded distinctly from an absent key so a cleared
 * field never collides with a field that was never set.
 */
export function canonicalSerialize(value: unknown): string {
  if (value === undefined) return ' undefined'
  if (value === null) return 'null'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Non-finite number in state')
    return Object.is(value, -0) ? '0' : String(value)
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalSerialize).join(',')}]`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
    )
    return `{${entries
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalSerialize(v)}`)
      .join(',')}}`
  }
  throw new Error(`Unserialisable value of type ${typeof value}`)
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashState(value: unknown): Promise<string> {
  return sha256Hex(canonicalSerialize(value))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/clock.test.ts tests/unit/hash.test.ts`
Expected: all nine tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/clock.ts src/domain/hash.ts tests/unit/clock.test.ts tests/unit/hash.test.ts
git commit -m "feat(slice-01): injected clock and canonical state hashing"
```

---

## Task 5: The permission decision union and reason codes

**Files:**
- Create: `src/policy/decision.ts`
- Test: `tests/unit/decision.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type PermissionOutcome = 'allowed' | 'blocked' | 'hidden' | 'redacted' | 'unavailable' | 'decisionRequired'`
  - `interface PermissionDecision`
  - `function allow(stage, sourceRefs): PermissionDecision`
  - `function deny(outcome, reasonCode, explanation, opts): PermissionDecision`
  - `const REASON_CODES` — frozen record of code to default plain-language explanation
  - `function isPermitted(d: PermissionDecision): boolean`

- [ ] **Step 1: Write the failing test**

`tests/unit/decision.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  allow,
  deny,
  isPermitted,
  REASON_CODES,
  type PermissionDecision,
} from '@/policy/decision'

describe('permission decision', () => {
  it('treats only "allowed" as permitted', () => {
    expect(isPermitted(allow('BASE_ROLE', ['MOD-DOH-09']))).toBe(true)
    for (const outcome of [
      'blocked',
      'hidden',
      'redacted',
      'unavailable',
      'decisionRequired',
    ] as const) {
      const d = deny(outcome, 'ROLE_NOT_GRANTED', 'nope', {
        stage: 'BASE_ROLE',
        sourceRefs: ['MOD-DOH-09'],
      })
      expect(isPermitted(d)).toBe(false)
    }
  })

  it('carries a reason code, a plain-language explanation and source refs', () => {
    const d = deny(
      'blocked',
      'ROLE_NOT_GRANTED',
      'The Tenant Admin grant does not include in-shift operational actions.',
      { stage: 'BASE_ROLE', sourceRefs: ['MOD-CC-13', 'DEC-PLUS-001'] },
    )
    expect(d.reasonCode).toBe('ROLE_NOT_GRANTED')
    expect(d.explanation.length).toBeGreaterThan(20)
    expect(d.sourceRefs).toContain('DEC-PLUS-001')
  })

  it('records which evaluation stage produced the result', () => {
    const d = deny('blocked', 'TENANT_SUSPENDED', 'x', {
      stage: 'FEATURE_AND_SUSPENSION',
      sourceRefs: ['MOD-SA-09'],
    })
    expect(d.stage).toBe('FEATURE_AND_SUSPENSION')
  })

  it('defaults the explanation from the reason code when none is given', () => {
    const d = deny('blocked', 'MISSING_QUALIFICATION', undefined, {
      stage: 'QUALIFICATION',
      sourceRefs: ['MOD-DOH-14'],
    })
    expect(d.explanation).toBe(REASON_CODES.MISSING_QUALIFICATION)
  })

  it('gives every reason code a plain-language default explanation', () => {
    for (const [code, text] of Object.entries(REASON_CODES)) {
      expect(text.length, `${code} needs a real explanation`).toBeGreaterThan(20)
      expect(text).not.toMatch(/^[A-Z_]+$/)
    }
  })

  it('states an audit expectation on every decision', () => {
    const d: PermissionDecision = deny('blocked', 'EXPLICIT_DENY', 'x', {
      stage: 'BASE_ROLE',
      sourceRefs: ['§3.5'],
      auditExpectation: 'RECORDED_AS_REFUSAL',
    })
    expect(d.auditExpectation).toBe('RECORDED_AS_REFUSAL')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/decision.test.ts`
Expected: FAIL — cannot resolve `@/policy/decision`.

- [ ] **Step 3: Write minimal implementation**

`src/policy/decision.ts`:

```ts
/**
 * One decision union governs every route, navigation item, screen, field,
 * control, action, notification, audit view and artificial-intelligence
 * result. Spec section 3.4.
 */
export type PermissionOutcome =
  /** The actor may proceed. */
  | 'allowed'
  /** Visible, but refused, with the reason shown. */
  | 'blocked'
  /** Not rendered at all, because revealing it would itself disclose something. */
  | 'hidden'
  /** Rendered with the sensitive value masked. */
  | 'redacted'
  /** Genuinely unavailable right now — suspended, offline, or wrong object state. */
  | 'unavailable'
  /** An open client decision governs this and no honest answer exists yet. */
  | 'decisionRequired'

/** The nine ordered stages of effective-access evaluation. Spec section 3.4. */
export type EvaluationStage =
  | 'SESSION'
  | 'TENANT_ISOLATION'
  | 'BASE_ROLE'
  | 'SCOPE'
  | 'FEATURE_AND_SUSPENSION'
  | 'OBJECT_STATE'
  | 'QUALIFICATION'
  | 'DEVICE_AND_CONNECTIVITY'
  | 'SEGREGATION_OF_DUTIES'

export type AuditExpectation =
  /** The source requires this outcome to be written to the audit trail. */
  | 'RECORDED'
  /** A refusal recorded under an explicit derived-clarification policy. */
  | 'RECORDED_AS_REFUSAL'
  /** The source does not require an audit record for this outcome. */
  | 'NOT_AUDITED'

export interface PermissionDecision {
  readonly outcome: PermissionOutcome
  readonly reasonCode: ReasonCode
  /** Plain language a non-specialist can act on. Never an identifier. */
  readonly explanation: string
  readonly stage: EvaluationStage
  /** Source or decision identifiers that govern this result. */
  readonly sourceRefs: readonly string[]
  readonly auditExpectation: AuditExpectation
  /** What would have to become true for this to be allowed. */
  readonly conditionToEnable: string | null
}

export const REASON_CODES = {
  ALLOWED:
    'The current role, scope and object state all permit this action.',
  NO_ACTIVE_SESSION:
    'No one is signed in on this surface, so no action can be attributed to a person.',
  TENANT_MISMATCH:
    'This record belongs to a different tenant, and tenants are kept completely separate.',
  ROLE_NOT_GRANTED:
    'The signed-in role does not carry a grant for this action.',
  EXPLICIT_DENY:
    'An explicit denial applies to this role, and an explicit denial always wins.',
  OUT_OF_SCOPE:
    'This record sits outside the site, area or shift the signed-in person is scoped to.',
  FEATURE_DISABLED:
    'The capability is switched off for this tenant, so the action cannot run.',
  GLOBAL_FEATURE_DISABLED:
    'The platform has switched this capability off everywhere, which no tenant setting can re-enable.',
  ENTITLEMENT_MISSING:
    'The tenant’s current tier does not include this capability.',
  TENANT_SUSPENDED:
    'The tenant is suspended, so actions that create or change work are refused.',
  OBJECT_STATE_INVALID:
    'The record is not in a state where this action makes sense.',
  STALE_VERSION:
    'Someone changed this record after it was loaded, so the action was refused rather than overwrite their work.',
  MISSING_QUALIFICATION:
    'The worker does not hold a current qualification that this work requires.',
  DEVICE_UNTRUSTED:
    'This device is not currently trusted to perform the action.',
  OFFLINE_NOT_AUTHORISED:
    'This action needs a confirmed connection and cannot be completed while offline.',
  PACKAGE_INVALID:
    'The pinned work package for this run is missing, expired or fails its integrity check.',
  SEGREGATION_OF_DUTIES:
    'The same person cannot both make and approve this change.',
  APPROVER_UNAVAILABLE:
    'No authorised approver is available, and the platform never approves on a person’s behalf.',
  HARD_GATE:
    'This is a hard gate. No role, setting or override can pass it.',
  DECISION_OPEN:
    'An open client decision governs this behaviour, so the storyboard will not pretend to know the answer.',
} as const

export type ReasonCode = keyof typeof REASON_CODES

interface DenyOptions {
  readonly stage: EvaluationStage
  readonly sourceRefs: readonly string[]
  readonly auditExpectation?: AuditExpectation
  readonly conditionToEnable?: string
}

export function allow(
  stage: EvaluationStage,
  sourceRefs: readonly string[],
): PermissionDecision {
  return {
    outcome: 'allowed',
    reasonCode: 'ALLOWED',
    explanation: REASON_CODES.ALLOWED,
    stage,
    sourceRefs,
    auditExpectation: 'RECORDED',
    conditionToEnable: null,
  }
}

export function deny(
  outcome: Exclude<PermissionOutcome, 'allowed'>,
  reasonCode: ReasonCode,
  explanation: string | undefined,
  opts: DenyOptions,
): PermissionDecision {
  return {
    outcome,
    reasonCode,
    explanation: explanation ?? REASON_CODES[reasonCode],
    stage: opts.stage,
    sourceRefs: opts.sourceRefs,
    auditExpectation: opts.auditExpectation ?? 'NOT_AUDITED',
    conditionToEnable: opts.conditionToEnable ?? null,
  }
}

export function isPermitted(d: PermissionDecision): boolean {
  return d.outcome === 'allowed'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/decision.test.ts`
Expected: all six tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/policy/decision.ts tests/unit/decision.test.ts
git commit -m "feat(slice-01): permission decision union with plain-language reason codes"
```

---

## Task 6: Scenario domain state and partitioning

**Files:**
- Create: `src/domain/state.ts`
- Test: `tests/unit/state.test.ts`

**Interfaces:**
- Consumes: `TenantId`, `ScenarioRunId` from `@/domain/ids`; `RoleId` from `@/domain/roles`; `SurfaceId` from `@/domain/surfaces`
- Produces:
  - `interface ScenarioDomainState { runId; platform: PlatformPartition; tenants: Record<TenantId, TenantPartition>; ledgers: Ledgers; sequence: number }`
  - `interface IdentitySimulationState`, `interface PresentationState`, `interface ReviewState`
  - `function emptyDomainState(runId: ScenarioRunId): ScenarioDomainState`
  - `function tenantPartition(s, t): TenantPartition | undefined`
  - `function withTenant(s, t, fn): ScenarioDomainState` — pure, structural-sharing update

- [ ] **Step 1: Write the failing test**

`tests/unit/state.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { scenarioRunId, tenantId } from '@/domain/ids'
import {
  emptyDomainState,
  tenantPartition,
  withTenant,
} from '@/domain/state'

const RUN = scenarioRunId('RUN-001')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')
const OTHER = tenantId('TEN-OTHER')

describe('scenario domain state', () => {
  it('has exactly one platform partition', () => {
    const s = emptyDomainState(RUN)
    expect(s.platform).toBeDefined()
    expect(Object.keys(s.tenants)).toHaveLength(0)
  })

  it('starts its ledgers empty and append-only', () => {
    const s = emptyDomainState(RUN)
    expect(s.ledgers.audit).toEqual([])
    expect(s.ledgers.events).toEqual([])
    expect(s.ledgers.commands).toEqual([])
    expect(s.ledgers.notifications).toEqual([])
  })

  it('keeps tenant partitions isolated from one another', () => {
    let s = emptyDomainState(RUN)
    s = withTenant(s, BRIGHT, (p) => ({ ...p, displayName: 'Bright Bikes' }))
    s = withTenant(s, OTHER, (p) => ({ ...p, displayName: 'Other Co' }))
    expect(tenantPartition(s, BRIGHT)?.displayName).toBe('Bright Bikes')
    expect(tenantPartition(s, OTHER)?.displayName).toBe('Other Co')
  })

  it('never mutates the prior state when a tenant changes', () => {
    const before = emptyDomainState(RUN)
    const after = withTenant(before, BRIGHT, (p) => ({
      ...p,
      displayName: 'Bright Bikes',
    }))
    expect(before.tenants[BRIGHT]).toBeUndefined()
    expect(after.tenants[BRIGHT]?.displayName).toBe('Bright Bikes')
    expect(after).not.toBe(before)
  })

  it('leaves a sibling tenant object identical when one tenant changes', () => {
    let s = emptyDomainState(RUN)
    s = withTenant(s, BRIGHT, (p) => ({ ...p, displayName: 'Bright Bikes' }))
    s = withTenant(s, OTHER, (p) => ({ ...p, displayName: 'Other Co' }))
    const brightBefore = s.tenants[BRIGHT]
    const next = withTenant(s, OTHER, (p) => ({ ...p, displayName: 'Renamed' }))
    expect(next.tenants[BRIGHT]).toBe(brightBefore)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/state.test.ts`
Expected: FAIL — cannot resolve `@/domain/state`.

- [ ] **Step 3: Write minimal implementation**

`src/domain/state.ts`:

```ts
import type { ScenarioRunId, TenantId, ObjectId } from './ids'
import type { RoleId } from './roles'
import type { SurfaceId } from './surfaces'

/** An append-only record. Nothing in the product story ever edits one. */
export interface LedgerRecord {
  readonly id: string
  readonly sequence: number
  readonly logicalTime: number
  readonly tenant: TenantId | null
  readonly kind: string
  readonly payload: Readonly<Record<string, unknown>>
}

export interface Ledgers {
  readonly audit: readonly LedgerRecord[]
  readonly events: readonly LedgerRecord[]
  readonly commands: readonly LedgerRecord[]
  readonly notifications: readonly LedgerRecord[]
  readonly schedules: readonly LedgerRecord[]
}

/** Platform-owned truth. Written once, read by every eligible tenant view. */
export interface PlatformPartition {
  readonly featureControls: Readonly<Record<string, boolean>>
  readonly tiers: Readonly<Record<string, unknown>>
  readonly severityCatalog: readonly string[]
  /** DEC-TAX-002: the seeded catalogue ships empty. The names are owed. */
  readonly seededJobTypes: readonly string[]
  readonly seededServiceTypes: readonly string[]
  readonly objects: Readonly<Record<string, unknown>>
}

/** One factory's world. Never visible from another tenant's partition. */
export interface TenantPartition {
  readonly displayName: string
  readonly lifecycleState:
    | 'PROVISIONING'
    | 'ACTIVE'
    | 'SOFT_SUSPENDED'
    | 'HARD_SUSPENDED'
    | 'COMPLIANCE_SUSPENDED'
    | 'ARCHIVED'
  readonly desiredFeatureValues: Readonly<Record<string, boolean>>
  readonly objects: Readonly<Record<string, unknown>>
}

export interface ScenarioDomainState {
  readonly runId: ScenarioRunId
  readonly platform: PlatformPartition
  readonly tenants: Readonly<Record<string, TenantPartition>>
  readonly ledgers: Ledgers
  readonly sequence: number
}

/** Who is signed in on the simulated product, per product session. */
export interface IdentitySimulationState {
  readonly signedIn: boolean
  readonly role: RoleId | null
  readonly tenant: TenantId | null
  readonly siteScope: readonly string[]
  readonly areaScope: readonly string[]
  readonly qualifications: readonly string[]
  readonly deviceId: string | null
  readonly stepUpActive: boolean
  readonly accessSessionId: string | null
}

/** View state only. Never participates in a product hash or the audit trail. */
export interface PresentationState {
  readonly surface: SurfaceId | null
  readonly locale: 'en' | 'es'
  readonly density: 'comfortable' | 'compact'
  readonly filters: Readonly<Record<string, string>>
  readonly selection: readonly ObjectId[]
  readonly storyStepId: string | null
}

/** Client-review metadata. Separate store, separate type, separate lifecycle. */
export interface ReviewState {
  readonly workspaceId: string
  readonly reviewerLabel: string
  readonly records: readonly Readonly<Record<string, unknown>>[]
  readonly events: readonly Readonly<Record<string, unknown>>[]
}

const EMPTY_TENANT: TenantPartition = {
  displayName: '',
  lifecycleState: 'PROVISIONING',
  desiredFeatureValues: {},
  objects: {},
}

export function emptyDomainState(runId: ScenarioRunId): ScenarioDomainState {
  return {
    runId,
    platform: {
      featureControls: {},
      tiers: {},
      severityCatalog: [],
      seededJobTypes: [],
      seededServiceTypes: [],
      objects: {},
    },
    tenants: {},
    ledgers: {
      audit: [],
      events: [],
      commands: [],
      notifications: [],
      schedules: [],
    },
    sequence: 0,
  }
}

export function tenantPartition(
  state: ScenarioDomainState,
  tenant: TenantId,
): TenantPartition | undefined {
  return state.tenants[tenant]
}

/**
 * Pure structural-sharing update of exactly one tenant partition. Sibling
 * tenants keep their identical object reference, which is what the isolation
 * test asserts and what keeps selector memoisation cheap.
 */
export function withTenant(
  state: ScenarioDomainState,
  tenant: TenantId,
  fn: (partition: TenantPartition) => TenantPartition,
): ScenarioDomainState {
  const current = state.tenants[tenant] ?? EMPTY_TENANT
  return {
    ...state,
    tenants: { ...state.tenants, [tenant]: fn(current) },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/state.test.ts`
Expected: all five tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/state.ts tests/unit/state.test.ts
git commit -m "feat(slice-01): scenario domain state with platform and tenant partitions"
```

---

## Task 7: The nine-stage effective-access evaluator

**Files:**
- Create: `src/policy/evaluate.ts`
- Test: `tests/unit/evaluate.test.ts`

**Interfaces:**
- Consumes: `PermissionDecision`, `allow`, `deny` from `@/policy/decision`; `RoleId` from `@/domain/roles`; `ScenarioDomainState`, `IdentitySimulationState` from `@/domain/state`
- Produces:
  - `interface AccessRequest { action: string; allowedRoles: readonly RoleId[]; deniedRoles?: readonly RoleId[]; requiredFeature?: string; requiredQualifications?: readonly string[]; requiresOnline?: boolean; makerCheckerOf?: string | null; objectState?: string; allowedObjectStates?: readonly string[]; sourceRefs: readonly string[] }`
  - `interface AccessContext { state: ScenarioDomainState; identity: IdentitySimulationState; online: boolean; deviceTrusted: boolean; actorOfRecord?: string | null }`
  - `function evaluateAccess(req: AccessRequest, ctx: AccessContext): PermissionDecision`

- [ ] **Step 1: Write the failing test**

`tests/unit/evaluate.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { emptyDomainState, withTenant, type IdentitySimulationState } from '@/domain/state'
import { evaluateAccess, type AccessRequest, type AccessContext } from '@/policy/evaluate'

const RUN = scenarioRunId('RUN-001')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')

function activeTenantState() {
  return withTenant(emptyDomainState(RUN), BRIGHT, (p) => ({
    ...p,
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
  }))
}

function identity(
  over: Partial<IdentitySimulationState> = {},
): IdentitySimulationState {
  return {
    signedIn: true,
    role: 'QUALITY_MANAGER',
    tenant: BRIGHT,
    siteScope: ['SITE-RIVERSIDE'],
    areaScope: ['AREA-ASSEMBLY'],
    qualifications: ['QUAL-TORQUE'],
    deviceId: null,
    stepUpActive: false,
    accessSessionId: null,
    ...over,
  }
}

function ctx(over: Partial<AccessContext> = {}): AccessContext {
  return {
    state: activeTenantState(),
    identity: identity(),
    online: true,
    deviceTrusted: true,
    actorOfRecord: null,
    ...over,
  }
}

const releaseHold: AccessRequest = {
  action: 'CC_RELEASE_LOT_HOLD',
  allowedRoles: ['QUALITY_MANAGER'],
  sourceRefs: ['MOD-CC-13 action 4'],
}

describe('effective access evaluation', () => {
  it('allows an authorised role in scope on an active tenant', () => {
    expect(evaluateAccess(releaseHold, ctx()).outcome).toBe('allowed')
  })

  it('refuses when nobody is signed in, before any other stage', () => {
    const d = evaluateAccess(releaseHold, ctx({ identity: identity({ signedIn: false }) }))
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('SESSION')
  })

  it('refuses a record belonging to another tenant', () => {
    const d = evaluateAccess(
      { ...releaseHold, },
      ctx({ identity: identity({ tenant: tenantId('TEN-OTHER') }) }),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('TENANT_ISOLATION')
  })

  // MOD-CC-13: Supervisor may request a hold release with a note, never perform it.
  it('refuses a Supervisor releasing a lot hold', () => {
    const d = evaluateAccess(releaseHold, ctx({ identity: identity({ role: 'SUPERVISOR' }) }))
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('BASE_ROLE')
    expect(d.reasonCode).toBe('ROLE_NOT_GRANTED')
  })

  it('lets an explicit deny beat an allow', () => {
    const d = evaluateAccess(
      { ...releaseHold, allowedRoles: ['QUALITY_MANAGER'], deniedRoles: ['QUALITY_MANAGER'] },
      ctx(),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.reasonCode).toBe('EXPLICIT_DENY')
  })

  it('refuses when the tenant is suspended', () => {
    const suspended = withTenant(activeTenantState(), BRIGHT, (p) => ({
      ...p,
      lifecycleState: 'HARD_SUSPENDED' as const,
    }))
    const d = evaluateAccess(releaseHold, ctx({ state: suspended }))
    expect(d.outcome).toBe('unavailable')
    expect(d.stage).toBe('FEATURE_AND_SUSPENSION')
  })

  it('lets a global feature disable beat a tenant desired enable', () => {
    let s = activeTenantState()
    s = { ...s, platform: { ...s.platform, featureControls: { AI_COACHING: false } } }
    s = withTenant(s, BRIGHT, (p) => ({ ...p, desiredFeatureValues: { AI_COACHING: true } }))
    const d = evaluateAccess(
      { ...releaseHold, requiredFeature: 'AI_COACHING' },
      ctx({ state: s }),
    )
    expect(d.outcome).toBe('unavailable')
    expect(d.reasonCode).toBe('GLOBAL_FEATURE_DISABLED')
  })

  it('refuses a worker missing a required qualification', () => {
    const d = evaluateAccess(
      { ...releaseHold, allowedRoles: ['WORKER'], requiredQualifications: ['QUAL-WELD'] },
      ctx({ identity: identity({ role: 'WORKER', qualifications: [] }) }),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('QUALIFICATION')
  })

  it('refuses an online-only action while offline', () => {
    const d = evaluateAccess({ ...releaseHold, requiresOnline: true }, ctx({ online: false }))
    expect(d.outcome).toBe('unavailable')
    expect(d.stage).toBe('DEVICE_AND_CONNECTIVITY')
  })

  it('refuses the same person approving their own change', () => {
    const d = evaluateAccess(
      { ...releaseHold, makerCheckerOf: 'PERSON-A' },
      ctx({ actorOfRecord: 'PERSON-A' }),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('SEGREGATION_OF_DUTIES')
  })

  it('refuses an action whose object is in the wrong state', () => {
    const d = evaluateAccess(
      { ...releaseHold, objectState: 'RELEASED', allowedObjectStates: ['HELD'] },
      ctx(),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('OBJECT_STATE')
  })

  it('evaluates stages in order, reporting the earliest failure', () => {
    // Signed out AND wrong role AND offline. SESSION must win.
    const d = evaluateAccess(
      { ...releaseHold, requiresOnline: true },
      ctx({ identity: identity({ signedIn: false, role: 'WORKER' }), online: false }),
    )
    expect(d.stage).toBe('SESSION')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/evaluate.test.ts`
Expected: FAIL — cannot resolve `@/policy/evaluate`.

- [ ] **Step 3: Write minimal implementation**

`src/policy/evaluate.ts`:

```ts
import type { RoleId } from '@/domain/roles'
import type {
  IdentitySimulationState,
  ScenarioDomainState,
} from '@/domain/state'
import { allow, deny, type PermissionDecision } from './decision'

export interface AccessRequest {
  readonly action: string
  readonly allowedRoles: readonly RoleId[]
  readonly deniedRoles?: readonly RoleId[]
  readonly requiredSites?: readonly string[]
  readonly requiredAreas?: readonly string[]
  readonly requiredFeature?: string
  readonly requiredQualifications?: readonly string[]
  readonly requiresOnline?: boolean
  readonly requiresTrustedDevice?: boolean
  /** When set, the actor who made the change being approved. */
  readonly makerCheckerOf?: string | null
  readonly objectState?: string
  readonly allowedObjectStates?: readonly string[]
  /** Set when an open client decision governs this behaviour. */
  readonly openDecision?: string
  readonly sourceRefs: readonly string[]
}

export interface AccessContext {
  readonly state: ScenarioDomainState
  readonly identity: IdentitySimulationState
  readonly online: boolean
  readonly deviceTrusted: boolean
  /** The signed-in person's stable id, for segregation of duties. */
  readonly actorOfRecord?: string | null
}

const SUSPENDED_STATES = new Set([
  'SOFT_SUSPENDED',
  'HARD_SUSPENDED',
  'COMPLIANCE_SUSPENDED',
])

/**
 * The nine stages run in a fixed order and the earliest failure wins, so a
 * denial never leaks information from a later stage. Explicit deny beats
 * allow. Scopes intersect. Spec section 3.4.
 */
export function evaluateAccess(
  req: AccessRequest,
  ctx: AccessContext,
): PermissionDecision {
  const { identity, state } = ctx
  const refs = req.sourceRefs

  // 1. Authenticated simulated identity and active session.
  if (!identity.signedIn || identity.role === null) {
    return deny('blocked', 'NO_ACTIVE_SESSION', undefined, {
      stage: 'SESSION',
      sourceRefs: refs,
      conditionToEnable: 'Sign in on this surface.',
    })
  }
  const role = identity.role

  // 2. Tenant isolation. A tenant role must be inside a known tenant.
  if (identity.tenant !== null && state.tenants[identity.tenant] === undefined) {
    return deny('blocked', 'TENANT_MISMATCH', undefined, {
      stage: 'TENANT_ISOLATION',
      sourceRefs: refs,
      auditExpectation: 'RECORDED_AS_REFUSAL',
    })
  }

  // 3. Base-role union, with explicit deny winning.
  if (req.deniedRoles?.includes(role)) {
    return deny('blocked', 'EXPLICIT_DENY', undefined, {
      stage: 'BASE_ROLE',
      sourceRefs: refs,
      auditExpectation: 'RECORDED_AS_REFUSAL',
    })
  }
  if (!req.allowedRoles.includes(role)) {
    return deny('blocked', 'ROLE_NOT_GRANTED', undefined, {
      stage: 'BASE_ROLE',
      sourceRefs: refs,
    })
  }

  // 4. Scope intersection.
  if (
    req.requiredSites?.length &&
    !req.requiredSites.some((s) => identity.siteScope.includes(s))
  ) {
    return deny('blocked', 'OUT_OF_SCOPE', undefined, {
      stage: 'SCOPE',
      sourceRefs: refs,
    })
  }
  if (
    req.requiredAreas?.length &&
    !req.requiredAreas.some((a) => identity.areaScope.includes(a))
  ) {
    return deny('blocked', 'OUT_OF_SCOPE', undefined, {
      stage: 'SCOPE',
      sourceRefs: refs,
    })
  }

  // 5. Feature enablement, platform floor, tenant effective value, suspension.
  const partition = identity.tenant ? state.tenants[identity.tenant] : undefined
  if (partition && SUSPENDED_STATES.has(partition.lifecycleState)) {
    return deny('unavailable', 'TENANT_SUSPENDED', undefined, {
      stage: 'FEATURE_AND_SUSPENSION',
      sourceRefs: refs,
      conditionToEnable: 'The tenant suspension must be released.',
    })
  }
  if (req.requiredFeature) {
    const globalValue = state.platform.featureControls[req.requiredFeature]
    if (globalValue === false) {
      // A global disable is an effective ceiling. A tenant desired value
      // can never re-enable it.
      return deny('unavailable', 'GLOBAL_FEATURE_DISABLED', undefined, {
        stage: 'FEATURE_AND_SUSPENSION',
        sourceRefs: refs,
      })
    }
    const desired = partition?.desiredFeatureValues[req.requiredFeature]
    if (globalValue === undefined && desired !== true) {
      return deny('unavailable', 'FEATURE_DISABLED', undefined, {
        stage: 'FEATURE_AND_SUSPENSION',
        sourceRefs: refs,
      })
    }
    if (desired === false) {
      return deny('unavailable', 'FEATURE_DISABLED', undefined, {
        stage: 'FEATURE_AND_SUSPENSION',
        sourceRefs: refs,
      })
    }
  }

  // 6. Object lifecycle and version state.
  if (
    req.allowedObjectStates?.length &&
    req.objectState !== undefined &&
    !req.allowedObjectStates.includes(req.objectState)
  ) {
    return deny('blocked', 'OBJECT_STATE_INVALID', undefined, {
      stage: 'OBJECT_STATE',
      sourceRefs: refs,
      conditionToEnable: `The record must be in one of: ${req.allowedObjectStates.join(', ')}.`,
    })
  }

  // 7. Worker qualification and assignment.
  if (req.requiredQualifications?.length) {
    const missing = req.requiredQualifications.filter(
      (q) => !identity.qualifications.includes(q),
    )
    if (missing.length > 0) {
      return deny('blocked', 'MISSING_QUALIFICATION', undefined, {
        stage: 'QUALIFICATION',
        sourceRefs: refs,
        conditionToEnable: `A current qualification is needed: ${missing.join(', ')}.`,
      })
    }
  }

  // 8. Device trust, connectivity, package, offline authorisation.
  if (req.requiresTrustedDevice && !ctx.deviceTrusted) {
    return deny('unavailable', 'DEVICE_UNTRUSTED', undefined, {
      stage: 'DEVICE_AND_CONNECTIVITY',
      sourceRefs: refs,
    })
  }
  if (req.requiresOnline && !ctx.online) {
    return deny('unavailable', 'OFFLINE_NOT_AUTHORISED', undefined, {
      stage: 'DEVICE_AND_CONNECTIVITY',
      sourceRefs: refs,
      conditionToEnable: 'Reconnect to complete this action.',
    })
  }

  // 9. Segregation of duties, maker-checker, human-decision gate.
  if (
    req.makerCheckerOf != null &&
    ctx.actorOfRecord != null &&
    req.makerCheckerOf === ctx.actorOfRecord
  ) {
    return deny('blocked', 'SEGREGATION_OF_DUTIES', undefined, {
      stage: 'SEGREGATION_OF_DUTIES',
      sourceRefs: refs,
      auditExpectation: 'RECORDED_AS_REFUSAL',
      conditionToEnable: 'A different authorised person must approve this.',
    })
  }

  if (req.openDecision) {
    return deny('decisionRequired', 'DECISION_OPEN', undefined, {
      stage: 'SEGREGATION_OF_DUTIES',
      sourceRefs: [...refs, req.openDecision],
    })
  }

  return allow('SEGREGATION_OF_DUTIES', refs)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/evaluate.test.ts`
Expected: all twelve tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/policy/evaluate.ts tests/unit/evaluate.test.ts
git commit -m "feat(slice-01): nine-stage effective-access evaluator"
```

---

## Task 8: Commands, transitions and the pure kernel

**Files:**
- Create: `src/domain/commands.ts`, `src/domain/transition.ts`, `src/kernel/reduce.ts`
- Test: `tests/unit/reduce.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–7
- Produces:
  - `type ScenarioCommand` — discriminated union keyed on `type`
  - `interface ProposedTransition { status; decision; nextState; events; audit; commands; notifications; priorStateHash; nextStateHash; correlationId; affectedSurfaces; ... }`
  - `function reduce(state, command, ctx): Promise<ProposedTransition>`

- [ ] **Step 1: Write the failing test**

`tests/unit/reduce.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { scenarioRunId, tenantId, correlationId } from '@/domain/ids'
import { emptyDomainState, withTenant } from '@/domain/state'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'
import { reduce } from '@/kernel/reduce'
import type { ScenarioCommand } from '@/domain/commands'
import type { TransitionContext } from '@/domain/transition'

const RUN = scenarioRunId('RUN-001')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')

function baseState() {
  return withTenant(emptyDomainState(RUN), BRIGHT, (p) => ({
    ...p,
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
  }))
}

function context(role: 'QUALITY_MANAGER' | 'SUPERVISOR'): TransitionContext {
  return {
    clock: fixedClock(CANONICAL_EPOCH_MS),
    identity: {
      signedIn: true,
      role,
      tenant: BRIGHT,
      siteScope: ['SITE-RIVERSIDE'],
      areaScope: ['AREA-ASSEMBLY'],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'PERSON-QM',
    correlationId: correlationId('COR-1'),
    failureInjection: null,
  }
}

const releaseHold: ScenarioCommand = {
  type: 'CC_RELEASE_LOT_HOLD',
  tenant: BRIGHT,
  lotId: 'LOT-2201',
  note: 'Containment complete, deviation dispositioned.',
}

describe('transition kernel', () => {
  it('accepts an authorised command and returns a next state', async () => {
    const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(t.status).toBe('accepted')
    expect(t.nextState).not.toBe(null)
  })

  // MOD-CC-13 action 4: Quality Manager only.
  it('denies a Supervisor releasing a lot hold and leaves state untouched', async () => {
    const before = baseState()
    const t = await reduce(before, releaseHold, context('SUPERVISOR'))
    expect(t.status).toBe('denied')
    expect(t.decision.reasonCode).toBe('ROLE_NOT_GRANTED')
    expect(t.nextState).toBe(null)
  })

  it('never throws on an illegal transition', async () => {
    const t = await reduce(
      baseState(),
      { type: 'CC_RELEASE_LOT_HOLD', tenant: BRIGHT, lotId: '', note: '' },
      context('QUALITY_MANAGER'),
    )
    expect(['denied', 'validationFailed']).toContain(t.status)
  })

  // MOD-DOH-17: the audit record is part of the same transition as the action.
  it('emits an audit record with every accepted command', async () => {
    const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(t.audit).toHaveLength(1)
    expect(t.audit[0]?.kind).toBe('CC_RELEASE_LOT_HOLD')
  })

  it('records a refusal in the audit trail for a governed denial', async () => {
    const t = await reduce(baseState(), releaseHold, context('SUPERVISOR'))
    expect(t.status).toBe('denied')
    expect(t.audit.length + Number(t.decision.auditExpectation === 'NOT_AUDITED')).toBeGreaterThan(0)
  })

  it('carries prior and next state hashes on an accepted transition', async () => {
    const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(t.priorStateHash).toMatch(/^[0-9a-f]{64}$/)
    expect(t.nextStateHash).toMatch(/^[0-9a-f]{64}$/)
    expect(t.priorStateHash).not.toBe(t.nextStateHash)
  })

  it('names every affected surface', async () => {
    const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(t.affectedSurfaces).toContain('SURF-DOH')
    expect(t.affectedSurfaces).toContain('SURF-CC')
    expect(t.affectedSurfaces).toContain('SURF-FL')
  })

  it('replays deterministically to the same hash', async () => {
    const a = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    const b = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(a.nextStateHash).toBe(b.nextStateHash)
  })

  it('never mutates the state it was given', async () => {
    const before = baseState()
    const snapshot = JSON.stringify(before)
    await reduce(before, releaseHold, context('QUALITY_MANAGER'))
    expect(JSON.stringify(before)).toBe(snapshot)
  })

  it('gives every result a plain-language explanation', async () => {
    const t = await reduce(baseState(), releaseHold, context('SUPERVISOR'))
    expect(t.decision.explanation.length).toBeGreaterThan(20)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/reduce.test.ts`
Expected: FAIL — cannot resolve `@/domain/commands`.

- [ ] **Step 3: Write minimal implementation**

`src/domain/commands.ts`:

```ts
import type { TenantId } from './ids'

/**
 * Every product action is a typed command. Slices 2 to 13 extend this union;
 * the shape of a member never changes once a later slice depends on it.
 */
export type ScenarioCommand =
  | {
      readonly type: 'CC_RELEASE_LOT_HOLD'
      readonly tenant: TenantId
      readonly lotId: string
      readonly note: string
    }
  | {
      readonly type: 'PLATFORM_SET_FEATURE_CONTROL'
      readonly feature: string
      readonly enabled: boolean
    }
  | {
      readonly type: 'TENANT_SET_DESIRED_FEATURE'
      readonly tenant: TenantId
      readonly feature: string
      readonly enabled: boolean
    }

export type CommandType = ScenarioCommand['type']
```

`src/domain/transition.ts`:

```ts
import type { Clock } from './clock'
import type { CorrelationId } from './ids'
import type {
  IdentitySimulationState,
  LedgerRecord,
  ScenarioDomainState,
} from './state'
import type { SurfaceId } from './surfaces'
import type { PermissionDecision } from '@/policy/decision'

export type TransitionStatus =
  | 'accepted'
  | 'denied'
  | 'blocked'
  | 'validationFailed'
  | 'decisionRequired'
  | 'noOp'

export interface TransitionContext {
  readonly clock: Clock
  readonly identity: IdentitySimulationState
  readonly online: boolean
  readonly deviceTrusted: boolean
  readonly actorOfRecord: string | null
  readonly correlationId: CorrelationId
  /** An active simulated failure, or null. Always labelled in the interface. */
  readonly failureInjection: string | null
}

/**
 * What the pure kernel returns. It is a PROPOSAL: it is not visible product
 * truth until the PersistenceCoordinator commits it in one transaction.
 * Spec section 5.4.
 */
export interface ProposedTransition {
  readonly status: TransitionStatus
  readonly decision: PermissionDecision
  /** null on every outcome except 'accepted'. */
  readonly nextState: ScenarioDomainState | null
  readonly priorStateHash: string
  readonly nextStateHash: string
  readonly events: readonly LedgerRecord[]
  readonly audit: readonly LedgerRecord[]
  readonly commands: readonly LedgerRecord[]
  readonly notifications: readonly LedgerRecord[]
  readonly schedules: readonly LedgerRecord[]
  readonly affectedSurfaces: readonly SurfaceId[]
  readonly correlationId: CorrelationId
  readonly logicalTime: number
  readonly sequence: number
  readonly firstFallback: string | null
  readonly terminalSafeState: string | null
}

export interface CommittedTransition extends ProposedTransition {
  readonly committed: true
  readonly committedState: ScenarioDomainState
}
```

`src/kernel/reduce.ts`:

```ts
import type { ScenarioCommand } from '@/domain/commands'
import { hashState } from '@/domain/hash'
import type { LedgerRecord, ScenarioDomainState } from '@/domain/state'
import { withTenant } from '@/domain/state'
import type {
  ProposedTransition,
  TransitionContext,
} from '@/domain/transition'
import { deny, type PermissionDecision } from '@/policy/decision'
import { evaluateAccess, type AccessRequest } from '@/policy/evaluate'
import type { SurfaceId } from '@/domain/surfaces'

/** Which access rule and which surfaces each command family carries. */
interface CommandSpec {
  readonly access: Omit<AccessRequest, 'action'>
  readonly affectedSurfaces: readonly SurfaceId[]
  readonly firstFallback: string | null
  readonly terminalSafeState: string | null
}

const SPECS: Record<ScenarioCommand['type'], CommandSpec> = {
  // MOD-CC-13 action 4. Quality Manager only; a Supervisor may request with
  // a note but never perform the release.
  CC_RELEASE_LOT_HOLD: {
    access: {
      allowedRoles: ['QUALITY_MANAGER'],
      sourceRefs: ['MOD-CC-13 action 4', '§6.14.2', 'DEC-PLUS-001'],
    },
    affectedSurfaces: ['SURF-DOH', 'SURF-CC', 'SURF-FL'],
    firstFallback:
      'If the release cannot be recorded, the hold stands and the lot stays contained.',
    terminalSafeState: 'The lot remains held and no work resumes on it.',
  },
  PLATFORM_SET_FEATURE_CONTROL: {
    access: {
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
      sourceRefs: ['MOD-SA-07', '§8.7'],
    },
    affectedSurfaces: ['SURF-SA', 'SURF-DOH', 'SURF-STU', 'SURF-CC', 'SURF-FL'],
    firstFallback: 'The previous effective value stays in force everywhere.',
    terminalSafeState: 'No tenant sees a partially applied feature change.',
  },
  TENANT_SET_DESIRED_FEATURE: {
    access: {
      allowedRoles: ['TENANT_ADMIN'],
      sourceRefs: ['MOD-DOH-01', '§4.1'],
    },
    affectedSurfaces: ['SURF-DOH', 'SURF-CC', 'SURF-FL'],
    firstFallback: 'The tenant keeps its previous desired value.',
    terminalSafeState: 'The platform effective value is unchanged.',
  },
}

function record(
  kind: string,
  seq: number,
  logicalTime: number,
  tenant: LedgerRecord['tenant'],
  payload: Record<string, unknown>,
): LedgerRecord {
  return {
    id: `${kind}-${seq}`,
    sequence: seq,
    logicalTime,
    tenant,
    kind,
    payload,
  }
}

function refuse(
  decision: PermissionDecision,
  priorHash: string,
  ctx: TransitionContext,
  spec: CommandSpec,
  status: ProposedTransition['status'],
  audit: readonly LedgerRecord[],
): ProposedTransition {
  return {
    status,
    decision,
    nextState: null,
    priorStateHash: priorHash,
    nextStateHash: priorHash,
    events: [],
    audit,
    commands: [],
    notifications: [],
    schedules: [],
    affectedSurfaces: spec.affectedSurfaces,
    correlationId: ctx.correlationId,
    logicalTime: ctx.clock.now(),
    sequence: 0,
    firstFallback: spec.firstFallback,
    terminalSafeState: spec.terminalSafeState,
  }
}

export async function reduce(
  state: ScenarioDomainState,
  command: ScenarioCommand,
  ctx: TransitionContext,
): Promise<ProposedTransition> {
  const spec = SPECS[command.type]
  const priorHash = await hashState(state)
  const logicalTime = ctx.clock.now()
  const seq = state.sequence + 1

  const decision = evaluateAccess(
    { action: command.type, ...spec.access },
    {
      state,
      identity: ctx.identity,
      online: ctx.online,
      deviceTrusted: ctx.deviceTrusted,
      actorOfRecord: ctx.actorOfRecord,
    },
  )

  if (decision.outcome !== 'allowed') {
    const audit =
      decision.auditExpectation === 'NOT_AUDITED'
        ? []
        : [
            record(`${command.type}_REFUSED`, seq, logicalTime, ctx.identity.tenant, {
              reasonCode: decision.reasonCode,
              stage: decision.stage,
            }),
          ]
    const status =
      decision.outcome === 'decisionRequired' ? 'decisionRequired' : 'denied'
    return refuse(decision, priorHash, ctx, spec, status, audit)
  }

  // Validation runs after authorisation so a denial never leaks field detail.
  const invalid = validate(command)
  if (invalid) {
    return refuse(
      deny('blocked', 'OBJECT_STATE_INVALID', invalid, {
        stage: 'OBJECT_STATE',
        sourceRefs: spec.access.sourceRefs,
      }),
      priorHash,
      ctx,
      spec,
      'validationFailed',
      [],
    )
  }

  const nextState = apply(state, command, seq)
  const nextHash = await hashState(nextState)

  return {
    status: 'accepted',
    decision,
    nextState,
    priorStateHash: priorHash,
    nextStateHash: nextHash,
    events: [record(command.type, seq, logicalTime, ctx.identity.tenant, { ...command })],
    audit: [record(command.type, seq, logicalTime, ctx.identity.tenant, { ...command })],
    commands: [],
    notifications: [],
    schedules: [],
    affectedSurfaces: spec.affectedSurfaces,
    correlationId: ctx.correlationId,
    logicalTime,
    sequence: seq,
    firstFallback: spec.firstFallback,
    terminalSafeState: spec.terminalSafeState,
  }
}

function validate(command: ScenarioCommand): string | null {
  switch (command.type) {
    case 'CC_RELEASE_LOT_HOLD':
      if (command.lotId.trim() === '') {
        return 'A lot must be named before a hold on it can be released.'
      }
      if (command.note.trim() === '') {
        return 'A release note is required so the reason is on the record.'
      }
      return null
    case 'PLATFORM_SET_FEATURE_CONTROL':
      return command.feature.trim() === '' ? 'A feature must be named.' : null
    case 'TENANT_SET_DESIRED_FEATURE':
      return command.feature.trim() === '' ? 'A feature must be named.' : null
  }
}

function apply(
  state: ScenarioDomainState,
  command: ScenarioCommand,
  seq: number,
): ScenarioDomainState {
  const bumped = { ...state, sequence: seq }
  switch (command.type) {
    case 'CC_RELEASE_LOT_HOLD':
      return withTenant(bumped, command.tenant, (p) => ({
        ...p,
        objects: {
          ...p.objects,
          [`lot:${command.lotId}`]: { held: false, releaseNote: command.note },
        },
      }))
    case 'PLATFORM_SET_FEATURE_CONTROL':
      return {
        ...bumped,
        platform: {
          ...bumped.platform,
          featureControls: {
            ...bumped.platform.featureControls,
            [command.feature]: command.enabled,
          },
        },
      }
    case 'TENANT_SET_DESIRED_FEATURE':
      return withTenant(bumped, command.tenant, (p) => ({
        ...p,
        desiredFeatureValues: {
          ...p.desiredFeatureValues,
          [command.feature]: command.enabled,
        },
      }))
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/reduce.test.ts`
Expected: all ten tests PASS.

- [ ] **Step 5: Run the full unit suite for regressions**

Run: `pnpm test:unit`
Expected: every test from Tasks 2–8 PASSES.

- [ ] **Step 6: Commit**

```bash
git add src/domain/commands.ts src/domain/transition.ts src/kernel/reduce.ts tests/unit/reduce.test.ts
git commit -m "feat(slice-01): pure transition kernel with audit atomicity"
```

---

## Task 9: Route registry and the five surface base routes

**Files:**
- Create: `src/routes/definitions.ts`, `app/super-admin/page.tsx`, `app/hub/page.tsx`, `app/studio/page.tsx`, `app/command-center/page.tsx`, `app/frontline/page.tsx`
- Test: `tests/unit/routes.test.ts`, `tests/e2e/routes.spec.ts`

**Interfaces:**
- Consumes: `SurfaceId`, `SURFACES`; `RoleId`, `ROLES`
- Produces:
  - `interface RouteDefinition { id; pathname; surface; title; heading; allowedRoles; sourceRefs; ... }`
  - `const ROUTES: readonly RouteDefinition[]`
  - `function routesForRole(role: RoleId): readonly RouteDefinition[]`
  - `function routeByPathname(p: string): RouteDefinition | undefined`

- [ ] **Step 1: Write the failing test**

`tests/unit/routes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { ROUTES, routesForRole, routeByPathname } from '@/routes/definitions'
import { SURFACES } from '@/domain/surfaces'
import { ROLES } from '@/domain/roles'

describe('route registry', () => {
  it('gives every surface at least one route', () => {
    for (const s of SURFACES) {
      expect(ROUTES.some((r) => r.surface === s.id), s.id).toBe(true)
    }
  })

  it('uses unique route ids and unique pathnames', () => {
    expect(new Set(ROUTES.map((r) => r.id)).size).toBe(ROUTES.length)
    expect(new Set(ROUTES.map((r) => r.pathname)).size).toBe(ROUTES.length)
  })

  it('gives every route a title, one heading, and source refs', () => {
    for (const r of ROUTES) {
      expect(r.title.length, r.id).toBeGreaterThan(3)
      expect(r.heading.length, r.id).toBeGreaterThan(3)
      expect(r.sourceRefs.length, r.id).toBeGreaterThan(0)
    }
  })

  it('grants every route to at least one of the nine roles', () => {
    for (const r of ROUTES) {
      expect(r.allowedRoles.length, r.id).toBeGreaterThan(0)
    }
  })

  it('gives every role at least one reachable route', () => {
    for (const role of ROLES) {
      expect(routesForRole(role.id).length, role.id).toBeGreaterThan(0)
    }
  })

  // Read-only Auditor reaches the Hub only. MOD-CC-13 note 4, DEC-AUDSTU-001.
  it('keeps the Read-only Auditor out of the Command Center and Frontline', () => {
    const surfaces = new Set(routesForRole('READONLY_AUDITOR').map((r) => r.surface))
    expect(surfaces.has('SURF-CC')).toBe(false)
    expect(surfaces.has('SURF-FL')).toBe(false)
  })

  // MOD-FL-A2: the Worker's home is the Frontline application.
  it('keeps the Worker on the Frontline surface', () => {
    const surfaces = new Set(routesForRole('WORKER').map((r) => r.surface))
    expect([...surfaces]).toEqual(['SURF-FL'])
  })

  it('resolves a route by pathname', () => {
    expect(routeByPathname('/command-center')?.surface).toBe('SURF-CC')
  })

  it('uses no bare acronym as a route title', () => {
    for (const r of ROUTES) {
      expect(r.title, r.id).not.toMatch(/^(SURF|MOD|DOH|STU|CC|FL|SA)-/)
    }
  })
})
```

`tests/e2e/routes.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

const SURFACE_ROUTES = [
  { path: '/super-admin/', heading: 'Super Admin Platform Console' },
  { path: '/hub/', heading: 'Delivery Operations Hub' },
  { path: '/studio/', heading: 'Standards and Operations Studio' },
  { path: '/command-center/', heading: 'Client Command Center' },
  { path: '/frontline/', heading: 'Frontline Worker Application' },
]

for (const { path, heading } of SURFACE_ROUTES) {
  test(`${path} renders from the static export with one primary heading`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
  })
}

test('an unknown route renders the accessible not-found page', async ({ page }) => {
  await page.goto('/no-such-place/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found')
})

test('no request leaves the origin after load', async ({ page }) => {
  const foreign: string[] = []
  page.on('request', (req) => {
    const url = new URL(req.url())
    if (url.origin !== 'http://localhost:4173') foreign.push(req.url())
  })
  await page.goto('/hub/')
  await page.waitForLoadState('networkidle')
  expect(foreign).toEqual([])
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/routes.test.ts`
Expected: FAIL — cannot resolve `@/routes/definitions`.

- [ ] **Step 3: Write the route registry**

`src/routes/definitions.ts`:

```ts
import type { RoleId } from '@/domain/roles'
import { SURFACES, type SurfaceId } from '@/domain/surfaces'

export interface RouteDefinition {
  readonly id: string
  readonly pathname: string
  readonly surface: SurfaceId
  /** Browser tab title. Never a bare identifier. */
  readonly title: string
  /** The one primary heading rendered on the page. */
  readonly heading: string
  /** One plain-language sentence describing why this page exists. */
  readonly purpose: string
  readonly allowedRoles: readonly RoleId[]
  readonly sourceRefs: readonly string[]
}

const PLATFORM_ROLES: readonly RoleId[] = [
  'ROOT_SUPER_ADMIN',
  'ADMIN',
  'PLATFORM_ENGINEER',
  'SUPPORT',
]

export const ROUTES: readonly RouteDefinition[] = SURFACES.map((s) => {
  const allowedRoles: readonly RoleId[] =
    s.id === 'SURF-SA'
      ? PLATFORM_ROLES
      : s.id === 'SURF-FL'
        ? (['WORKER'] as const)
        : s.id === 'SURF-CC'
          ? (['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'] as const)
          : s.id === 'SURF-STU'
            ? (['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'] as const)
            : ([
                'TENANT_ADMIN',
                'SUPERVISOR',
                'QUALITY_MANAGER',
                'READONLY_AUDITOR',
              ] as const)

  return {
    id: `ROUTE-${s.id}-HOME`,
    pathname: s.basePath,
    surface: s.id,
    title: s.name,
    heading: s.name,
    purpose: s.purpose,
    allowedRoles,
    sourceRefs: [s.id, 'L1089'],
  }
})

const BY_PATH = new Map(ROUTES.map((r) => [r.pathname, r]))

export function routeByPathname(pathname: string): RouteDefinition | undefined {
  return BY_PATH.get(pathname.replace(/\/$/, '') || '/')
}

export function routesForRole(role: RoleId): readonly RouteDefinition[] {
  return ROUTES.filter((r) => r.allowedRoles.includes(role))
}
```

- [ ] **Step 4: Write the five surface pages**

Each page file follows this exact shape, substituting the surface. `app/hub/page.tsx`:

```tsx
import { surfaceById } from '@/domain/surfaces'

const SURFACE = surfaceById('SURF-DOH')

export default function HubHome() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">
        AVIIXA
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{SURFACE.name}</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        {SURFACE.purpose}
      </p>
      <p className="mt-6 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation
        storyboard, not a connected production system.
      </p>
    </main>
  )
}
```

Create the same file for `app/super-admin/page.tsx` (`'SURF-SA'`),
`app/studio/page.tsx` (`'SURF-STU'`), `app/command-center/page.tsx`
(`'SURF-CC'`), and `app/frontline/page.tsx` (`'SURF-FL'`), changing only the
surface id passed to `surfaceById` and the exported component name
(`SuperAdminHome`, `StudioHome`, `CommandCenterHome`, `FrontlineHome`).

- [ ] **Step 5: Write the Playwright config**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

// Tests run against the SERVED STATIC EXPORT, never the dev server.
// Spec section 5.1 and master prompt section 4.2.
export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'accessibility/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm serve:out',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
```

- [ ] **Step 6: Run all tests to verify they pass**

Run:
```bash
pnpm vitest run tests/unit/routes.test.ts
pnpm build
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
```
Expected: nine unit tests PASS; seven Playwright tests PASS, including the
no-foreign-request assertion.

- [ ] **Step 7: Commit**

```bash
git add src/routes app playwright.config.ts tests/unit/routes.test.ts tests/e2e/routes.spec.ts
git commit -m "feat(slice-01): route registry, five surface routes, served-export e2e"
```

---

## Task 10: Accessibility gate over every route

**Files:**
- Create: `tests/accessibility/axe.spec.ts`
- Test: itself

**Interfaces:**
- Consumes: `ROUTES` from `@/routes/definitions`
- Produces: a gate that fails the build on any WCAG 2.2 A/AA violation.

- [ ] **Step 1: Write the failing test**

`tests/accessibility/axe.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PATHS = [
  '/',
  '/super-admin/',
  '/hub/',
  '/studio/',
  '/command-center/',
  '/frontline/',
]

for (const path of PATHS) {
  test(`${path} has no WCAG 2.2 A or AA violation`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test(`${path} exposes exactly one level-1 heading`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  })

  test(`${path} reaches a skip link with the first Tab press`, async ({ page }) => {
    await page.goto(path)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
  })
}
```

- [ ] **Step 2: Run tests to verify they fail or pass honestly**

Run: `pnpm build && pnpm test:e2e`
Expected: eighteen tests run. Any violation reported here is a real defect —
fix the markup, never the assertion, and never lower the tag list.

- [ ] **Step 3: Fix any reported violation in the markup**

Common first failures and their correct fixes: a missing `<main>` landmark
(add `id="main"` to the `main` element, already present in the page template);
insufficient contrast on `--color-ink-subtle` against `--color-canvas` (darken
the token, do not suppress the rule); a skip link that is not the first
focusable element (move it to be the first child of `body`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:e2e`
Expected: all eighteen accessibility tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/accessibility/axe.spec.ts app src
git commit -m "test(slice-01): WCAG 2.2 AA gate over every slice-1 route"
```

---

## Task 11: Prohibited-pattern and source-confidentiality release scan

**Files:**
- Create: `tests/coverage/prohibited-patterns.test.ts`
- Test: itself

**Interfaces:**
- Consumes: the built `out/` directory and the `src/` and `app/` trees
- Produces: a gate proving no backend feature, no external origin, and no leaked source.

- [ ] **Step 1: Write the failing test**

`tests/coverage/prohibited-patterns.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

const SOURCE_FILES = [...walk('src'), ...walk('app')].filter((f) =>
  /\.(ts|tsx|css)$/.test(f),
)

describe('no runtime backend', () => {
  it('declares no Server Action', () => {
    const offenders = SOURCE_FILES.filter((f) =>
      /['"]use server['"]/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('ships no API route or middleware', () => {
    expect(existsSync(join('app', 'api'))).toBe(false)
    expect(existsSync('middleware.ts')).toBe(false)
  })

  it('calls no network API from application source', () => {
    const banned = /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/
    const offenders = SOURCE_FILES.filter((f) => banned.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('references no external origin', () => {
    const offenders = SOURCE_FILES.filter((f) =>
      /https?:\/\/(?!localhost)/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('uses no dangerouslySetInnerHTML', () => {
    const offenders = SOURCE_FILES.filter((f) =>
      /dangerouslySetInnerHTML/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders).toEqual([])
  })
})

describe('source confidentiality', () => {
  const shipped = walk('out')

  it('leaks no blueprint filename into the release artifact', () => {
    const offenders = shipped.filter((f) =>
      readFileSync(f, 'utf8').includes('AVIIXA_Production_Product_Blueprint'),
    )
    expect(offenders).toEqual([])
  })

  it('leaks no absolute author path into the release artifact', () => {
    const offenders = shipped.filter((f) => /\/Users\/[a-z]+\//i.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it runs**

Run: `pnpm build && pnpm vitest run tests/coverage/prohibited-patterns.test.ts`
Expected: seven tests. Any failure is a real defect — remove the offending
pattern, never relax the regex.

- [ ] **Step 3: Fix any offender**

If `fetch(` is reported inside application source, the code is reaching the
network and must be replaced with a local fixture read. If an external origin
is reported, inline the asset. If a blueprint filename is reported in `out/`,
remove the reference and re-run the build.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/coverage/prohibited-patterns.test.ts`
Expected: all seven tests PASS.

- [ ] **Step 5: Run the complete verification chain**

Run: `pnpm verify`
Expected: typecheck, lint, unit, component, build and e2e all pass, in that
order, with exit code 0.

- [ ] **Step 6: Commit**

```bash
git add tests/coverage/prohibited-patterns.test.ts
git commit -m "test(slice-01): no-backend, no-network and source-confidentiality gates"
```

---

## Slice 1 exit criteria

All of the following must hold before Slice 2 begins:

- [ ] `pnpm verify` exits 0.
- [ ] `out/` builds and serves; all five surface routes render from the static export.
- [ ] Zero WCAG 2.2 A/AA violations on every slice-1 route.
- [ ] Zero foreign-origin requests after load.
- [ ] Kernel replay is deterministic: identical command sequences produce identical state hashes.
- [ ] A Supervisor is refused a lot-hold release, with `ROLE_NOT_GRANTED` and an unchanged state.
- [ ] A global feature disable beats a tenant desired enable.
- [ ] Tenant partitions are isolated and structurally shared.
- [ ] An independent reviewer has reviewed the slice diff and every Critical and Important finding is resolved.

## Self-review record

**Spec coverage.** Spec section 2 (source facts) is encoded in Tasks 2, 3 and
8. Section 3.1 (dependency direction) in Task 8. Section 3.2 (partitioning) in
Task 6. Section 3.4 (nine-stage access) in Task 7. Section 3.5 (transition
contract) in Task 8. Section 5.1–5.2 (static export) in Task 1. Section 5.5
(no-network proof) in Tasks 9 and 11. Section 5.6 (confidentiality) in Task 11.
Section 6 (determinism) in Tasks 4 and 8. Section 7 (technology) in Task 1.
Section 8 (visual direction) in Task 1's token layer. Section 9
(accessibility) in Task 10.

**Deferred to later slices, by design, and tracked:** persistence and the
storage bootstrap machine (Slice 2), review mode (Slice 2), registry loading
from the extraction output (Slice 2), the design-system primitive library
(Slice 2), and all 81 module screens (Slices 3–13). Slice 1's `src/persistence`
and `src/ui/primitives` directories appear in the file structure above so
their boundaries are fixed now, but no task in this plan creates them.

**Placeholder scan.** No TBD, TODO, "handle edge cases", or "similar to Task N"
appears. Every code step carries runnable code.

**Type consistency.** `PermissionDecision` is produced by `allow`/`deny` in
Task 5 and consumed unchanged by `evaluateAccess` in Task 7 and `reduce` in
Task 8. `ScenarioDomainState` is produced by `emptyDomainState`/`withTenant` in
Task 6 and consumed by Tasks 7 and 8. `EvaluationStage` values used in Task 7's
tests match the union declared in Task 5. `AccessRequest` in Task 7 is
consumed by Task 8 via `Omit<AccessRequest, 'action'>`.

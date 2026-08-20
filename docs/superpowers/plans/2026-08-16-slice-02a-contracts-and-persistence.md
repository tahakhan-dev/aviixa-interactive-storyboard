# Slice 2a — Contracts, Primitives and Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Amend the permission contract to the source's closed set of nine, add the thirteen-screen-state contract, build the design-system primitives that express them, and add runtime-validated registry loading plus IndexedDB persistence with an atomic single-transaction commit.

**Architecture:** `PermissionDecision` becomes a discriminated union so a reasonless `notApplicable` cannot be constructed. `ScreenStateBoundary` carries the thirteen-state contract once, and screens override only where they genuinely differ — the source's own mechanism. A `PersistenceCoordinator` commits the domain snapshot and every required ledger record in one IndexedDB transaction, publishing only after the transaction completes.

**Tech Stack:** Next.js 16.3.1 (`output: 'export'`), React 19.2.8, TypeScript 5.9.3 strict, Tailwind 4.3.3, Zod 4.4.3, Vitest 4.1.10, Playwright 1.62.1, `fake-indexeddb` 6.2.5, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-16-slice-02a-contracts-and-persistence-design.md` (sha256 `37aacd0ff2df738ba4e8089e14c7b479252ba78262957fc7597e49f9e8374c04`)

**Branch:** `slice-02a-contracts`, based on `main` at `98193c7`.

## Global Constraints

Every task's requirements implicitly include this section.

- **No runtime backend.** No API routes, Route Handlers, Server Actions, middleware, runtime headers/redirects/rewrites, databases, secrets, or external telemetry.
- **No external-origin network request at runtime.** Only same-origin `GET`/`HEAD` reads of files in the emitted static-export manifest.
- **`output: 'export'`.** Server Actions and intercepting routes throw under export — that is the no-backend boundary enforcing itself.
- **TypeScript 5.9.3** with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` all ON. **Never weaken them to make code compile.**
- **Determinism.** No ambient `Date.now()`, `new Date()`, `Math.random()`, locale-dependent ordering, or uncontrolled timers in `src/`. Time comes only from the injected `Clock`.
- **`canonicalSerialize` throws** on non-plain objects (Date/Map/Set/RegExp/class instances) and non-finite numbers. Everything reachable from `ScenarioDomainState` must be plain data.
- **The kernel never throws.** An internal failure returns a typed denial, never a rejected promise.
- **Permission-matrix cells:** the status set is CLOSED AT NINE and **a blank cell fails the build**.
- **`STATE-07` Offline:** only the Frontline Worker Application has a true offline state. No other surface may render one.
- **`STATE-02` Loading never renders a zero** — a count that has not arrived is a placeholder, not `0`.
- **`STATE-09` Queued** shows the true command state, never "applied" or "complete". The words `synced`, `sent` and `done` are forbidden as state names anywhere in the product.
- **Status colour is never load-bearing alone.** Every state carries an icon and a text label as well as a colour.
- **Enforcement rule (frozen source, §25):** *"taking a button off the screen does not stop anyone."* A component may never compute its own permission — the decision comes from `evaluateAccess`.
- **Audit atomicity** is one of six enforced platform invariants locked with no off position for any account including root: *"an action that cannot be audited does not happen."*
- **Data classes are closed at seven** and every persisted field belongs to exactly one: operational records · configuration · evidence media · audit · telemetry · memory · personal data. **Memory has no export path at V1.**
- **WCAG 2.2 Level AA** on every route and state.
- **No dead controls.** Every visible control acts, navigates, explains a governed denial, or uses non-control semantics.
- **Every gate must be proven able to fail** by planting a violation, confirming the failure, and reverting. A gate nobody proved can fail is not a gate.

## Shared primitive contract

Tasks 3, 4 and 5 each build primitives. Every primitive they produce must satisfy all of this:

1. **Accessible name.** No primitive renders an interactive element without one. A test asserts it.
2. **Disabled means explained.** A disabled control carries `aria-disabled="true"` and an accessible description giving the reason. A bare `disabled` with no reason fails review.
3. **Colour is never alone.** Any primitive expressing status takes both an icon and a text label. `StatusPill` cannot be constructed without both — enforce at the type level.
4. **Keyboard.** Every interactive primitive is reachable and operable by keyboard, with visible focus. Overlays trap focus, close on `Escape`, and restore focus to their invoker.
5. **States.** Each primitive declares which of `default | hover | focus | active | selected | disabled | loading | invalid | warning | stale | offline | queued | pending | conflict | failed | fallback | safeStop | recovered | success` it supports, and renders each one distinguishably.
6. **No policy.** A primitive never computes a permission. It receives a `PermissionDecision` or a plain prop and renders it.
7. **Tests.** Component tests in `tests/component/`, jsdom, Testing Library. Every declared state rendered and asserted; keyboard path asserted; accessible name asserted.

---

## File Structure

```
src/
  policy/
    decision.ts          MODIFY  nine-outcome discriminated union + FieldTreatment
    evaluate.ts          MODIFY  return the new outcomes
  ui/
    screen-state.ts      CREATE  the thirteen STATE-01..13 definitions
    primitives/
      Button.tsx         CREATE
      StatusPill.tsx     CREATE
      Banner.tsx         CREATE
      SkeletonBlock.tsx  CREATE
      EmptyState.tsx     CREATE
      FreshnessLabel.tsx CREATE
      PermissionNotice.tsx CREATE
      Field.tsx          CREATE
      Select.tsx         CREATE
      Checkbox.tsx       CREATE
      Table.tsx          CREATE
      Dialog.tsx         CREATE
      Drawer.tsx         CREATE
      Tabs.tsx           CREATE
      Breadcrumbs.tsx    CREATE
      Toast.tsx          CREATE
      LiveRegion.tsx     CREATE
      index.ts           CREATE  barrel
    ScreenStateBoundary.tsx CREATE  renders the default treatment per screen state
  registry/
    schemas.ts           CREATE  Zod schemas, unknown fields rejected
    load.ts              CREATE  runtime-validated loader
  persistence/
    schema.ts            CREATE  IndexedDB object stores + versioned migrations
    bootstrap.ts         CREATE  StorageBootstrapState machine
    coordinator.ts       CREATE  PersistenceCoordinator, single-transaction commit
    capability.ts        CREATE  PersistenceCapability action matrix
tests/
  unit/          decision, screen-state, registry, persistence
  component/     every primitive, ScreenStateBoundary
  coverage/      blank-cell gate, no-duplicate-policy gate
```

---

## Task 1: Permission outcome amendment — nine, closed

**Files:**
- Modify: `src/policy/decision.ts`
- Modify: `src/policy/evaluate.ts` (outcome renames only)
- Modify: `src/kernel/reduce.ts` (outcome renames only)
- Test: `tests/unit/decision.test.ts` (extend)

**Interfaces:**
- Consumes: nothing new
- Produces:
  - `type PermissionOutcome` — exactly nine members
  - `type FieldTreatment = 'visible' | 'redacted' | 'hidden'`
  - `type PermissionDecision` — discriminated union; the `notApplicable` variant **requires** `notApplicableReason: string`
  - `function permitsAction(d): boolean` · `function permitsRead(d): boolean` · `function isRefusal(d): boolean`
  - `function notApplicable(reason, opts): PermissionDecision`
  - `allow`, `deny` keep their existing signatures except `deny`'s outcome parameter now excludes `'notApplicable'`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/decision.test.ts`:

```ts
import {
  allow, deny, notApplicable, permitsAction, permitsRead, isRefusal,
  type PermissionOutcome, type FieldTreatment, type PermissionDecision,
} from '@/policy/decision'

describe('nine-outcome permission model', () => {
  const NINE: readonly PermissionOutcome[] = [
    'allowed', 'allowedWithConditions', 'readOnly', 'cachedReadOnlyOffline',
    'queuedOffline', 'unavailable', 'explicitlyProhibited',
    'clientDecisionRequired', 'notApplicable',
  ]

  it('permits an action for exactly allowed, allowedWithConditions and queuedOffline', () => {
    const permitting = NINE.filter((o) => {
      const d = o === 'notApplicable'
        ? notApplicable('devices are not published', { stage: 'BASE_ROLE', sourceRefs: ['x'] })
        : o === 'allowed'
          ? allow('BASE_ROLE', ['x'])
          : deny(o, 'ROLE_NOT_GRANTED', undefined, { stage: 'BASE_ROLE', sourceRefs: ['x'] })
      return permitsAction(d)
    })
    expect(permitting.sort()).toEqual(
      ['allowed', 'allowedWithConditions', 'queuedOffline'].sort(),
    )
  })

  it('permits a read additionally for readOnly and cachedReadOnlyOffline', () => {
    for (const o of ['readOnly', 'cachedReadOnlyOffline'] as const) {
      const d = deny(o, 'ROLE_NOT_GRANTED', undefined, { stage: 'BASE_ROLE', sourceRefs: ['x'] })
      expect(permitsRead(d), o).toBe(true)
      expect(permitsAction(d), o).toBe(false)
    }
  })

  it('treats the four refusal outcomes as refusals', () => {
    for (const o of ['unavailable', 'explicitlyProhibited', 'clientDecisionRequired'] as const) {
      expect(isRefusal(deny(o, 'ROLE_NOT_GRANTED', undefined, { stage: 'BASE_ROLE', sourceRefs: ['x'] })), o).toBe(true)
    }
    expect(isRefusal(notApplicable('r', { stage: 'BASE_ROLE', sourceRefs: ['x'] }))).toBe(true)
  })

  it('requires a reason on notApplicable and exposes it', () => {
    const d = notApplicable('devices are not published', {
      stage: 'BASE_ROLE', sourceRefs: ['§8.13'],
    })
    expect(d.outcome).toBe('notApplicable')
    if (d.outcome === 'notApplicable') {
      expect(d.notApplicableReason).toBe('devices are not published')
    }
  })

  it('does not carry hidden or redacted as permission outcomes', () => {
    expect(NINE).not.toContain('hidden' as PermissionOutcome)
    expect(NINE).not.toContain('redacted' as PermissionOutcome)
  })

  it('offers field treatment as a separate three-value concept', () => {
    const treatments: readonly FieldTreatment[] = ['visible', 'redacted', 'hidden']
    expect(treatments).toHaveLength(3)
  })

  it('gives every outcome a plain-language explanation, never a bare identifier', () => {
    for (const o of NINE) {
      const d: PermissionDecision = o === 'notApplicable'
        ? notApplicable('a stated reason that is long enough to be useful', { stage: 'BASE_ROLE', sourceRefs: ['x'] })
        : o === 'allowed'
          ? allow('BASE_ROLE', ['x'])
          : deny(o, 'ROLE_NOT_GRANTED', undefined, { stage: 'BASE_ROLE', sourceRefs: ['x'] })
      expect(d.explanation.length, o).toBeGreaterThan(20)
      expect(d.explanation, o).not.toMatch(/^[A-Z_]+$/)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/decision.test.ts`
Expected: FAIL — `notApplicable`, `permitsAction`, `permitsRead`, `isRefusal` are not exported, and the new outcome names do not exist.

- [ ] **Step 3: Write the implementation**

In `src/policy/decision.ts`, replace the `PermissionOutcome` union and `PermissionDecision` interface with:

```ts
/**
 * Frozen source, L10238: "Every cell in every permission matrix carries an
 * explicit status from the closed set ... Blank cells are prohibited, because a
 * blank cell is an unanswered question that an implementer will answer privately
 * and inconsistently."
 *
 * CLOSED AT NINE. Adding a tenth is a scope decision, never a drift.
 */
export type PermissionOutcome =
  /** The actor may proceed. */
  | 'allowed'
  /** Permitted, but a stated condition applies and must be surfaced. */
  | 'allowedWithConditions'
  /** Visible and unchangeable, with the cause named. */
  | 'readOnly'
  /** A cached copy is readable; its age and origin must be shown. */
  | 'cachedReadOnlyOffline'
  /** Accepted locally, takes effect later. Renders in its TRUE command state. */
  | 'queuedOffline'
  /** Genuinely unavailable now — suspension, connectivity, or object state. */
  | 'unavailable'
  /** The source explicitly prohibits this actor. Audited as a refusal. */
  | 'explicitlyProhibited'
  /** An open client decision governs this; the storyboard will not guess. */
  | 'clientDecisionRequired'
  /** Does not apply here. Carries a REQUIRED stated reason. */
  | 'notApplicable'

/**
 * How a FIELD renders. Deliberately separate from PermissionOutcome: a field can
 * be redacted on a screen the actor is fully allowed to use. Conflating the two
 * is what made the earlier six-member union ambiguous.
 */
export type FieldTreatment = 'visible' | 'redacted' | 'hidden'

interface PermissionDecisionBase {
  readonly reasonCode: ReasonCode
  /** Plain language a non-specialist can act on. Never an identifier. */
  readonly explanation: string
  readonly stage: EvaluationStage
  readonly sourceRefs: readonly string[]
  readonly auditExpectation: AuditExpectation
  readonly conditionToEnable: string | null
}

/**
 * A discriminated union, so a reasonless `notApplicable` cannot be constructed.
 * `notApplicableReason?: never` on the other arm makes the compiler reject
 * supplying one where it is meaningless.
 */
export type PermissionDecision =
  | (PermissionDecisionBase & {
      readonly outcome: Exclude<PermissionOutcome, 'notApplicable'>
      readonly notApplicableReason?: never
    })
  | (PermissionDecisionBase & {
      readonly outcome: 'notApplicable'
      readonly notApplicableReason: string
    })

const ACTION_OUTCOMES = new Set<PermissionOutcome>([
  'allowed',
  'allowedWithConditions',
  // Accepted locally; effect is deferred, but the action was not refused.
  'queuedOffline',
])

const READ_OUTCOMES = new Set<PermissionOutcome>([
  'allowed',
  'allowedWithConditions',
  'queuedOffline',
  'readOnly',
  'cachedReadOnlyOffline',
])

export function permitsAction(d: PermissionDecision): boolean {
  return ACTION_OUTCOMES.has(d.outcome)
}

export function permitsRead(d: PermissionDecision): boolean {
  return READ_OUTCOMES.has(d.outcome)
}

export function isRefusal(d: PermissionDecision): boolean {
  return !READ_OUTCOMES.has(d.outcome)
}

export function notApplicable(
  reason: string,
  opts: { stage: EvaluationStage; sourceRefs: readonly string[] },
): PermissionDecision {
  if (reason.trim() === '') {
    throw new Error('notApplicable requires a stated reason')
  }
  return {
    outcome: 'notApplicable',
    notApplicableReason: reason,
    reasonCode: 'NOT_APPLICABLE',
    explanation: `This does not apply here: ${reason}.`,
    stage: opts.stage,
    sourceRefs: opts.sourceRefs,
    auditExpectation: 'NOT_AUDITED',
    conditionToEnable: null,
  }
}
```

Add these entries to `REASON_CODES`:

```ts
  NOT_APPLICABLE:
    'This capability does not apply in this situation, for the reason stated.',
  CONDITIONS_APPLY:
    'You may proceed, but a condition applies and is stated alongside the action.',
  READ_ONLY_RECORD:
    'This record can be read but not changed right now, and the cause is named.',
  CACHED_WHILE_OFFLINE:
    'This is a stored copy read while offline, and its age and origin are shown.',
  QUEUED_WHILE_OFFLINE:
    'The action was accepted on this device and will take effect when it reaches the server.',
  FEATURE_NOT_REGISTERED:
    'The platform has never registered this capability, so it is off everywhere.',
```

Change `deny`'s first parameter type to
`Exclude<PermissionOutcome, 'allowed' | 'notApplicable'>` so `notApplicable` must
go through its own constructor.

Then rename across `evaluate.ts` and `reduce.ts`: every `'blocked'` becomes
`'explicitlyProhibited'`, and every `'decisionRequired'` becomes
`'clientDecisionRequired'`. Replace `isPermitted` call sites with `permitsAction`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:unit`
Expected: the seven new decision tests PASS and every pre-existing test still passes.

- [ ] **Step 5: Commit**

```bash
git add src/policy/decision.ts src/policy/evaluate.ts src/kernel/reduce.ts tests/unit/decision.test.ts
git commit -m "feat(slice-02a): permission outcomes closed at the source's nine"
```

---

## Task 2: The thirteen screen states

**Files:**
- Create: `src/ui/screen-state.ts`
- Test: `tests/unit/screen-state.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type ScreenStateId` — `'STATE-01'` … `'STATE-13'`
  - `const SCREEN_STATES: readonly ScreenStateDefinition[]` (length 13)
  - `function screenState(id): ScreenStateDefinition`
  - `const FRONTLINE_ONLY_STATES: readonly ScreenStateId[]` — `['STATE-07']`

- [ ] **Step 1: Write the failing test**

`tests/unit/screen-state.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  SCREEN_STATES, screenState, FRONTLINE_ONLY_STATES, type ScreenStateId,
} from '@/ui/screen-state'

describe('the thirteen screen states', () => {
  it('defines exactly thirteen', () => {
    expect(SCREEN_STATES).toHaveLength(13)
  })

  it('numbers them STATE-01 through STATE-13 with no gaps', () => {
    expect(SCREEN_STATES.map((s) => s.id)).toEqual(
      Array.from({ length: 13 }, (_, i) => `STATE-${String(i + 1).padStart(2, '0')}`),
    )
  })

  it('names them exactly as the frozen source does', () => {
    expect(SCREEN_STATES.map((s) => s.name)).toEqual([
      'Empty', 'Loading', 'Success', 'Validation', 'Permission-denied',
      'Read-only', 'Offline', 'Stale-data', 'Queued',
      'Artificial-intelligence-degraded', 'Artificial-intelligence-unavailable',
      'Failure', 'Recovery',
    ])
  })

  it('gives every state a contract sentence a non-specialist can act on', () => {
    for (const s of SCREEN_STATES) {
      expect(s.contract.length, s.id).toBeGreaterThan(40)
      expect(s.contract, s.id).not.toMatch(/^[A-Z-]+$/)
    }
  })

  it('records what each state must never do', () => {
    expect(screenState('STATE-01').neverDo).toMatch(/blank panel/i)
    expect(screenState('STATE-02').neverDo).toMatch(/zero/i)
    expect(screenState('STATE-09').neverDo).toMatch(/applied|complete/i)
  })

  // Frozen source: "Only the Frontline Worker Application has a true offline state."
  it('restricts the offline state to the Frontline surface alone', () => {
    expect(FRONTLINE_ONLY_STATES).toEqual(['STATE-07'])
    expect(screenState('STATE-07').frontlineOnly).toBe(true)
    for (const s of SCREEN_STATES) {
      if (s.id !== 'STATE-07') expect(s.frontlineOnly, s.id).toBe(false)
    }
  })

  it('uses none of the forbidden state words as a state name', () => {
    const names = SCREEN_STATES.map((s) => s.name.toLowerCase()).join(' ')
    for (const forbidden of ['synced', 'sent', 'done']) {
      expect(names, forbidden).not.toContain(forbidden)
    }
  })

  it('throws on an unknown state id rather than returning undefined', () => {
    expect(() => screenState('STATE-99' as ScreenStateId)).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/screen-state.test.ts`
Expected: FAIL — cannot resolve `@/ui/screen-state`.

- [ ] **Step 3: Write the implementation**

`src/ui/screen-state.ts`:

```ts
/**
 * Frozen source §25 (L48000): "Rather than writing the same thirteen paragraphs
 * seventy-nine times, this section writes them once as a contract every screen
 * must honour, and then each screen only has to record where it differs."
 *
 * The contract exists to keep four things apart that look alike and are not:
 * nothing exists yet, we are fetching, we cannot fetch, and we fetched something
 * old — plus queued versus applied, and degraded versus unavailable.
 */
export type ScreenStateId =
  | 'STATE-01' | 'STATE-02' | 'STATE-03' | 'STATE-04' | 'STATE-05'
  | 'STATE-06' | 'STATE-07' | 'STATE-08' | 'STATE-09' | 'STATE-10'
  | 'STATE-11' | 'STATE-12' | 'STATE-13'

export interface ScreenStateDefinition {
  readonly id: ScreenStateId
  /** Exact source name. */
  readonly name: string
  /** What the user actually sees. Plain language. */
  readonly contract: string
  /** The mistake this state exists to prevent. */
  readonly neverDo: string
  /** True only for STATE-07: no other surface may render it. */
  readonly frontlineOnly: boolean
}

export const SCREEN_STATES: readonly ScreenStateDefinition[] = [
  {
    id: 'STATE-01', name: 'Empty', frontlineOnly: false,
    contract:
      'The frame renders with a plain sentence naming what would appear here and what creates it, plus the creating action where this role holds it.',
    neverDo: 'Never a blank panel, and never confused with a failure.',
  },
  {
    id: 'STATE-02', name: 'Loading', frontlineOnly: false,
    contract:
      'A skeleton of the eventual layout with a progress indicator and the object being fetched named.',
    neverDo: 'Loading never renders a zero. A count that has not arrived is a placeholder, not the number nought.',
  },
  {
    id: 'STATE-03', name: 'Success', frontlineOnly: false,
    contract:
      'The requested content, with its as-of time where it is an aggregate and its freshness class where the surface has one.',
    neverDo: 'Never present an aggregate without saying when it was true.',
  },
  {
    id: 'STATE-04', name: 'Validation', frontlineOnly: false,
    contract:
      'The invalid field is marked, the rule that was broken is stated in words, and the permitted range or format is stated.',
    neverDo: 'Never reject a value without saying what would be accepted.',
  },
  {
    id: 'STATE-05', name: 'Permission-denied', frontlineOnly: false,
    contract:
      'A plain statement that this identity’s roles and scopes do not carry the action, and the name of the role that does.',
    neverDo: 'Never hide the refusal behind a missing button, and never disclose what the actor may not see.',
  },
  {
    id: 'STATE-06', name: 'Read-only', frontlineOnly: false,
    contract:
      'Every input is disabled, with one banner naming the cause — tenant suspension, an archived object, or a role without write authority.',
    neverDo: 'Never scatter the cause across several messages. One banner, one cause.',
  },
  {
    id: 'STATE-07', name: 'Offline', frontlineOnly: true,
    contract:
      'The persistent indicator carries offline status, how long, and what remains possible. Only the Frontline Worker Application has a true offline state.',
    neverDo: 'No other surface may render an offline state, because no other surface has one.',
  },
  {
    id: 'STATE-08', name: 'Stale-data', frontlineOnly: false,
    contract:
      'Content renders with its age and its origin explicit, so a reader can judge how much to trust it.',
    neverDo: 'Never show old content as though it were current.',
  },
  {
    id: 'STATE-09', name: 'Queued', frontlineOnly: false,
    contract:
      'An accepted action that has not yet taken effect is shown in its true command state — created, authorised, queued, available for delivery, and so on.',
    neverDo: 'Never render a queued action as applied or complete, and never collapse its state into one word.',
  },
  {
    id: 'STATE-10', name: 'Artificial-intelligence-degraded', frontlineOnly: false,
    contract:
      'The agent’s output area states plainly that the agent is degraded, what is missing, and what remains available. Deterministic behaviour continues unchanged.',
    neverDo: 'Never let a degraded agent look healthy, and never let its absence stop a deterministic check.',
  },
  {
    id: 'STATE-11', name: 'Artificial-intelligence-unavailable', frontlineOnly: false,
    contract:
      'The agent’s area states unavailability with its cause where known, including when agents are paused by the platform.',
    neverDo: 'Never present cached guidance or a deterministic rule as live artificial intelligence.',
  },
  {
    id: 'STATE-12', name: 'Failure', frontlineOnly: false,
    contract:
      'The screen names what failed, whether anything was written, and the next step.',
    neverDo: 'Never leave the reader unsure whether their data was saved.',
  },
  {
    id: 'STATE-13', name: 'Recovery', frontlineOnly: false,
    contract:
      'The transitional state after a failure or reconnection: what is being replayed or recomputed, and how much remains.',
    neverDo: 'Never show a recovering system as fully recovered.',
  },
] as const

export const FRONTLINE_ONLY_STATES: readonly ScreenStateId[] = ['STATE-07'] as const

const BY_ID = new Map(SCREEN_STATES.map((s) => [s.id, s]))

export function screenState(id: ScreenStateId): ScreenStateDefinition {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown screen state: ${id}`)
  return found
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/screen-state.test.ts`
Expected: all eight tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/screen-state.ts tests/unit/screen-state.test.ts
git commit -m "feat(slice-02a): the thirteen screen states every screen must honour"
```

---

## Task 3: Status and messaging primitives

**Files:**
- Create: `src/ui/primitives/StatusPill.tsx`, `Banner.tsx`, `EmptyState.tsx`, `SkeletonBlock.tsx`, `FreshnessLabel.tsx`, `PermissionNotice.tsx`
- Test: `tests/component/primitives-status.test.tsx`

**Interfaces:**
- Consumes: `PermissionDecision`, `permitsAction`, `isRefusal` from `@/policy/decision`
- Produces:
  - `<StatusPill tone icon label />` — `tone: 'ok' | 'info' | 'attention' | 'blocked' | 'stale' | 'neutral'`; **both `icon` and `label` are required props**
  - `<Banner tone heading body action? />`
  - `<EmptyState title whatCreatesIt action? />`
  - `<SkeletonBlock lines label />` — `label` names the object being fetched
  - `<FreshnessLabel asOfLabel originLabel />`
  - `<PermissionNotice decision />` — renders a refusal's plain-language explanation and the role that does hold it

All satisfy the shared primitive contract above.

- [ ] **Step 1: Write the failing test**

`tests/component/primitives-status.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPill } from '@/ui/primitives/StatusPill'
import { Banner } from '@/ui/primitives/Banner'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { SkeletonBlock } from '@/ui/primitives/SkeletonBlock'
import { FreshnessLabel } from '@/ui/primitives/FreshnessLabel'
import { PermissionNotice } from '@/ui/primitives/PermissionNotice'
import { deny } from '@/policy/decision'

describe('status primitives', () => {
  it('StatusPill renders both an icon and a text label, never colour alone', () => {
    render(<StatusPill tone="blocked" icon="⛔" label="On hold" />)
    expect(screen.getByText('On hold')).toBeDefined()
    // The icon is decorative; the label carries the meaning for assistive tech.
    expect(screen.getByText('⛔').getAttribute('aria-hidden')).toBe('true')
  })

  it('Banner exposes its heading to assistive technology', () => {
    render(<Banner tone="attention" heading="Tenant suspended" body="No new work can be created." />)
    expect(screen.getByRole('status')).toBeDefined()
    expect(screen.getByText('Tenant suspended')).toBeDefined()
  })

  // STATE-01: never a blank panel; always name what creates the thing.
  it('EmptyState names what would appear and what creates it', () => {
    render(<EmptyState title="No runs are scheduled for Day Shift." whatCreatesIt="Runs are created in Run Scheduling." />)
    expect(screen.getByText(/No runs are scheduled/)).toBeDefined()
    expect(screen.getByText(/created in Run Scheduling/)).toBeDefined()
  })

  // STATE-02: loading never renders a zero.
  it('SkeletonBlock names the object being fetched and renders no digits', () => {
    const { container } = render(<SkeletonBlock lines={3} label="Loading scheduled runs" />)
    expect(screen.getByText('Loading scheduled runs')).toBeDefined()
    expect(container.textContent ?? '').not.toMatch(/\d/)
  })

  // STATE-08: age and origin explicit.
  it('FreshnessLabel states both age and origin', () => {
    render(<FreshnessLabel asOfLabel="as at 13:58" originLabel="from the Delivery Operations Hub" />)
    expect(screen.getByText(/as at 13:58/)).toBeDefined()
    expect(screen.getByText(/Delivery Operations Hub/)).toBeDefined()
  })

  // STATE-05: state the refusal plainly; never hide it behind a missing control.
  it('PermissionNotice renders the decision explanation in plain language', () => {
    const d = deny('explicitlyProhibited', 'ROLE_NOT_GRANTED', undefined, {
      stage: 'BASE_ROLE', sourceRefs: ['MOD-CC-13'],
    })
    render(<PermissionNotice decision={d} />)
    expect(screen.getByText(d.explanation)).toBeDefined()
  })

  it('PermissionNotice renders nothing for a permitted decision', () => {
    const d = deny('readOnly', 'READ_ONLY_RECORD', undefined, { stage: 'BASE_ROLE', sourceRefs: ['x'] })
    const { container } = render(<PermissionNotice decision={d} />)
    expect(container.textContent).toContain(d.explanation)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project component tests/component/primitives-status.test.tsx`
Expected: FAIL — none of the primitive modules resolve.

- [ ] **Step 3: Implement the six primitives**

Each is a small client component. `StatusPill` shows the pattern the others follow —
required icon **and** label, icon marked decorative so the label carries meaning:

```tsx
// src/ui/primitives/StatusPill.tsx
export type StatusTone = 'ok' | 'info' | 'attention' | 'blocked' | 'stale' | 'neutral'

const TONE_CLASS: Record<StatusTone, string> = {
  ok: 'bg-[var(--color-status-ok)]/10 text-[var(--color-status-ok)]',
  info: 'bg-[var(--color-status-info)]/10 text-[var(--color-status-info)]',
  attention: 'bg-[var(--color-status-attention)]/10 text-[var(--color-status-attention)]',
  blocked: 'bg-[var(--color-status-blocked)]/10 text-[var(--color-status-blocked)]',
  stale: 'bg-[var(--color-status-stale)]/10 text-[var(--color-status-stale)]',
  neutral: 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)]',
}

/**
 * Colour is never load-bearing alone. Both `icon` and `label` are required, so a
 * pill cannot be constructed that communicates by colour only.
 */
export function StatusPill({
  tone, icon, label,
}: { tone: StatusTone; icon: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  )
}
```

Implement `Banner` (role `status`, heading + body + optional action),
`EmptyState` (title + whatCreatesIt + optional action, never a bare panel),
`SkeletonBlock` (renders `lines` placeholder bars plus a visible label naming the
object; **must contain no digit**), `FreshnessLabel` (as-of and origin, both
rendered as text), and `PermissionNotice` (renders `decision.explanation`, plus
`decision.conditionToEnable` when present).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project component tests/component/primitives-status.test.tsx`
Expected: all seven tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/primitives tests/component/primitives-status.test.tsx
git commit -m "feat(slice-02a): status and messaging primitives"
```

---

## Task 4: Form and table primitives

**Files:**
- Create: `src/ui/primitives/Button.tsx`, `Field.tsx`, `Select.tsx`, `Checkbox.tsx`, `Table.tsx`
- Test: `tests/component/primitives-form.test.tsx`

**Interfaces:**
- Consumes: `StatusTone` from `@/ui/primitives/StatusPill`
- Produces:
  - `<Button variant tone? disabledReason? loading? />` — a disabled button REQUIRES `disabledReason`
  - `<Field label description? error? required? >{input}</Field>`
  - `<Select label options value onChange />`
  - `<Checkbox label checked onChange />`
  - `<Table caption columns rows emptyState loading? error? />`

- [ ] **Step 1: Write the failing test**

`tests/component/primitives-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/ui/primitives/Button'
import { Field } from '@/ui/primitives/Field'
import { Table } from '@/ui/primitives/Table'

describe('form primitives', () => {
  it('Button is operable by keyboard and has an accessible name', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Release hold</Button>)
    const b = screen.getByRole('button', { name: 'Release hold' })
    b.focus()
    await userEvent.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('a disabled Button states its reason and is not silently inert', () => {
    render(<Button disabledReason="Only a Quality Manager can release a hold.">Release hold</Button>)
    const b = screen.getByRole('button', { name: /Release hold/ })
    expect(b.getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByText('Only a Quality Manager can release a hold.')).toBeDefined()
  })

  it('a disabled Button does not fire its handler', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabledReason="Not your role.">Go</Button>)
    await userEvent.click(screen.getByRole('button', { name: /Go/ }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('Field associates its error with the input for assistive technology', () => {
    render(
      <Field label="Torque" error="Must be between 8 and 12 newton metres.">
        <input id="torque" />
      </Field>,
    )
    const input = screen.getByLabelText('Torque')
    const describedBy = input.getAttribute('aria-describedby') ?? ''
    expect(describedBy.length).toBeGreaterThan(0)
    expect(screen.getByText(/between 8 and 12/)).toBeDefined()
  })

  it('Table renders its empty state rather than an empty grid', () => {
    render(
      <Table
        caption="Scheduled runs"
        columns={[{ key: 'id', header: 'Run' }]}
        rows={[]}
        emptyState={{ title: 'No runs are scheduled.', whatCreatesIt: 'Runs are created in Run Scheduling.' }}
      />,
    )
    expect(screen.getByText('No runs are scheduled.')).toBeDefined()
    expect(screen.queryByRole('row')).toBeNull()
  })

  it('Table distinguishes empty from no-match-after-filter', () => {
    render(
      <Table
        caption="Scheduled runs"
        columns={[{ key: 'id', header: 'Run' }]}
        rows={[]}
        filtered
        emptyState={{ title: 'No runs are scheduled.', whatCreatesIt: 'Runs are created in Run Scheduling.' }}
      />,
    )
    expect(screen.getByText(/no runs match/i)).toBeDefined()
  })

  it('Table has an accessible caption', () => {
    render(
      <Table
        caption="Scheduled runs"
        columns={[{ key: 'id', header: 'Run' }]}
        rows={[{ id: 'RUN-1' }]}
        emptyState={{ title: 'x', whatCreatesIt: 'y' }}
      />,
    )
    expect(screen.getByRole('table', { name: 'Scheduled runs' })).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project component tests/component/primitives-form.test.tsx`
Expected: FAIL — the primitive modules do not resolve.

- [ ] **Step 3: Implement the five primitives**

`Button` uses `aria-disabled` rather than the `disabled` attribute, so the control
stays focusable and its reason is announced — a `disabled` button is invisible to
screen-reader users navigating by control. It renders `disabledReason` as visible
text and wires it through `aria-describedby`, and it must not call `onClick` when
a `disabledReason` is present.

`Field` generates an id when its child has none, associates `label`, and joins
`description` and `error` ids into `aria-describedby`. `error` also sets
`aria-invalid`.

`Table` renders `<caption>`, a real `<thead>`/`<tbody>`, the `EmptyState`
primitive when `rows` is empty and `filtered` is false, and a distinct
"no runs match the current filters" message when `filtered` is true. Loading
renders `SkeletonBlock`, never a zero-row grid.

`Select` and `Checkbox` are label-associated native controls.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project component tests/component/primitives-form.test.tsx`
Expected: all seven tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/primitives tests/component/primitives-form.test.tsx
git commit -m "feat(slice-02a): form and table primitives with explained disabled states"
```

---

## Task 5: Overlay and navigation primitives

**Files:**
- Create: `src/ui/primitives/Dialog.tsx`, `Drawer.tsx`, `Tabs.tsx`, `Breadcrumbs.tsx`, `Toast.tsx`, `LiveRegion.tsx`, `index.ts`
- Test: `tests/component/primitives-overlay.test.tsx`

**Interfaces:**
- Consumes: `Button` from `@/ui/primitives/Button`
- Produces:
  - `<Dialog open onClose title >{children}</Dialog>` — traps focus, closes on Escape, restores focus to the invoker
  - `<Drawer open onClose title side />` — same focus contract
  - `<Tabs tabs activeId onChange />` — arrow-key navigation
  - `<Breadcrumbs items />` — `nav` with an accessible name
  - `<Toast tone icon label onDismiss />`
  - `<LiveRegion politeness>{message}</LiveRegion>`
  - `src/ui/primitives/index.ts` re-exports every primitive

- [ ] **Step 1: Write the failing test**

`tests/component/primitives-overlay.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from '@/ui/primitives/Dialog'
import { Tabs } from '@/ui/primitives/Tabs'
import { Breadcrumbs } from '@/ui/primitives/Breadcrumbs'
import { LiveRegion } from '@/ui/primitives/LiveRegion'

describe('overlay primitives', () => {
  it('Dialog exposes an accessible name and the dialog role', () => {
    render(<Dialog open onClose={() => {}} title="Confirm release"><p>Body</p></Dialog>)
    expect(screen.getByRole('dialog', { name: 'Confirm release' })).toBeDefined()
  })

  it('Dialog closes on Escape', async () => {
    const onClose = vi.fn()
    render(<Dialog open onClose={onClose} title="Confirm release"><p>Body</p></Dialog>)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('Dialog moves focus into itself when opened', async () => {
    render(<Dialog open onClose={() => {}} title="Confirm release"><button>Inside</button></Dialog>)
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('Dialog renders nothing when closed', () => {
    render(<Dialog open={false} onClose={() => {}} title="Confirm release"><p>Body</p></Dialog>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Tabs move with arrow keys and report the active tab', async () => {
    const onChange = vi.fn()
    render(
      <Tabs
        activeId="a"
        onChange={onChange}
        tabs={[{ id: 'a', label: 'Overview' }, { id: 'b', label: 'Audit' }]}
      />,
    )
    screen.getByRole('tab', { name: 'Overview' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('Breadcrumbs render a named navigation landmark', () => {
    render(<Breadcrumbs items={[{ label: 'Hub', href: '/hub/' }, { label: 'Runs' }]} />)
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeDefined()
  })

  it('LiveRegion announces politely by default', () => {
    render(<LiveRegion>Saved</LiveRegion>)
    const region = screen.getByText('Saved')
    expect(region.getAttribute('aria-live')).toBe('polite')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project component tests/component/primitives-overlay.test.tsx`
Expected: FAIL — the modules do not resolve.

- [ ] **Step 3: Implement the primitives**

`Dialog` renders `null` when `open` is false. When open it renders
`role="dialog" aria-modal="true"` with `aria-labelledby` pointing at its title,
moves focus to the first focusable descendant on open, records
`document.activeElement` before opening and restores it on close, cycles Tab
within itself, and calls `onClose` on Escape. `Drawer` shares that contract with a
side position.

`Tabs` renders `role="tablist"` with `role="tab"` children, `aria-selected` on the
active one, `tabIndex` roving, and ArrowLeft/ArrowRight/Home/End handling.

`Breadcrumbs` renders `<nav aria-label="Breadcrumb">` with an ordered list; the
final item is `aria-current="page"` and is not a link.

`Toast` renders `role="status"` with a dismiss button whose accessible name names
what it dismisses. `LiveRegion` renders a `div` with `aria-live` and
`aria-atomic="true"`.

`index.ts` re-exports every primitive from Tasks 3, 4 and 5.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project component tests/component/primitives-overlay.test.tsx`
Expected: all seven tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/primitives tests/component/primitives-overlay.test.tsx
git commit -m "feat(slice-02a): overlay and navigation primitives with focus contracts"
```

---

## Task 6: ScreenStateBoundary

**Files:**
- Create: `src/ui/ScreenStateBoundary.tsx`
- Test: `tests/component/screen-state-boundary.test.tsx`

**Interfaces:**
- Consumes: `SCREEN_STATES`, `screenState`, `ScreenStateId` from `@/ui/screen-state`; the primitives from Tasks 3–5
- Produces: `<ScreenStateBoundary state surface? detail? >{children}</ScreenStateBoundary>` — renders the default treatment for the state; `children` renders only for `STATE-03`

- [ ] **Step 1: Write the failing test**

`tests/component/screen-state-boundary.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { SCREEN_STATES } from '@/ui/screen-state'

describe('ScreenStateBoundary', () => {
  it('renders a distinguishable treatment for every one of the thirteen states', () => {
    const seen = new Set<string>()
    for (const s of SCREEN_STATES) {
      const { container, unmount } = render(
        <ScreenStateBoundary state={s.id} surface="SURF-FL" detail={{ objectLabel: 'scheduled runs' }}>
          <p>content</p>
        </ScreenStateBoundary>,
      )
      const text = (container.textContent ?? '').trim()
      expect(text.length, s.id).toBeGreaterThan(0)
      seen.add(text)
      unmount()
    }
    expect(seen.size).toBe(13)
  })

  it('renders children only in the success state', () => {
    const { container: ok } = render(
      <ScreenStateBoundary state="STATE-03" surface="SURF-DOH"><p>content</p></ScreenStateBoundary>,
    )
    expect(ok.textContent).toContain('content')
    const { container: empty } = render(
      <ScreenStateBoundary state="STATE-01" surface="SURF-DOH" detail={{ objectLabel: 'runs', whatCreatesIt: 'Run Scheduling' }}>
        <p>content</p>
      </ScreenStateBoundary>,
    )
    expect(empty.textContent).not.toContain('content')
  })

  // STATE-02: loading never renders a zero.
  it('renders no digit in the loading state', () => {
    const { container } = render(
      <ScreenStateBoundary state="STATE-02" surface="SURF-DOH" detail={{ objectLabel: 'scheduled runs' }} />,
    )
    expect(container.textContent ?? '').not.toMatch(/\d/)
  })

  // Frozen source: only the Frontline surface has a true offline state.
  it('throws when a non-Frontline surface asks for the offline state', () => {
    expect(() =>
      render(<ScreenStateBoundary state="STATE-07" surface="SURF-DOH" />),
    ).toThrow(/only the frontline/i)
  })

  it('allows the offline state on the Frontline surface', () => {
    const { container } = render(<ScreenStateBoundary state="STATE-07" surface="SURF-FL" />)
    expect((container.textContent ?? '').length).toBeGreaterThan(0)
  })

  // STATE-09: never render a queued action as applied or complete.
  it('names the true command state when queued and never says applied or complete', () => {
    const { container } = render(
      <ScreenStateBoundary state="STATE-09" surface="SURF-FL" detail={{ commandState: 'available for delivery' }} />,
    )
    const t = (container.textContent ?? '').toLowerCase()
    expect(t).toContain('available for delivery')
    expect(t).not.toContain('applied')
    expect(t).not.toContain('complete')
    expect(t).not.toContain('synced')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project component tests/component/screen-state-boundary.test.tsx`
Expected: FAIL — cannot resolve `@/ui/ScreenStateBoundary`.

- [ ] **Step 3: Write the implementation**

`ScreenStateBoundary` switches on the state id and renders the default treatment
using the primitives: `EmptyState` for `STATE-01`, `SkeletonBlock` for `STATE-02`,
`children` for `STATE-03`, a validation summary for `STATE-04`,
`PermissionNotice` for `STATE-05`, a single `Banner` for `STATE-06`, an offline
indicator for `STATE-07`, `FreshnessLabel` for `STATE-08`, a `StatusPill` naming
the true command state for `STATE-09`, agent-degraded and agent-unavailable
notices for `STATE-10` and `STATE-11`, a failure notice stating whether anything
was written for `STATE-12`, and a recovery progress notice for `STATE-13`.

It throws when `state === 'STATE-07'` and `surface !== 'SURF-FL'`, with the
message naming the rule: *"Only the Frontline Worker Application has a true
offline state."*

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project component tests/component/screen-state-boundary.test.tsx`
Expected: all six tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/ScreenStateBoundary.tsx tests/component/screen-state-boundary.test.tsx
git commit -m "feat(slice-02a): screen state boundary carrying the thirteen-state contract"
```

---

## Task 7: Runtime-validated registry loading

**Files:**
- Create: `src/registry/schemas.ts`, `src/registry/load.ts`
- Test: `tests/unit/registry.test.ts`

**Interfaces:**
- Consumes: Zod
- Produces:
  - `const SurfaceRecordSchema`, `RoleRecordSchema`, `ReconciliationRowSchema`, `SourceReferenceSchema`
  - `function loadRegistry<T>(schema, raw, label): T` — throws a labelled error on any validation failure
  - `function loadReconciliation(raw): ReconciliationReport`

- [ ] **Step 1: Write the failing test**

`tests/unit/registry.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { loadRegistry, SourceReferenceSchema } from '@/registry/load'

describe('registry loading', () => {
  it('accepts a valid record', () => {
    const r = loadRegistry(SourceReferenceSchema, {
      id: 'MOD-CC-13', label: 'Operational actions', classification: 'SoW Fact', locator: '§6.14',
    }, 'source reference')
    expect(r.id).toBe('MOD-CC-13')
  })

  // An unknown field is the signature of a version mismatch, so it must not be ignored.
  it('REJECTS an unknown field rather than ignoring it', () => {
    expect(() =>
      loadRegistry(SourceReferenceSchema, {
        id: 'MOD-CC-13', label: 'x', classification: 'SoW Fact', locator: '§6.14',
        unexpectedField: 'from a newer schema',
      }, 'source reference'),
    ).toThrow(/unexpectedField|unrecognized/i)
  })

  it('rejects a missing required field with a labelled error', () => {
    expect(() =>
      loadRegistry(SourceReferenceSchema, { id: 'MOD-CC-13' }, 'source reference'),
    ).toThrow(/source reference/)
  })

  it('rejects an unknown classification value', () => {
    expect(() =>
      loadRegistry(SourceReferenceSchema, {
        id: 'X', label: 'x', classification: 'Made Up', locator: '§1',
      }, 'source reference'),
    ).toThrow()
  })

  it('names the failing field in the error so a mismatch is diagnosable', () => {
    try {
      loadRegistry(z.object({ a: z.string() }).strict(), { a: 1 }, 'probe')
      throw new Error('should have thrown')
    } catch (e) {
      expect(String(e)).toMatch(/a/)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/registry.test.ts`
Expected: FAIL — cannot resolve `@/registry/load`.

- [ ] **Step 3: Write the implementation**

`src/registry/schemas.ts` declares the schemas with `.strict()` so unknown keys
are rejected. `classification` is an enum of the source's exact labels:
`'SoW Fact'`, `'Derived Clarification'`, `'Derived Clarification — adopted working position'`,
`'Recommendation — Research and Development'`, `'Assumption'`,
`'Client Decision Required'`, `'Illustrative Example'`.

`src/registry/load.ts`:

```ts
import type { z } from 'zod'

/**
 * Compile-time typing is not enough for source-derived data. An unknown field is
 * the signature of a version mismatch, so schemas are strict and a failure is a
 * labelled throw rather than a silent pass.
 */
export function loadRegistry<S extends z.ZodTypeAny>(
  schema: S,
  raw: unknown,
  label: string,
): z.infer<S> {
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new Error(
      `Registry validation failed for ${label}: ${JSON.stringify(result.error.issues)}`,
    )
  }
  return result.data
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/registry.test.ts`
Expected: all five tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/registry tests/unit/registry.test.ts
git commit -m "feat(slice-02a): runtime-validated registry loading rejecting unknown fields"
```

---

## Task 8: IndexedDB schema and storage bootstrap

**Files:**
- Create: `src/persistence/schema.ts`, `src/persistence/bootstrap.ts`
- Test: `tests/unit/bootstrap.test.ts`

**Interfaces:**
- Consumes: `fake-indexeddb` in tests
- Produces:
  - `const DB_NAME`, `const DB_VERSION`, `const STORES` — object store names
  - `function openDatabase(factory): Promise<IDBDatabase>`
  - `type StorageBootstrapState` — the eight success states plus six failure exits
  - `function bootstrapStorage(factory): Promise<BootstrapResult>`

- [ ] **Step 1: Write the failing test**

`tests/unit/bootstrap.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { bootstrapStorage, STORES, type StorageBootstrapState } from '@/persistence/bootstrap'

let factory: IDBFactory
beforeEach(() => { factory = new IDBFactory() })

describe('storage bootstrap', () => {
  it('reaches ready-durable on a clean first open', async () => {
    const r = await bootstrapStorage(factory)
    expect(r.state).toBe<StorageBootstrapState>('ready-durable')
  })

  it('creates every declared object store', async () => {
    await bootstrapStorage(factory)
    const db = await new Promise<IDBDatabase>((res, rej) => {
      const req = factory.open('aviixa-storyboard')
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
    for (const s of STORES) expect(Array.from(db.objectStoreNames)).toContain(s)
    db.close()
  })

  it('records every state it passed through, in order', async () => {
    const r = await bootstrapStorage(factory)
    expect(r.trace[0]).toBe('uninitialized')
    expect(r.trace).toContain('opening')
    expect(r.trace).toContain('runtime-validating')
    expect(r.trace.at(-1)).toBe('ready-durable')
  })

  it('exits to persistence-denied when the factory refuses to open', async () => {
    const refusing = {
      open() {
        const req: Record<string, unknown> = { error: new Error('denied') }
        queueMicrotask(() => (req.onerror as () => void)?.())
        return req
      },
    } as unknown as IDBFactory
    const r = await bootstrapStorage(refusing)
    expect(r.state).toBe<StorageBootstrapState>('persistence-denied')
  })

  it('reports ephemeral-preview as not durable', async () => {
    const refusing = {
      open() {
        const req: Record<string, unknown> = { error: new Error('denied') }
        queueMicrotask(() => (req.onerror as () => void)?.())
        return req
      },
    } as unknown as IDBFactory
    const r = await bootstrapStorage(refusing)
    expect(r.durable).toBe(false)
  })

  it('is durable only in ready-durable', async () => {
    const r = await bootstrapStorage(factory)
    expect(r.durable).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/bootstrap.test.ts`
Expected: FAIL — cannot resolve `@/persistence/bootstrap`.

- [ ] **Step 3: Write the implementation**

`src/persistence/schema.ts` declares `DB_NAME = 'aviixa-storyboard'`,
`DB_VERSION = 1`, and `STORES` covering: `snapshots`, `audit`, `events`,
`commands`, `notifications`, `schedules`, `captures`, `idempotency`,
`reviewRecords`, `reviewEvents`, `meta`.

`src/persistence/bootstrap.ts` implements:

```ts
export type StorageBootstrapState =
  | 'uninitialized' | 'client-mounted' | 'opening' | 'reading'
  | 'runtime-validating' | 'checksum-verifying' | 'migrating' | 'ready-durable'
  | 'upgrade-blocked' | 'persistence-denied' | 'quota-limited'
  | 'corrupt-quarantined' | 'migration-failed-read-only' | 'ephemeral-preview'

export interface BootstrapResult {
  readonly state: StorageBootstrapState
  readonly trace: readonly StorageBootstrapState[]
  /** Only `ready-durable` is durable. Everything else restricts what may happen. */
  readonly durable: boolean
  readonly reason: string | null
}
```

`bootstrapStorage` walks the states, pushing each onto `trace`, and returns the
failure exit with a plain-language `reason` when a step fails. `durable` is true
only for `ready-durable`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/bootstrap.test.ts`
Expected: all six tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/persistence tests/unit/bootstrap.test.ts
git commit -m "feat(slice-02a): IndexedDB schema and storage bootstrap state machine"
```

---

## Task 9: PersistenceCoordinator — atomic single-transaction commit

**Files:**
- Create: `src/persistence/coordinator.ts`
- Test: `tests/unit/coordinator.test.ts`

**Interfaces:**
- Consumes: `STORES`, `openDatabase` from `@/persistence/schema`; `ProposedTransition`, `CommittedTransition` from `@/domain/transition`
- Produces: `function commitTransition(db, proposed): Promise<CommitResult>` where
  `CommitResult = { ok: true; committed: CommittedTransition } | { ok: false; failure: PersistenceFailure }`

- [ ] **Step 1: Write the failing test**

`tests/unit/coordinator.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { openDatabase } from '@/persistence/schema'
import { commitTransition } from '@/persistence/coordinator'

let db: IDBDatabase
beforeEach(async () => { db = await openDatabase(new IDBFactory()) })

function proposed(overrides: Record<string, unknown> = {}) {
  return {
    status: 'accepted', nextState: { runId: 'RUN-1', tenants: {}, sequence: 1 },
    audit: [{ id: 'A-1', sequence: 1, logicalTime: 0, tenant: null, kind: 'X', payload: {} }],
    events: [], commands: [], notifications: [], schedules: [],
    ...overrides,
  } as never
}

describe('atomic commit', () => {
  it('commits the snapshot and its audit record together', async () => {
    const r = await commitTransition(db, proposed())
    expect(r.ok).toBe(true)
    const audit = await new Promise((res) => {
      const tx = db.transaction('audit', 'readonly')
      const req = tx.objectStore('audit').getAll()
      req.onsuccess = () => res(req.result)
    })
    expect((audit as unknown[]).length).toBe(1)
  })

  // MOD-DOH-17 / enforced invariant: an action that cannot be audited does not happen.
  it('writes NOTHING when the audit record cannot be written', async () => {
    const bad = proposed({ audit: [{ id: 'A-1', bad: () => {} }] })
    const r = await commitTransition(db, bad)
    expect(r.ok).toBe(false)
    const snapshots = await new Promise((res) => {
      const tx = db.transaction('snapshots', 'readonly')
      const req = tx.objectStore('snapshots').getAll()
      req.onsuccess = () => res(req.result)
    })
    expect((snapshots as unknown[]).length).toBe(0)
  })

  it('refuses a transition that was not accepted', async () => {
    const r = await commitTransition(db, proposed({ status: 'denied', nextState: null }))
    expect(r.ok).toBe(false)
  })

  it('returns a typed failure rather than throwing', async () => {
    const r = await commitTransition(db, proposed({ audit: [{ id: 'A', bad: () => {} }] }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.failure.reason.length).toBeGreaterThan(10)
  })

  it('publishes only after the transaction completes', async () => {
    const r = await commitTransition(db, proposed())
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.committed.committed).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/coordinator.test.ts`
Expected: FAIL — cannot resolve `@/persistence/coordinator`.

- [ ] **Step 3: Write the implementation**

`commitTransition` opens ONE `readwrite` transaction spanning every store it will
write, puts the snapshot and every ledger record inside it, and resolves only on
the transaction's `oncomplete`. On `onerror` or `onabort` it resolves to
`{ ok: false, failure }` with a plain-language reason. It never throws, and it
never publishes a `CommittedTransition` before `oncomplete` fires.

It refuses immediately when `proposed.status !== 'accepted'` or
`proposed.nextState === null`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/coordinator.test.ts`
Expected: all five tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/persistence/coordinator.ts tests/unit/coordinator.test.ts
git commit -m "feat(slice-02a): atomic single-transaction commit with audit"
```

---

## Task 10: PersistenceCapability action matrix

**Files:**
- Create: `src/persistence/capability.ts`
- Test: `tests/unit/capability.test.ts`

**Interfaces:**
- Consumes: `StorageBootstrapState` from `@/persistence/bootstrap`
- Produces:
  - `type ActionClass` — `'navigate' | 'readFixture' | 'presentation' | 'failurePreview' | 'sandboxDemo' | 'durableEvidence' | 'requiredAudit' | 'captureAcceptance' | 'queueAcceptance' | 'approval' | 'publication' | 'release' | 'hold' | 'synchronisation' | 'lifecycleChange' | 'checkpointCredit'`
  - `function permittedUnder(state, action): boolean`

- [ ] **Step 1: Write the failing test**

`tests/unit/capability.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { permittedUnder, type ActionClass } from '@/persistence/capability'

const DURABLE: readonly ActionClass[] = [
  'durableEvidence', 'requiredAudit', 'captureAcceptance', 'queueAcceptance',
  'approval', 'publication', 'release', 'hold', 'synchronisation',
  'lifecycleChange', 'checkpointCredit',
]
const SAFE: readonly ActionClass[] = [
  'navigate', 'readFixture', 'presentation', 'failurePreview', 'sandboxDemo',
]

describe('persistence capability matrix', () => {
  it('permits everything when storage is durable', () => {
    for (const a of [...SAFE, ...DURABLE]) {
      expect(permittedUnder('ready-durable', a), a).toBe(true)
    }
  })

  it('permits only the non-durable action classes in ephemeral preview', () => {
    for (const a of SAFE) expect(permittedUnder('ephemeral-preview', a), a).toBe(true)
    for (const a of DURABLE) expect(permittedUnder('ephemeral-preview', a), a).toBe(false)
  })

  it('blocks every durable action class in every failure exit', () => {
    const exits = [
      'upgrade-blocked', 'persistence-denied', 'quota-limited',
      'corrupt-quarantined', 'migration-failed-read-only', 'ephemeral-preview',
    ] as const
    for (const s of exits) {
      for (const a of DURABLE) expect(permittedUnder(s, a), `${s}/${a}`).toBe(false)
    }
  })

  it('blocks even navigation before the store is installed', () => {
    expect(permittedUnder('opening', 'navigate')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/capability.test.ts`
Expected: FAIL — cannot resolve `@/persistence/capability`.

- [ ] **Step 3: Write the implementation**

A frozen table keyed by `StorageBootstrapState`, listing the permitted
`ActionClass` values. `ready-durable` permits all. `ephemeral-preview` permits the
five non-durable classes only. Every other failure exit permits at most the
read-only classes, and the in-progress states permit nothing.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/capability.test.ts`
Expected: all four tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/persistence/capability.ts tests/unit/capability.test.ts
git commit -m "feat(slice-02a): persistence capability action matrix"
```

---

## Task 11: Contract gates

**Files:**
- Create: `tests/coverage/contract-gates.test.ts`
- Test: itself

**Interfaces:**
- Consumes: `PermissionOutcome`, `SCREEN_STATES`, the primitives barrel
- Produces: gates that fail on a blank matrix cell, a duplicated policy engine, or a forbidden state word

- [ ] **Step 1: Write the failing test**

`tests/coverage/contract-gates.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}
const SRC = [...walk('src')].filter((f) => /\.tsx?$/.test(f))

describe('contract gates', () => {
  // Frozen source: a blank permission-matrix cell is prohibited.
  it('declares no permission matrix cell as empty, null or undefined', () => {
    const offenders = SRC.filter((f) => /outcome:\s*(null|undefined|''|"")/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  // "taking a button off the screen does not stop anyone" — components hold no policy.
  it('keeps permission logic out of components', () => {
    const ui = SRC.filter((f) => f.includes(`${'src'}/ui/`))
    const offenders = ui.filter((f) => {
      const s = readFileSync(f, 'utf8')
      return /\ballowedRoles\b|\bevaluateAccess\b|\bROLES\.(some|find|filter)\b/.test(s)
    })
    expect(offenders).toEqual([])
  })

  // AC-4830: 'synced' is never a state name anywhere in the product.
  it('uses none of the forbidden words as a state name', () => {
    const offenders: string[] = []
    for (const f of SRC) {
      const s = readFileSync(f, 'utf8')
      if (/(state|status)\s*[:=]\s*['"](synced|sent|done)['"]/i.test(s)) offenders.push(f)
    }
    expect(offenders).toEqual([])
  })

  it('exports exactly nine permission outcomes', () => {
    const s = readFileSync('src/policy/decision.ts', 'utf8')
    const block = s.slice(s.indexOf('export type PermissionOutcome'))
    const members = block.slice(0, block.indexOf('\n\n')).match(/\|\s*'[a-zA-Z]+'/g) ?? []
    expect(members).toHaveLength(9)
  })
})
```

- [ ] **Step 2: Run the gates and prove each can fail**

Run: `pnpm vitest run tests/coverage/contract-gates.test.ts`

Then plant one violation per gate, confirm the FAILURE, and revert:
- add `const x = { outcome: null }` to a `src` file → the blank-cell gate must fail;
- add `import { evaluateAccess } from '@/policy/evaluate'` plus a use to a file under `src/ui/` → the no-policy-in-components gate must fail;
- add `const state = 'synced'` to a `src` file → the forbidden-word gate must fail;
- add a tenth member to `PermissionOutcome` → the nine-member gate must fail.

Record each probe result. A gate nobody proved can fail is not a gate.

- [ ] **Step 3: Run the full chain**

Run: `pnpm verify`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add tests/coverage/contract-gates.test.ts
git commit -m "test(slice-02a): contract gates for blank cells, policy leakage and state words"
```

---

## Slice 2a exit criteria

- [ ] `pnpm verify` exits 0 on a clean rebuild (`out/` and `.next/` removed first).
- [ ] `PermissionOutcome` has exactly nine members; a reasonless `notApplicable` fails to compile.
- [ ] All thirteen screen states render distinguishably; `STATE-07` throws on a non-Frontline surface.
- [ ] Every primitive has an accessible name, a keyboard path, and an explained disabled state.
- [ ] Registry loading rejects an unknown field rather than ignoring it.
- [ ] Storage bootstrap reaches `ready-durable` and every failure exit is reachable and tested.
- [ ] An audit write failure leaves **nothing** written — proven by a forced abort.
- [ ] `ephemeral-preview` blocks every durable action class.
- [ ] Each of the four contract gates proven able to fail by a planted violation.
- [ ] Independent review passes with every Critical and Important finding resolved.

## Self-review record

**Spec coverage.** Spec §1.1 → Task 1. §1.2 → Task 1. §1.3 → Task 11's
no-policy-in-components gate. §2 → Tasks 2 and 6. §3 → Tasks 3, 4, 5. §4 → Task 7.
§5.1 → Task 8. §5.2 → Task 9. §5.3 → Task 10. §5.4 data classes → Task 8's store
list. §7 testing → every task, plus Task 11.

**Deferred by design and recorded:** review shell, scenario controls, review
package import/export and evidence capture are slice 2b. The scenario command
gateway and client store are 2b because they consume the coordinator this slice
freezes. Deep-freezing domain state at runtime stays deferred.

**Placeholder scan.** No TBD, TODO, "handle edge cases", or "similar to Task N".
Every code step carries runnable code, and Tasks 3–5 carry an explicit shared
primitive contract plus per-task prop tables rather than a cross-reference.

**Type consistency.** `PermissionDecision` from Task 1 is consumed by
`PermissionNotice` in Task 3 and the gates in Task 11. `ScreenStateId` from Task 2
is consumed by Task 6. `StorageBootstrapState` from Task 8 is consumed by Task 10.
`STORES` from Task 8 is consumed by Task 9. `permitsAction` replaces slice 1's
`isPermitted` at every call site in Task 1.

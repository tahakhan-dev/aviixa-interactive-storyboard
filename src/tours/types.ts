/**
 * Task 15 — the tour engine's own runtime types.
 *
 * REUSED, NOT REDRAWN. `TourAction`/`TourStep`/`TourDefinition` are the
 * task brief's own "Produces" contract verbatim, but the CANONICAL
 * declaration of their shape lives as zod, in
 * `@/data/schemas/crosscutting` (`TourAction`/`TourStep`/`Tour`) — the same
 * schema `src/data/collections/tours.json` is validated against, by both
 * `scripts/validate-collections.mjs` and `boot()`. This file only aliases
 * those inferred types under the names the brief hands down, so there is
 * exactly one place a tour's shape is ever typed, never a hand-written
 * second copy that could drift from what the seed data is actually checked
 * against.
 */
import { z } from 'zod'
import {
  TourAction as TourActionSchema,
  TourStep as TourStepSchema,
  Tour as TourSchema,
} from '@/data/schemas/crosscutting'

export type TourAction = z.infer<typeof TourActionSchema>
export type TourStep = z.infer<typeof TourStepSchema>
export type TourDefinition = z.infer<typeof TourSchema>

export type TourRunnerStatus = 'idle' | 'playing' | 'paused' | 'failed' | 'done'

/**
 * The brief's own `state` contract is exactly `{ tourId, stepIndex, status
 * }`. `error` is an ADDITION, not a substitution — every one of those three
 * fields is still here, unchanged — required by pass criterion 3: "records
 * which step and why". There is no other field in the declared contract
 * that could carry it, and a superset of a required shape still satisfies
 * that shape.
 */
export interface TourRunnerState {
  readonly tourId: string | null
  readonly stepIndex: number
  readonly status: TourRunnerStatus
  readonly error: { readonly stepId: string; readonly reason: string } | null
}

export type PlaybackSpeed = 0.5 | 1 | 2

export interface TourRunner {
  start(id: string): void
  pause(): void
  resume(): void
  next(): void
  back(): void
  restart(): void
  setSpeed(x: PlaybackSpeed): void
  /** Stops the runner and leaves the application exactly as the tour left it. */
  takeOver(): void
  exit(): void
  readonly state: TourRunnerState
  /**
   * ADDITION, not part of the brief's literal three-field `state` shape
   * either: a live overlay (Task 16) has to know when `state` changes to
   * re-render. Every other stateful door in this codebase
   * (`Repository#subscribe`, `Query`) exposes exactly this shape for
   * exactly this reason.
   */
  subscribe(listener: () => void): () => void
}

/**
 * The one capability the runner cannot reach through the DOM alone: real
 * client-side navigation through the product's own Next.js router — the
 * same function every `<Link>` in this codebase ultimately calls
 * (`next/navigation`'s `useRouter().push`). Everything else a tour does
 * resolves a `data-control-id` element on the current page and drives it
 * with native browser events; `navigate` has no control to resolve (there
 * is no "go to any route" button anywhere in the product), so it is the one
 * action a caller must inject a real implementation for. Whoever mounts a
 * `TourRunner` (Task 16's overlay; this task's own live-verification
 * harness) supplies it from a Client Component's own `useRouter()` — never
 * a second, home-grown route table.
 */
export interface TourHost {
  navigate(route: string): void
}

import { z } from 'zod'
import { Tour } from '@/data/schemas/crosscutting'
import toursRaw from './collections/tours.json'

const TOURS = z.array(Tour).parse(toursRaw)

export interface LinkedTour {
  readonly id: string
  readonly title: string
}

/**
 * Task 18 — the one join a coverage item card needs: which tours cover it.
 *
 * `crosscutting.Tour` carries exactly one linking field, `workflowId`
 * (nullable), so that is what this matches against — any of the fourteen
 * inventories' item ids, not only workflow ids: correct today (all three
 * seed tours carry `workflowId: null`, per `app/workflows/WorkflowIndex.tsx`'s
 * own header comment, so this resolves to zero for every item) and
 * forward-compatible the day a tour targets a non-workflow item through the
 * same field.
 *
 * A plain synchronous, schema-validated read of the seed file, not a trip
 * through `src/data/repository.ts`'s async `Repository`/`AccessContext` —
 * that boots real IndexedDB persistence (`src/persistence/bootstrap`) and
 * cannot run inside a static-export build's synchronous Server render, and
 * tours carry no meaningful tenant scope to lose by skipping it (repository
 * comment: "moot for tours today -- it resolves to 'none', no tenant path,
 * visible to any signed-in identity").
 *
 * WHY THIS FILE, NOT A DIRECT IMPORT FROM CALLERS. Master prompt §12.6,
 * enforced by `pnpm lint`'s `local/no-cross-tree-import`: nothing outside
 * `src/data/**` may import `src/data/collections/*.json` directly. This
 * file lives inside `src/data/` and is the one door other trees use instead
 * — the same shape `src/data/boot.ts` and `src/tours/registry.ts` already
 * use for the rest of this collection.
 */
export function toursLinkedTo(itemId: string): readonly LinkedTour[] {
  return TOURS.filter((t) => t.workflowId === itemId).map((t) => ({ id: t.id, title: t.title }))
}

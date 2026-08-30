/**
 * Task 15 — where tour definitions come from.
 *
 * Read through the SAME door as every other collection: `Repository#list`/
 * `#get` against the `'tours'` collection (`src/data/collections/tours.json`,
 * validated at boot by the SAME `crosscutting.Tour` schema
 * `scripts/validate-collections.mjs` checks). There is no second,
 * directly-`import`-ed copy of the JSON here — `boot()` (`@/data/boot`)
 * already loads and validates it once, into the one `Store` this session
 * uses, and reading it back out through `Repository` is what lets a tour
 * definition benefit from the same withinScope visibility rule every other
 * collection gets (moot for `tours` today — it resolves to `'none'`, no
 * tenant path, visible to any signed-in identity — but it is the honest
 * door rather than a shortcut around it).
 *
 * `RowOf<'tours'>` (`@/data/repository`) and `TourDefinition`
 * (`./types`) are the SAME inferred type — both trace back to
 * `crosscutting.Tour` — so no cast is needed anywhere in this file.
 */
import type { AccessContext, Repository } from '@/data/repository'
import type { TourDefinition } from './types'

export function listTours(repository: Repository, ctx: AccessContext): readonly TourDefinition[] {
  return repository.list('tours', ctx).all()
}

export function getTour(
  repository: Repository,
  ctx: AccessContext,
  id: string,
): TourDefinition | undefined {
  return repository.get('tours', id, ctx)
}

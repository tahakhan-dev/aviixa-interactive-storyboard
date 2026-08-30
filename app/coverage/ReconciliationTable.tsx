import { Table } from '@/ui/primitives'
import type { ReconciliationRow } from '@/registry/schemas'

/**
 * Task 18 — the master prompt §9.6 reconciliation table, extracted into its
 * own component so `app/coverage/page.tsx` composes it rather than inlining
 * it. The column names are §9.6's own words: candidate, extracted count,
 * count scope, deduplication rule, delta, resolution.
 *
 * The two 81s — modules and workflows — are DIFFERENT COUNT SCOPES and must
 * never be conflated: modules' row states 81 as a closed, reconciled total
 * (count scope "closed, reconciled"); the workflows row's own resolution
 * states plainly that the source fixes no workflow total anywhere and that
 * 81 is the MODULE count, not a workflow count (`registries/generated/
 * source-reconciliation.json`, and `src/coverage/descriptors.ts`'s own
 * `workflows` note repeats it). This component renders whatever the artefact
 * says without paraphrasing it, so that distinction is the data's own words,
 * not this file's.
 *
 * Markup and content are unchanged from what `app/coverage/page.tsx` inlined
 * before this task — `tests/coverage/reconciliation-table.test.ts` asserts
 * on the rendered table by caption and by row, and this extraction is not
 * the place to also change what it says.
 */
export function ReconciliationTable({ rows }: { readonly rows: readonly ReconciliationRow[] }) {
  return (
    <Table
      caption={`${rows.length} reconciliation rows, each with the master prompt candidate, the count extracted from the frozen source, the count scope, the deduplication rule, the delta and the resolution.`}
      columns={[
        { key: 'inventory', header: 'Inventory' },
        { key: 'prompt_candidate', header: 'Candidate' },
        { key: 'extracted_count', header: 'Extracted count' },
        { key: 'count_scope', header: 'Count scope' },
        { key: 'dedup_rule', header: 'Deduplication rule' },
        { key: 'delta', header: 'Delta' },
        { key: 'resolution', header: 'Resolution' },
      ]}
      rows={rows.map((r) => ({
        /*
          PLAIN TEXT, NOT A SECOND LINK. The registry table above already
          links every one of the fourteen indexes by the same name, and a
          second anchor with identical text and target adds a duplicate link
          name to the accessibility tree for no navigation a reader did not
          already have. The row that indexes none of the fourteen carries
          its reason instead.
        */
        inventory:
          r.registry_slug === null ? (
            <>
              {r.inventory}
              <br />
              <span className="text-xs">{r.whyNoRegistrySlug}</span>
            </>
          ) : (
            r.inventory
          ),
        prompt_candidate: r.prompt_candidate,
        extracted_count: r.extracted_count,
        count_scope: r.count_scope,
        dedup_rule: r.dedup_rule,
        delta: r.delta,
        resolution: r.resolution,
      }))}
      emptyState={{
        title: 'No reconciliation rows',
        whatCreatesIt: 'registries/generated/source-reconciliation.json',
      }}
    />
  )
}

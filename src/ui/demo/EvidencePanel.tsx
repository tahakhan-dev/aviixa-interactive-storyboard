'use client'

import { usePathname } from 'next/navigation'
import { loadRegistry } from '@/registry/load'
import { GeneratedRegistrySchema, type GeneratedRegistry, type RegistryRow } from '@/coverage/registry-schema'
import modulesRaw from '../../../registries/generated/modules.json'
import functionsRaw from '../../../registries/generated/functions.json'
import featuresRaw from '../../../registries/generated/features.json'
import subFeaturesRaw from '../../../registries/generated/sub-features.json'
import actionableControlsRaw from '../../../registries/generated/actionable-controls.json'

/**
 * Task 14 pass criterion 4 / §8.6.2: "Inspector holds every source/
 * decision/acceptance reference for the current screen — and no product
 * screen renders any of them." This panel is the reason a product screen
 * never has to: it is the ONE place this material is allowed to render,
 * keyed by the current route (`usePathname()`), so a screenshot of the
 * product with chrome hidden never carries a locator, a source
 * classification or a story-step sentence — see the design doc's audit
 * (§1.1) for exactly what that content used to look like when it rendered
 * on the product screen itself instead of here.
 *
 * FIX ROUND 1 (Important): the first cut hand-populated one route ("/")
 * and left every other route on a generic placeholder — real for that one
 * screen, fabricated-by-omission for the other 102. `registries/generated/
 * modules.json` carries a real `route` field alongside `sourceLine` and
 * `sourceClass` (67 distinct routes, of 81 module rows), and
 * `functions.json`/`features.json`/`sub-features.json`/
 * `actionable-controls.json` all carry `moduleId`, joining back to it.
 * That is real, sourced, per-route data — Source and Acceptance below are
 * now derived from it, not invented. Decision and Test stay honest
 * placeholders for EVERY route, module-linked or not: no decision-log
 * registry and no live-verification ledger exists anywhere in this build
 * yet (checked — `docs/process/ledgers/live-verification-ledger.json` is
 * not present), so there is nothing true to cite for either category on
 * any screen. A placeholder that is honest about a missing category is not
 * the same defect as a placeholder standing in for data that does exist —
 * see the per-field reasoning below.
 */
interface EvidenceEntry {
  readonly source: readonly string[]
  readonly decision: readonly string[]
  readonly acceptance: readonly string[]
  readonly test: readonly string[]
}

const MODULES: GeneratedRegistry = loadRegistry(GeneratedRegistrySchema, modulesRaw, 'generated registry "modules"')
const FUNCTIONS: GeneratedRegistry = loadRegistry(GeneratedRegistrySchema, functionsRaw, 'generated registry "functions"')
const FEATURES: GeneratedRegistry = loadRegistry(GeneratedRegistrySchema, featuresRaw, 'generated registry "features"')
const SUB_FEATURES: GeneratedRegistry = loadRegistry(
  GeneratedRegistrySchema,
  subFeaturesRaw,
  'generated registry "sub-features"',
)
const ACTIONABLE_CONTROLS: GeneratedRegistry = loadRegistry(
  GeneratedRegistrySchema,
  actionableControlsRaw,
  'generated registry "actionable-controls"',
)

/** route -> every module row that names it. Almost always one; kept as a list rather than assuming. */
const MODULES_BY_ROUTE: ReadonlyMap<string, readonly RegistryRow[]> = (() => {
  const map = new Map<string, RegistryRow[]>()
  for (const row of MODULES.rows) {
    if (row.route === undefined) continue
    const existing = map.get(row.route)
    if (existing) existing.push(row)
    else map.set(row.route, [row])
  }
  return map
})()

/**
 * `moduleId`-joined registries, each named alongside its own file so a
 * reader can go verify the count directly rather than trust the panel.
 */
const MODULE_ID_LINKED_REGISTRIES: readonly { readonly name: string; readonly registry: GeneratedRegistry }[] = [
  { name: 'functions.json', registry: FUNCTIONS },
  { name: 'features.json', registry: FEATURES },
  { name: 'sub-features.json', registry: SUB_FEATURES },
  { name: 'actionable-controls.json', registry: ACTIONABLE_CONTROLS },
]

function sourceFor(row: RegistryRow): string {
  const classification = row.sourceClass ?? 'classification not recorded'
  const label = row.label ?? row.id
  return `${row.id} "${label}" — ${classification}, blueprint line L${row.sourceLine} (registries/generated/modules.json)`
}

/** Real counts only — never a fabricated pass/fail, and named-but-zero is reported as zero, not omitted. */
function acceptanceFor(moduleId: string): readonly string[] {
  const lines: string[] = []
  for (const { name, registry } of MODULE_ID_LINKED_REGISTRIES) {
    const rows = registry.rows.filter((r) => r.moduleId === moduleId)
    if (rows.length === 0) continue
    const demonstrated = rows.filter((r) => r.status === 'demonstrated-in-storyboard').length
    lines.push(`${demonstrated} of ${rows.length} demonstrated-in-storyboard (registries/generated/${name})`)
  }
  return lines.length > 0
    ? lines
    : ['No functions/features/sub-features/actionable-controls registry row names this module id.']
}

/**
 * No decision-log registry exists in this build (no `registries/generated/
 * decisions.json` or equivalent) — closing this gap means authoring one,
 * out of this task's scope.
 */
const NO_DECISION_SOURCE: readonly string[] = [
  'No decision-log registry exists in this build yet — nothing to cite honestly for any route until one is authored.',
]

/**
 * `docs/process/ledgers/live-verification-ledger.json` (design doc §8) is
 * not present yet — closing this gap means running §2.3 live verification
 * and recording it there, out of this task's scope.
 */
const NO_TEST_SOURCE: readonly string[] = [
  'No live-verification ledger exists yet (docs/process/ledgers/live-verification-ledger.json is not present) — nothing to cite honestly for any route until one is recorded.',
]

/**
 * A route with no module row at all — either a surface/section index shell
 * (e.g. `/hub/`, `/studio/`) rather than a single module screen, or a
 * module whose row has not been given a `route` yet (14 of the 81 rows in
 * `modules.json` carry none). Closing this means either giving that row a
 * `route`, upstream in `scripts/build-registries.mjs`, or (for a shell
 * page) accepting it will never have exactly one module row to cite.
 */
const NO_MODULE_ROW: readonly string[] = [
  'No module registry row (registries/generated/modules.json) names this route.',
]

function evidenceFor(pathname: string | null): EvidenceEntry {
  const rows = pathname !== null ? MODULES_BY_ROUTE.get(pathname) : undefined
  if (rows === undefined || rows.length === 0) {
    return { source: NO_MODULE_ROW, decision: NO_DECISION_SOURCE, acceptance: NO_MODULE_ROW, test: NO_TEST_SOURCE }
  }
  return {
    source: rows.map(sourceFor),
    decision: NO_DECISION_SOURCE,
    acceptance: rows.flatMap((row) => acceptanceFor(row.id)),
    test: NO_TEST_SOURCE,
  }
}

function EvidenceList({ label, items }: { label: string; items: readonly string[] }) {
  return (
    <div data-demo="evidence-group">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#c9b3ff]">{label}</div>
      <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function EvidencePanel() {
  const pathname = usePathname()
  const entry = evidenceFor(pathname)

  return (
    <div data-demo="evidence-panel" className="flex flex-col gap-2 text-xs">
      <div className="text-[#c9b3ff]">
        Evidence for <span data-demo="evidence-path">{pathname ?? '(unknown route)'}</span>
      </div>
      <EvidenceList label="Source" items={entry.source} />
      <EvidenceList label="Decision" items={entry.decision} />
      <EvidenceList label="Acceptance" items={entry.acceptance} />
      <EvidenceList label="Test" items={entry.test} />
    </div>
  )
}

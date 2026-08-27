'use client'

import { usePathname } from 'next/navigation'

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
 */
interface EvidenceEntry {
  readonly source: readonly string[]
  readonly decision: readonly string[]
  readonly acceptance: readonly string[]
  readonly test: readonly string[]
}

/**
 * Seeded with the one entry this build can source honestly today: this
 * mechanism's own evidence. Per-screen entries for the 102 existing routes
 * are §24.3 loop-ledger work carried by each workflow unit as it rebuilds
 * that screen (design doc §9) — inventing entries for routes nobody has
 * rebuilt yet would be exactly the fabricated-content problem this panel
 * exists to prevent, just moved from the product screen into the chrome.
 */
const EVIDENCE_BY_PATH: Readonly<Record<string, EvidenceEntry>> = {
  '/': {
    source: [
      'AVIIXA_Production_Product_Blueprint.md (frozen source, sha256 47bd18db4678…c0b27) — §7.3.1, §8.6.2, §10.3',
    ],
    decision: [
      'docs/superpowers/specs/2026-08-26-product-fidelity-rebuild-design.md §5 "Demo chrome", §2.1 "The one-way edge"',
    ],
    acceptance: ['.superpowers/sdd/2026-08-26-runway/task-14-brief.md — Step 1 pass criteria (1–5)'],
    test: [
      '.superpowers/sdd/2026-08-26-runway/task-14-report.md — live-verification screenshots, DOM/accessibility-tree counts, audit row count/last-row-id before and after a persona switch',
    ],
  },
}

const FALLBACK_EVIDENCE: EvidenceEntry = {
  source: [
    'Not yet catalogued for this route — the §8.6.2 presentational rebuild for this screen has not shipped (design doc §9, "workflow units, along the §24.2 dependency arc").',
  ],
  decision: ['docs/superpowers/plans/2026-08-26-runway.md'],
  acceptance: [
    'registries/generated/* — the fourteen-inventory census this screen will be scored against once its workflow unit ships.',
  ],
  test: ['No live-verification ledger row exists for this screen yet (docs/process/ledgers/live-verification-ledger.json).'],
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
  const entry = (pathname !== null && EVIDENCE_BY_PATH[pathname]) || FALLBACK_EVIDENCE

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

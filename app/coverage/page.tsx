import type { Metadata } from 'next'
import Link from 'next/link'
import {
  REGISTRY_DESCRIPTORS,
  COVERAGE_STATUSES,
  countByStatus,
  SOURCE_CLASSES,
  BUILD_CLASSES,
  BUILD_CLASS_LABEL,
  countByClass,
  type CoverageStatus,
  type RegistrySlug,
} from '@/coverage/descriptors'
import { Table, StatusPill, type StatusTone } from '@/ui/primitives'
import { loadGeneratedRegistry, type GeneratedRegistry } from '@/coverage/registry-loader'
import { loadReconciliation } from '@/registry/load'
import sourceReconciliationRaw from '../../registries/generated/source-reconciliation.json'
import {
  NAMESPACES_ACCOUNTED_ELSEWHERE,
  UNINVENTORIED_DECISION_LABEL,
  UNINVENTORIED_FAMILIES,
  UNINVENTORIED_IDENTIFIERS,
} from '@/coverage/uninventoried'

export const metadata: Metadata = { title: 'Coverage Dashboard' }

const STATUS_TONE: Record<CoverageStatus, StatusTone> = {
  'demonstrated-in-storyboard': 'ok',
  // `ok`, like a module that owns a screen, because it IS on screen — it
  // mounts inside another module's. The distinction the dashboard draws is in
  // the label and the icon, not in the tone: a reader should not read
  // "mounted" as a lesser degree of built.
  'mounted-in-another-screen': 'ok',
  'decision-blocked': 'attention',
  'not-applicable': 'neutral',
  'not-represented': 'stale',
}

// Deliberately no checkmark glyph anywhere in this map: a check reads as
// "done", and this application has no backend to be done with.
const STATUS_ICON: Record<CoverageStatus, string> = {
  'demonstrated-in-storyboard': '◆',
  'mounted-in-another-screen': '◈',
  'decision-blocked': '⏸',
  'not-applicable': '—',
  'not-represented': '○',
}

const STATUS_LABEL: Record<CoverageStatus, string> = {
  'demonstrated-in-storyboard': 'Demonstrated in storyboard',
  'mounted-in-another-screen': 'Mounted in another module’s screen',
  'decision-blocked': 'Decision blocked',
  'not-applicable': 'Not applicable',
  'not-represented': 'Not represented',
}

/**
 * Every one of the fourteen registries is loaded from its own generated
 * file (`registries/generated/<slug>.json`, written by `scripts/build-
 * registries.mjs`) and checked by the same rule: a registry counts as
 * demonstrated the moment any one of its own rows does. No slug is
 * special-cased and there is no hardcoded fallback for a registry this
 * code has never heard of -- a fifteenth registry added to
 * `REGISTRY_DESCRIPTORS` is covered automatically. If a registry's JSON
 * cannot be read or fails schema validation, `loadGeneratedRegistry`
 * throws at module load: that is a build failure to surface, never a
 * silent `'not-represented'` standing in for a computation that didn't
 * run.
 *
 * Still true, and the reason this was worth fixing: hardcoding a status
 * and running it through a counting function is a tautology dressed up as
 * a computation, because the input is a constant -- a summary built that
 * way cannot move when the thing it claims to summarize moves. That is
 * exactly what this function used to be for thirteen of the fourteen
 * registries. It no longer is; watch the next registry added here doesn't
 * quietly become one either.
 */
const REGISTRIES: Record<RegistrySlug, GeneratedRegistry> = Object.fromEntries(
  REGISTRY_DESCRIPTORS.map((d) => [d.slug, loadGeneratedRegistry(d.slug)]),
) as Record<RegistrySlug, GeneratedRegistry>

/**
 * R4-B12: THIS FUNCTION COULD RETURN TWO OF THE FIVE STATUSES, AND THE LEGEND
 * BELOW RENDERS ALL FIVE.
 *
 * It read "any row is not not-represented" and returned demonstrated, so a
 * registry whose only evidence is a MOUNTED module — a screen that is on
 * screen, with no route of its own — was reported under the word for a screen
 * that owns one. `mounted-in-another-screen` was unreachable here even though
 * ten rows carry it. It now returns the strongest status any of the registry's
 * own rows actually holds, in the order below, which makes three of the five
 * reachable and leaves the honest position visible: a registry with no
 * demonstrated row and a mounted one says mounted.
 *
 * The remaining two — `decision-blocked` and `not-applicable` — are TERMINAL
 * states for an individual row and are deliberately NOT promoted to a whole
 * registry: "this registry is not applicable" is a claim about an inventory
 * the master prompt requires, and nothing in the source supports it. The
 * paragraph under the legend states which of the five no registry currently
 * holds and why, rather than leaving a legend row a reader cannot account for.
 */
const REGISTRY_STATUS_PRECEDENCE = [
  'demonstrated-in-storyboard',
  'mounted-in-another-screen',
  'not-represented',
] as const satisfies readonly CoverageStatus[]

/* ────────────────────────────────────────────────────────────────────────
 * R5-B05 — "TWO OF THE FIVE", WHERE THE LEGEND ABOVE SHOWS THREE.
 *
 * R4-B12 named three statuses that never appear in the registry column and
 * the fix explained two — this build's defect shape 3, a fix reaching some of
 * the call sites its own finding named. The third is
 * `mounted-in-another-screen`, and its absence is structural rather than
 * accidental: `registryStatus` returns it only for a registry holding a
 * mounted row and no demonstrated row, and the only registry holding mounted
 * rows (modules) also holds sixty-nine demonstrated ones, so the precedence
 * order can never reach it.
 *
 * WHICH STATUSES ARE UNHELD IS NOW MEASURED, NOT LISTED. `UNHELD_AT_REGISTRY_
 * LEVEL` is derived from the same tally the legend renders, and the sentence
 * counts that list rather than spelling a number, so the two cannot drift
 * apart again. A status that becomes held disappears from the paragraph on
 * the next build; one that becomes unheld appears in it, with a stated reason
 * if this map has one and an explicit "not yet explained" if it does not —
 * never silently.
 * ──────────────────────────────────────────────────────────────────────── */
const WHY_UNASSIGNABLE: Partial<Record<CoverageStatus, string>> = {
  'decision-blocked':
    'A terminal state for one row, never for a whole inventory. It is emittable per row from ' +
    'registries/authored/census-status-overrides.json and no row holds it today; that file ' +
    'records why, measured rather than assumed.',
  'not-applicable':
    'Also a per-row terminal state. Twenty-two rows hold it — the do-not-use-cron register ' +
    'inside actionable controls — and no whole registry does: saying an inventory the master ' +
    'prompt requires does not apply is a claim nothing in the frozen source supports.',
  'mounted-in-another-screen':
    'Reachable in the rule and unreachable in this data, which is a structural fact rather ' +
    'than an accident. A registry reports it only when it holds a mounted row and no ' +
    'demonstrated row; the only registry holding mounted rows is Modules, which also holds ' +
    'demonstrated ones, and demonstrated wins the precedence. The status is not empty at ' +
    'ITEM level — the item counts above show how many rows hold it.',
}

function registryStatus(slug: RegistrySlug): CoverageStatus {
  const held = new Set(REGISTRIES[slug].rows.map((r) => r.status))
  return REGISTRY_STATUS_PRECEDENCE.find((s) => held.has(s)) ?? 'not-represented'
}

/* ────────────────────────────────────────────────────────────────────────
 * R4-B11 — THE ITEM-LEVEL POSITION, BESIDE THE REGISTRY-LEVEL ONE.
 *
 * The only aggregate this page carried was registry-level: "Demonstrated in
 * storyboard: 11 of 14". The rule behind it is disclosed a paragraph above and
 * it is not a falsehood — but 11 of 14 reads as about 79 per cent to a client,
 * and the item-level figure is a small fraction of that. Neither 5,018 nor the
 * not-represented count appeared anywhere in the built page.
 *
 * Every figure below is summed over the fourteen loaded registries at module
 * load. None is a literal, for the reason this file already gives twice: a
 * count that cannot move when its subject moves does not get written down.
 * ──────────────────────────────────────────────────────────────────────── */
const ALL_ROWS = REGISTRY_DESCRIPTORS.flatMap((d) => REGISTRIES[d.slug].rows)
const ITEM_SUMMARY = countByStatus(ALL_ROWS)
const TOTAL_ITEMS = ALL_ROWS.length

/**
 * R4-B01/B02: the master prompt §9.6 reconciliation table, which held all six
 * of its required columns in `registries/generated/source-reconciliation.json`
 * and reached no reader at all — `grep -rl "prompt_candidate" out/` returned
 * zero files. Its only consumer was the Workflow Index, for one scalar.
 */
const RECONCILIATION = loadReconciliation(sourceReconciliationRaw)
const RECONCILIATION_ROWS = RECONCILIATION.reconciliation.reconciliation_rows

const REGISTRY_STATUS_ENTRIES: readonly { status: CoverageStatus }[] = REGISTRY_DESCRIPTORS.map(
  (d) => ({ status: registryStatus(d.slug) }),
)
const RECONCILIATION_SUMMARY = countByStatus(REGISTRY_STATUS_ENTRIES)

/** R5-B05: the statuses no registry holds, read off the tally the legend renders. */
const UNHELD_AT_REGISTRY_LEVEL: readonly CoverageStatus[] = COVERAGE_STATUSES.filter(
  (status) => RECONCILIATION_SUMMARY[status] === 0,
)

/**
 * Task 10 / addendum §5: source-defined and derived are counted from
 * `modules.json`'s own `sourceClass` field on each row -- a STRUCTURED
 * value the build script maps straight from the raw extraction's
 * `classification`, never parsed out of `RegistryDescriptor.sourceNote`
 * prose. This is the one place in the whole build that reads 63 for
 * modules' source-defined count -- everywhere else (the table above,
 * `RegistryDescriptor.expectedCount`) correctly reads 81, the total
 * inventory count; 63 is a narrower, different figure (only the SoW-Fact
 * modules) and must never replace 81 as "the" module count.
 *
 * Major (final review): every count below (81/63/18) used to be a bare
 * literal in the JSX -- a hardcoded assumption of exactly the kind gate 1
 * exists to forbid, and it shipped past the gate because the gate only
 * scanned one other, unrelated file. Both `TOTAL_MODULES` and the source-
 * class counts are now derived from the same loaded registry every render.
 */
/**
 * The families' own titles, lower-cased and joined — derived, so the prose
 * cannot list four kinds of thing while the table renders seven. It listed
 * four while the build shipped seven, which is audit finding C-27.
 */
const FAMILY_KINDS = UNINVENTORIED_FAMILIES.map((f) => f.title.toLowerCase()).join('; ')

const MODULES_REGISTRY = REGISTRIES.modules
const MODULES_CLASS_COUNTS = countByClass(MODULES_REGISTRY.rows)
const TOTAL_MODULES = MODULES_REGISTRY.rows.length

export default function CoveragePage() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">AVIIXA</p>
      <h1 className="mt-2 text-3xl font-semibold">Coverage Dashboard</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        Simulated behaviour only. Every row below states what this storyboard
        actually shows today, never what a finished product would show.
      </p>

      <div className="mt-6">
        <Table
          caption="The fourteen source-derived inventories the master prompt names, and this build's honest status against each."
          columns={[
            { key: 'registry', header: 'Registry' },
            { key: 'expected', header: 'Reconciled count' },
            { key: 'status', header: 'Status in this build' },
          ]}
          rows={REGISTRY_DESCRIPTORS.map((d) => ({
            // Blocking 2 (final review): the Workflow Index (`/workflows/`)
            // is the real, populated index for this registry; `/coverage/
            // workflows/` is a generic per-registry placeholder page that
            // itself now just points here (see app/coverage/[registry]/
            // page.tsx) rather than being a second, permanently-empty page
            // for the same concept. Link straight to the real one.
            registry: (
              <Link href={d.slug === 'workflows' ? '/workflows/' : `/coverage/${d.slug}/`}>
                {d.title}
              </Link>
            ),
            /*
              R5-B01 — THE CELL THAT TOLD A READER THE SOURCE IS SILENT,
              THREE COLUMNS FROM THE ROW SAYING IT IS CLOSED.

              Every registry with a null `expectedCount` printed one generic
              sentence: "No single closed count in the frozen source". That is
              a claim about the DOCUMENT, and for Commands the document
              refutes it — the source fixes five command classes in ten places,
              Appendix L publishes them, and row 6 of the reconciliation table
              on this same page reads "5, closed", delta 0, CONFIRMED.

              What is actually true is the descriptor's own note: five classes,
              sixteen instances and fifty-seven identifiers are three separate
              registers and this build asserts no single count ACROSS them.
              Each descriptor already says that in its own words, so the cell
              renders that instead of a sentence that generalises ten different
              situations into one false one. The other nine notes were read
              against the source as well; Commands was the only one the
              generic sentence misrepresented.
            */
            expected: d.expectedCount === null ? d.sourceNote : `${d.expectedCount}`,
            status: (
              <StatusPill
                tone={STATUS_TONE[registryStatus(d.slug)]}
                icon={STATUS_ICON[registryStatus(d.slug)]}
                label={STATUS_LABEL[registryStatus(d.slug)]}
              />
            ),
          }))}
          emptyState={{
            title: 'No registries defined',
            whatCreatesIt: 'REGISTRY_DESCRIPTORS',
          }}
        />
      </div>

      <h2 className="mt-8 text-xl font-semibold">Reconciliation summary</h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Counted across the fourteen registries above, one status per
        registry — each checked against its own item-level rows in
        <code>registries/generated/&lt;slug&gt;.json</code>, never against a
        single registry standing in for all fourteen. A registry counts as
        demonstrated the moment any one of its own rows does.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
        {COVERAGE_STATUSES.map((status) => (
          <li key={status}>
            {STATUS_LABEL[status]}: {RECONCILIATION_SUMMARY[status]} of {REGISTRY_DESCRIPTORS.length}{' '}
            registries — {ITEM_SUMMARY[status]} of {TOTAL_ITEMS} items
          </li>
        ))}
      </ul>
      {/*
        R4-B11. The two denominators, side by side and at equal prominence,
        because one of them reads as the whole truth and is not. Both figures
        are summed at module load from the same fourteen files the table above
        renders, so neither can go stale against the other.
      */}
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        <strong>Two denominators, and the smaller number is the honest one.</strong> A registry
        counts as demonstrated the moment any one of its rows does, so the registry-level figure
        answers &ldquo;has this build touched this inventory at all&rdquo;. The item-level figure
        answers &ldquo;how much of it&rdquo;, and it is the one to read: across all fourteen
        inventories this build holds {TOTAL_ITEMS} rows, of which{' '}
        {ITEM_SUMMARY['demonstrated-in-storyboard']} are demonstrated by a shipped screen,{' '}
        {ITEM_SUMMARY['mounted-in-another-screen']} are mounted inside another module&rsquo;s
        screen, {ITEM_SUMMARY['not-applicable']} carry an authored not-applicable record,{' '}
        {ITEM_SUMMARY['decision-blocked']} carry an authored decision-blocked record, and{' '}
        {ITEM_SUMMARY['not-represented']} are not represented. Read the registry-level row as a
        presence check and the item-level row as the coverage.
      </p>
      {/*
        R4-B12, corrected by R5-B05. The count comes from the derived list's
        own length, so it cannot say "two" beside a legend showing three
        again.
      */}
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        <strong>
          {UNHELD_AT_REGISTRY_LEVEL.length} of the {COVERAGE_STATUSES.length} statuses never appear
          in the registry column above
        </strong>
        , and that is a rule rather than an accident.{' '}
        {UNHELD_AT_REGISTRY_LEVEL.map(
          (status) =>
            `${STATUS_LABEL[status]}: ${
              WHY_UNASSIGNABLE[status] ??
              'no reason has been written for this one yet, which is itself the finding — a legend row a reader cannot account for.'
            }`,
        ).join(' ')}
      </p>

      {/*
        ─────────────────────────────────────────────────────────────────────
        R4-B01 / R4-B02 — THE MASTER PROMPT §9.6 RECONCILIATION TABLE, ON A
        SCREEN.

        `registries/generated/source-reconciliation.json` has carried all six
        of §9.6's required columns since slice 1 and reached no reader:
        `grep -rl "prompt_candidate" --include='*.html' out/` returned zero
        files, and this page did not import the artefact at all. Eighty
        kilobytes of the build's best reconciliation analysis — including the
        one place that settles the 81-modules-against-81-workflows conflation
        with its locators — was invisible to the person it was written for.

        §9.6 requires the table in the coverage dashboard AND the review
        package. It is now in both.

        THE COLUMN NAMES ARE §9.6'S OWN WORDS, not this build's paraphrase of
        them: candidate, extracted count, count scope, deduplication rule,
        delta, resolution.
        ───────────────────────────────────────────────────────────────────── */}
      <h2 className="mt-8 text-xl font-semibold">
        Source reconciliation — candidate against extracted count
      </h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        One row per inventory: what the master prompt offered as a validation candidate, what a
        read of the frozen source actually found, the scope each figure is counted in, the rule
        that gets from the raw extraction to the reconciled figure, the delta, and how it was
        resolved. Where the two disagree the frozen source wins and the delta is recorded rather
        than the count silently substituted. {RECONCILIATION_ROWS.length} rows, covering all{' '}
        {REGISTRY_DESCRIPTORS.length} registries above —{' '}
        {RECONCILIATION_ROWS.filter((r) => r.registry_slug === null).length} further rows carry no
        registry slug of their own, and each states beside its own name why: either nothing among
        the fourteen indexes holds that count, or its rows render inside another index as a
        sub-register.
      </p>
      {/*
        R5-B09. This sentence read "…further rows reconcile counts that none of
        the fourteen indexes, and each says why in its own scope column." Three
        things were wrong with fourteen words. A verb was missing. The reason
        renders under the Inventory cell, not the scope column. And the claim
        was false of one of the four: row 11's own whyNoRegistrySlug, three
        columns to the right, says its 22 do-not-use-cron rows DO render on the
        actionable-controls index — and they do. The replacement states the
        disjunction instead of asserting the half that is wrong, and names no
        split count, because a split nothing derives is the next figure to go
        stale.
      */}
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        This is the one artefact in the build that is authored rather than generated, and it sits
        in <code>registries/generated/</code> beside thirteen files that are not. It is the single
        named exception in <code>tests/coverage/registry-freshness.test.ts</code> for that reason:
        a freshness check that regenerated it would have nothing to regenerate it from. The
        absence of a freshness check on this file is deliberate, not an oversight — what holds it
        instead is <code>tests/coverage/reconciliation-table.test.ts</code>, which requires its
        row set to cover every registry slug by equality.
      </p>
      <div
        className="mt-4 overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Source reconciliation table, scrollable horizontally"
      >
        <Table
          caption={`${RECONCILIATION_ROWS.length} reconciliation rows, each with the master prompt candidate, the count extracted from the frozen source, the count scope, the deduplication rule, the delta and the resolution.`}
          columns={[
            { key: 'inventory', header: 'Inventory' },
            { key: 'prompt_candidate', header: 'Candidate' },
            { key: 'extracted_count', header: 'Extracted count' },
            { key: 'count_scope', header: 'Count scope' },
            { key: 'dedup_rule', header: 'Deduplication rule' },
            { key: 'delta', header: 'Delta' },
            { key: 'resolution', header: 'Resolution' },
          ]}
          rows={RECONCILIATION_ROWS.map((r) => ({
            /*
              PLAIN TEXT, NOT A SECOND LINK. The table at the top of this page
              already links every one of the fourteen indexes by the same
              name, and a second anchor with identical text and target adds a
              duplicate link name to the accessibility tree for no navigation
              a reader did not already have. The row that indexes none of the
              fourteen carries its reason instead.
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
      </div>

      {/*
        WHAT THE FOURTEEN DO NOT COVER, SAID ON THE SCREEN RATHER THAN LEFT TO
        INFERENCE.

        The table above is the client's fourteen named inventories, and a reader
        counting them will undercount what the build ships. Some identifier
        families are in NO row of any of the fourteen. The decision that they
        belong in none of them is a client-delegated choice under APP-012, and
        the forbidden outcome was never "no fifteenth registry" -- it was
        leaving shipped identifiers uncounted. So they are counted here.

        HOW MANY FAMILIES THERE ARE IS NOT WRITTEN HERE OR BELOW, and that is
        the fix for audit finding C-27 rather than a style choice. This comment
        and the paragraph under it both said "four" while the build shipped
        three more -- `FAIL-AI-*`, the `AI-NN` abilities and `FB-AGT-*` -- so
        the sentence was false in the one direction the section exists to
        prevent. Both the family count and the identifier count now come from
        `UNINVENTORIED_FAMILIES`, and so does the list of what kind of thing
        each family is.

        Every number below is DERIVED from the register that holds the family,
        at module load. None is a literal: this build spent five tasks on one
        derived number that had twenty-nine hand-maintained copies, eleven of
        them rendered on screens, and the rule that came out of it is that a
        count which cannot move when its subject moves does not get written
        down. `tests/unit/coverage-uninventoried.test.ts` sweeps `src/` and
        `app/` and requires the declared set to EQUAL the shipped set, in both
        directions, so this section cannot silently miss one.
      */}
      <h2 className="mt-8 text-xl font-semibold">
        Shipped identifiers that are in none of the fourteen
      </h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        The fourteen inventories above do not account for everything this build
        ships. {UNINVENTORIED_IDENTIFIERS.length} identifiers across{' '}
        {UNINVENTORIED_FAMILIES.length} families sit in no row of any of them,
        and they are listed here rather than left for a reader to discover by
        subtraction. This is a decision, not an omission: every one of them is a{' '}
        <strong>mechanism</strong> — {FAMILY_KINDS} — rather than an inventory of
        things the product would ship, so a status column asking whether a
        screen “demonstrates” one would be a category error.{' '}
        {UNINVENTORIED_DECISION_LABEL}
      </p>
      <div className="mt-4">
        <Table
          caption="Identifier families this build ships that belong to none of the fourteen inventories, with the register that holds each and the reason a fifteenth inventory would be wrong rather than merely redundant."
          columns={[
            { key: 'family', header: 'Family' },
            { key: 'count', header: 'Identifiers' },
            { key: 'heldIn', header: 'Where it is actually held' },
            { key: 'why', header: 'Why it is in no inventory' },
          ]}
          rows={UNINVENTORIED_FAMILIES.map((family) => ({
            family: (
              <>
                <code>{family.prefix}</code> — {family.title}
              </>
            ),
            count: (
              <>
                {family.identifiers.length} held
                {family.alsoCitedWithoutARecord.length > 0 ? (
                  <>
                    ; {family.alsoCitedWithoutARecord.length} cited with no record of its own (
                    {family.alsoCitedWithoutARecord.map((c) => c.id).join(', ')})
                  </>
                ) : null}
                . {family.sizeMeaning}
              </>
            ),
            heldIn: family.heldIn.map((path) => <code key={path}>{path} </code>),
            why: (
              <>
                {family.whatItIs} {family.whyNotAnInventory}
              </>
            ),
          }))}
          emptyState={{
            title: 'No uninventoried families declared',
            whatCreatesIt: 'UNINVENTORIED_FAMILIES',
          }}
        />
      </div>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        What this costs, said plainly: the fourteen rows above do not add up to
        everything the build ships, and the number the client named stays
        fourteen. That is the conservative half of a delegated choice — no
        descriptor was added and no gate was renumbered — and the shortfall is
        disclosed here instead of being silent.
      </p>

      {/*
        AND THE REST OF THE AI AREA'S IDENTIFIER SHAPES, SO "COUNTED NOWHERE"
        HAS NO REMAINING HIDING PLACE.

        Audit finding C-31: chapter 44's `AC-44-*` and `TEST-44-*` registers are
        cited by nothing this build ships, while the build DOES consume chapter
        44's FB-AGT-* register. NARROWED to those two register names, which is
        what `src/coverage/uninventoried.ts` claims and what measures 0: chapter
        44 also holds the §44A registers, and `AC-44A-*` and `TEST-44A-*` are
        cited throughout this tree (74 and 57 distinct tokens across src/, app/
        and tests/), so "chapter 44's AC-* and TEST-*" was a true claim about
        two registers generalised into a false one about the chapter. Silence there is the same defect as the silence the
        section above exists to end, so the abstention is stated with its
        reason instead. `tests/unit/coverage-uninventoried.test.ts` sweeps
        `src/ai/` for identifier-shaped tokens with no knowledge of what this
        module declares and requires every one to be an inventory row, a family
        member, or a row below.
      */}
      <h2 className="mt-8 text-xl font-semibold">
        The other identifier shapes in the artificial-intelligence area
      </h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Not every identifier shape that appears in the code is an inventory item
        or a family above. These are the rest, each with the place that does
        answer for it — including <code>AC-44-*</code> and{' '}
        <code>TEST-44-*</code>, the two chapter-44 registers this build
        deliberately cites nowhere. Chapter 44&rsquo;s §44A registers are not
        those two and are cited throughout.
      </p>
      <div className="mt-4">
        <Table
          caption="Identifier namespaces in the artificial-intelligence area that belong to neither the fourteen inventories nor an uninventoried family, and where each is answered."
          columns={[
            { key: 'namespace', header: 'Namespace' },
            { key: 'accountedIn', header: 'Answered by' },
            { key: 'why', header: 'Why it is not inventoried' },
          ]}
          rows={NAMESPACES_ACCOUNTED_ELSEWHERE.map((n) => ({
            namespace: (
              <>
                {n.prefixes.map((p) => (
                  <code key={p}>{p} </code>
                ))}
                — {n.title}
              </>
            ),
            accountedIn: n.accountedIn,
            why: n.why,
          }))}
          emptyState={{
            title: 'No namespaces declared',
            whatCreatesIt: 'NAMESPACES_ACCOUNTED_ELSEWHERE',
          }}
        />
      </div>

      <h2 className="mt-8 text-xl font-semibold">Source classification</h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Orthogonal to the status above: this says what the frozen source
        itself claims about an item, never what this build did with it. Of
        the {TOTAL_MODULES} modules, {MODULES_CLASS_COUNTS.source['source-defined']} are
        source-defined (SoW Fact) and {MODULES_CLASS_COUNTS.source.derived} are derived
        (Derived Clarification, DEC-STUDIO-001) — the {MODULES_CLASS_COUNTS.source.derived}{' '}
        Studio modules may never be presented as source-backed. No other
        registry has been classified against the source yet.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
        {SOURCE_CLASSES.map((sourceClass) => (
          <li key={sourceClass}>
            {sourceClass}: {MODULES_CLASS_COUNTS.source[sourceClass]} of {TOTAL_MODULES} modules
          </li>
        ))}
      </ul>

      {/*
        Major (final review): BuildClass/BUILD_CLASS_LABEL existed with zero
        consumers, and countByClass's `.build` half was computed and then
        discarded -- a computed value nobody read and a label nobody
        rendered. No row anywhere sets `buildClass` yet (slices 3-13, which
        would set one, have not run), so every count below is honestly zero
        -- said so in words, not left implicit in an absent section.
      */}
      {/*
        THE REASON GIVEN HERE WAS STALE AND IS REMOVED RATHER THAN RENUMBERED.

        It read "slices 3-13, which would set this, have not run". Slices 3
        through 11 have run, so the sentence was false while the counts it
        explained were correct -- a screen giving a true number for a wrong
        reason, which is the shape this build keeps finding in itself. The
        replacement states the CHECKABLE fact instead: measured across all
        fourteen generated inventories, no row carries a `buildClass` at all.
        That claim moves when the data moves; a claim about which slices have
        run does not.
      */}
      <h2 className="mt-8 text-xl font-semibold">Build classification</h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Also orthogonal to status: this would say what THIS BUILD did with
        an item — demonstrated in the storyboard, not applicable, or
        blocked on an open client decision. No row in any of the fourteen
        generated inventories carries a build classification, so every count
        below is honestly zero rather than fabricated. The status column in
        the table above is what currently answers “what did this build do
        with it”, and it answers from a shipped route screen rather than from
        a classification anyone typed.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
        {BUILD_CLASSES.map((buildClass) => (
          <li key={buildClass}>
            {BUILD_CLASS_LABEL[buildClass]}: {MODULES_CLASS_COUNTS.build[buildClass]} of {TOTAL_MODULES}{' '}
            modules
          </li>
        ))}
      </ul>
    </main>
  )
}

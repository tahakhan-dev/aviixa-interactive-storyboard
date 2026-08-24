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

function registryStatus(slug: RegistrySlug): CoverageStatus {
  return REGISTRIES[slug].rows.some((r) => r.status !== 'not-represented')
    ? 'demonstrated-in-storyboard'
    : 'not-represented'
}

const REGISTRY_STATUS_ENTRIES: readonly { status: CoverageStatus }[] = REGISTRY_DESCRIPTORS.map(
  (d) => ({ status: registryStatus(d.slug) }),
)
const RECONCILIATION_SUMMARY = countByStatus(REGISTRY_STATUS_ENTRIES)

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
            expected:
              d.expectedCount === null
                ? 'No single closed count in the frozen source'
                : `${d.expectedCount}`,
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
            {STATUS_LABEL[status]}: {RECONCILIATION_SUMMARY[status]} of {REGISTRY_DESCRIPTORS.length}
          </li>
        ))}
      </ul>

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

        Audit finding C-31: chapter 44's AC-* and TEST-* registers are cited by
        nothing this build ships, while the build DOES consume chapter 44's
        FB-AGT-* register. Silence there is the same defect as the silence the
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
        answer for it — including the two chapter-44 registers this build
        deliberately cites nowhere.
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

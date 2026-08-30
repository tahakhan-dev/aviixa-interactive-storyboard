'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { surfaceById } from '@/domain/surfaces'
import {
  STU_MODULES,
  STU_PERSONAS,
  stuModuleReachFor,
  stuPersonaById,
  type StudioModuleDefinition,
  type StudioPersonaId,
} from '@/studio/modules'
import { STU_SCREENS, stuScreensForModule, type StudioScreenId } from '@/studio/screens'
import { PrototypeDisclosure } from '@/ui/sa/PrototypeDisclosure'
import { Breadcrumbs, Select } from '@/ui/primitives'

const SURFACE = surfaceById('SURF-STU')

/**
 * The shell every Studio route renders under, and the ONE place this
 * surface's navigation policy is decided. Plan C1 — the per-module contract
 * says "wrap in the surface shell" and, before this task, no task created
 * one.
 *
 * THE SHELL HOLDS THE POLICY; `src/ui/` HOLDS NONE. "Taking a button off
 * the screen does not stop anyone", so a component that decided who may see
 * a route would be deciding something only the enforcement layer may, and
 * `tests/coverage/contract-gates.test.ts` forbids it outright. The Hub
 * learned this expensively: a fix put one permission check into a component
 * and broke a merged architectural gate nobody ran for four tasks. So this
 * file — which is in `app/` — asks every question, and hands `src/ui/`
 * components finished answers. There is deliberately no `StudioChrome`
 * component: one file draws this chrome, so there is nothing to hand a
 * decision to.
 *
 * WHY THE ROUTE REGISTRY IS NOT THE SOURCE FOR "MAY THIS PERSONA OPEN THE
 * STUDIO". `src/routes/definitions.ts` answers that question for SURF-DOH
 * with a role list, and a list can only say yes or no. The source's own
 * answer here has three values — row 1 of the consolidated matrix (L34541)
 * reads `Client Decision Required — DEC-AUDSTU-001` for the Read-only
 * Auditor, and `AC-STU-157` (L34674) requires it to stay unassumed. Reading
 * it as a refusal is the live defect plan C16 names; reading it as a grant
 * asserts an access the source withholds; widening `allowedRoles` to
 * include the Auditor would do the second silently, which C16 forbids
 * expressly. So the three-valued token on the persona record is what this
 * shell reads, and `tests/component/stu-shell.test.tsx` cross-checks it
 * against the route registry everywhere the registry can answer, exempting
 * the one persona it cannot express and naming that exemption.
 */
export interface StudioShellProps {
  /** Supplied by a module route; omitted on the module index. */
  readonly module?: StudioModuleDefinition
  /**
   * The registry the index draws from. Defaults to `STU_MODULES` and no
   * product caller passes it — it exists so the index's own decisions can
   * be driven over a registry the caller controls.
   *
   * WITHOUT IT THE FAIL-CLOSED ASSERTION IS VACUOUS, and that was found by
   * planting the defect rather than by reading the code: today every module
   * has `routeBuilt === false`, so "offers no link for a module whose reach
   * is not derived" was satisfied by the route not existing, and inverting
   * the reach check left the suite green. A test that passes on the code
   * and on its own negation is the shape this build has shipped four times.
   */
  readonly modules?: readonly StudioModuleDefinition[]
  /**
   * Which of this module's catalogue-B screens this route annotates, where
   * the module has more than one. `MOD-STU-18` has two (`SCR-STU-15` and
   * `SCR-STU-01`) and they are two routes; omitting this annotates with all
   * of the module's rows.
   */
  readonly screenId?: StudioScreenId
  /** Which seeded persona's view renders. Owned by the calling screen. */
  readonly persona?: StudioPersonaId
  readonly onPersonaChange?: (persona: StudioPersonaId) => void
  readonly children?: ReactNode
}

const PERSONA_OPTIONS = STU_PERSONAS.map((p) => ({ value: p.id, label: p.name }))

function isPersona(value: string): value is StudioPersonaId {
  return STU_PERSONAS.some((p) => p.id === value)
}

/**
 * D1 made structural rather than stated: a module's screen ids are printed
 * inside the annotation region and are never assembled into a URL. Where
 * catalogue B carries no row for the module, the module's own declared
 * absence is the annotation — never a borrowed id.
 */
function annotationFor(module: StudioModuleDefinition, screenId: StudioScreenId | undefined) {
  const rows = stuScreensForModule(STU_SCREENS, module.id).filter(
    (s) => screenId === undefined || s.id === screenId,
  )
  return {
    ids: rows.map((s) => s.id).join(' · '),
    note: module.uncataloguedScreen?.note ?? null,
  }
}

/**
 * The derived module count, and the only place on this surface a count of
 * Studio modules may render.
 *
 * `AC-STU-014` binds this build's own documents and screens, not only the
 * blueprint's — L30992: "No document, screen, or interface produced by this
 * programme presents a Studio module count as a Statement-of-Work fact."
 * L30897 is the fact it is qualifying — the Statement of Work provides no
 * canonical module count for this surface at all — and L30899 is the rule
 * the count was derived by. The number and its qualifier are one element so
 * that a gate reading the built tree can see them together, and so that
 * nobody can satisfy the qualifier once and print the bare number twice.
 */
function DerivedModuleCount({ count }: { readonly count: number }) {
  return (
    <p
      data-count-scope="studio-modules"
      data-testid="module-count-scope"
      className="mt-4 max-w-prose text-sm text-[var(--color-ink-muted)]"
    >
      <span className="font-medium text-[var(--color-ink)]">{count} modules</span> — a{' '}
      <em>derived count, not stated in the Statement of Work</em>. The Statement of Work presents
      no module inventory for this surface at all; the count comes from one stated rule, &ldquo;one
      module per numbered section of Part V, in section order, with the section&rsquo;s own heading
      as the module name&rdquo;, recorded as <strong>DEC-STUDIO-001</strong> with three alternative
      groupings rejected on the record. If the client disagrees with the count, only the labels
      move, not the behaviour.
    </p>
  )
}

export function StudioShell({
  module,
  modules = STU_MODULES,
  screenId,
  persona,
  onPersonaChange,
  children,
}: StudioShellProps) {
  // Index-only fallback: on a module route the screen above owns this.
  const [ownPersona, setOwnPersona] = useState<StudioPersonaId>('quality-manager')
  const activePersona = persona ?? ownPersona
  const setPersona = onPersonaChange ?? setOwnPersona

  const personaRecord = stuPersonaById(STU_PERSONAS, activePersona)
  const access = personaRecord.studioAccess

  /**
   * THE SHELL DECIDES; EVERYTHING BELOW DRAWS. Three questions, all asked
   * here because no component may answer any of them:
   *
   * 1. May this persona open the Studio at all? Row 1 of the consolidated
   *    matrix, carried on the persona record, three-valued.
   * 2. Is this module's route offered to it? Its own matrix answers that,
   *    derived at build time and read off `module.reach`.
   * 3. Does the route exist yet? Derived at build time from the tree, so
   *    the index never points at a page nothing exports — slice 4's defect
   *    shape 5, a screen pointing at content that is not there.
   */
  const prohibited = access === 'explicitly-prohibited'
  const decisionOpen = access === 'client-decision-open'

  const linkFor = (m: StudioModuleDefinition): string | null => {
    if (prohibited || decisionOpen) return null
    if (m.slug === null) return null
    if (!m.routeBuilt) return null
    // FAIL CLOSED ON AN UNDERIVED ANSWER, AND ONLY ONCE. `stuModuleReachFor`
    // already resolves `reach === null` to `withheld` (S1, L34605: where the
    // layer that answers is unreachable the Studio permits nothing), so a
    // second `if (m.reach === null) return null` here was a duplicate rule —
    // and it made the covering test unable to fail, because deleting either
    // copy left the other one holding. Fix once, where all callers route.
    return stuModuleReachFor(m, activePersona) === 'withheld' ? null : `/studio/${m.slug}/`
  }

  /**
   * Why this module offers no link, in the persona's own terms. Never
   * blank: `AC-STU-155` (L34672) requires every unavailable capability to
   * be shown with its specific missing condition named, and a row that goes
   * quiet is the blank cell L10238 prohibits, one level up.
   */
  const withheldReason = (m: StudioModuleDefinition): string => {
    if (prohibited) return personaRecord.accessNote
    if (decisionOpen)
      return 'No route is offered while DEC-AUDSTU-001 is open — an offered route would assert the access the decision has not granted.'
    if (m.slug === null) return m.noRouteReason ?? ''
    if (m.reach === null)
      return 'This module’s permission matrix is not built in this wave, so no reach has been derived for it. Nothing is offered on an underived answer — the Studio permits nothing it has not been told to permit.'
    if (!m.routeBuilt)
      return 'This module’s route is not built in this wave. It is listed rather than dropped, so nothing here is mistaken for missing work.'
    return `This module’s own permission matrix withholds it from the ${personaRecord.name} view.`
  }

  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">AVIIXA</p>

      {module !== undefined ? (
        <div>
          <Breadcrumbs items={[{ label: SURFACE.name, href: '/studio/' }, { label: module.name }]} />
          <h1 className="mt-2 text-3xl font-semibold">{module.name}</h1>
          <StudioAnnotation module={module} screenId={screenId} />
          <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">{module.purpose}</p>
          <PrototypeDisclosure />
        </div>
      ) : (
        <div>
          <h1 className="mt-2 text-3xl font-semibold">{SURFACE.name}</h1>
          <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">{SURFACE.purpose}</p>
          <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
            <span className="font-medium text-[var(--color-ink)]">What this surface owns: </span>
            {SURFACE.ownership}
          </p>
          <DerivedModuleCount count={modules.length} />
          <PrototypeDisclosure />
        </div>
      )}

      {/* Reviewer chrome, deliberately separated from the product chrome
          around it. It is a view switcher over seeded fixtures, not a
          session role context — and it says so on screen rather than only
          here. */}
      <section
        aria-label="Storyboard view switchers"
        className="mt-6 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Reviewer controls — not part of the product
        </p>
        <div className="mt-3">
          <Select
            label="View as Studio persona"
            value={activePersona}
            options={PERSONA_OPTIONS}
            onChange={(value) => {
              if (isPersona(value)) setPersona(value)
            }}
          />
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          These are the columns the source&rsquo;s own consolidated Studio permission matrix heads,
          not the five fixed tenant roles. Three of them are not roles: the Supervisor appears twice
          because the authoring grant, not a sixth role, is what separates the two columns; the
          Plant Manager is a persona under <strong>DEC-ROLE-001</strong>, delivered by a Supervisor
          role without the authoring grant; and GRANT-STU-IMPL is the implementation team&rsquo;s
          temporary onboarding capacity, which the source attaches to no role at all.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          <span className="font-medium text-[var(--color-ink)]">{personaRecord.name}: </span>
          {personaRecord.accessNote}
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
          {personaRecord.deliveryNote} Choosing a persona re-renders this storyboard&rsquo;s seeded
          fixtures from that point of view. It performs no product action and changes no audit
          actor.
        </p>
      </section>

      {prohibited ? (
        <div
          role="note"
          className="mt-6 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4"
        >
          <h2 className="text-lg font-semibold">Not a Studio user</h2>
          <p className="mt-2 max-w-prose text-[var(--color-ink)]">
            AC-STU-150: a Worker cannot reach any Studio route by any means. No route, no rail, no
            module content — and this is a categorical prohibition, so it renders as an absence
            rather than as a control that refuses.
          </p>
          <p className="mt-3 max-w-prose text-[var(--color-ink-muted)]">
            What that costs, stated rather than hidden: a worker cannot read the instruction they
            are about to follow before they are standing at the machine, and cannot check what a
            newer version changed. Workers meet Workflow content exclusively through the Frontline
            surface during Run execution, on the device, inside the pinned work package.
          </p>
        </div>
      ) : null}

      {decisionOpen ? (
        <div
          role="note"
          className="mt-6 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4"
        >
          <h2 className="text-lg font-semibold">An open client decision governs this view</h2>
          <p className="mt-2 max-w-prose text-[var(--color-ink)]">
            <strong>DEC-AUDSTU-001</strong> — the Read-only Auditor&rsquo;s Studio access. The
            §5.18 table enumerates five rows and the Read-only Auditor is not one of them, so the
            Statement of Work states nothing about whether this persona may open the Studio, read
            published Workflow content, read the approval log, view a diff, or generate an export.
            This build does not guess it in either direction, and no route is offered while it is
            open.
          </p>
          <p className="mt-3 max-w-prose text-[var(--color-ink-muted)]">
            The alternatives, both on the record: no Studio access at all, with the auditor working
            from the Delivery Operations Hub audit log and from exports produced by others; or
            read-only access limited to published versions, version history, approval logs and
            diffs, with no access to drafts or in-review versions. The source states the cost of the
            first itself — it &ldquo;would force auditors to depend on the audited party to produce
            evidence, which weakens the audit&rdquo;.
          </p>
          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-subtle)]">
            AC-STU-157: the Read-only Auditor&rsquo;s Studio access is not assumed. Every affected
            cell states Client Decision Required under DEC-AUDSTU-001 — which is why this persona is
            neither admitted like the four above it nor refused like the Worker.
          </p>
        </div>
      ) : null}

      {module !== undefined ? (
        prohibited ? null : (
          <div className="mt-6">{children}</div>
        )
      ) : (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">The modules of this surface</h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Names are canonical. Module identifiers and SCR-STU-NN screen numbers are annotations;
            every route is keyed on the module slug, never on a screen number (D1). Modules whose
            route or permission matrix this wave has not built are listed rather than dropped, each
            saying which it is.
          </p>
          <ul className="mt-3 space-y-4">
            {modules.map((m) => {
              const href = linkFor(m)
              return (
                <li key={m.id} data-testid={`module-row-${m.id}`}>
                  <div className="flex flex-wrap items-baseline gap-2">
                    {href !== null ? (
                      <Link href={href} className="text-[var(--color-primary)] underline">
                        {m.name}
                      </Link>
                    ) : (
                      <span className="text-[var(--color-ink)]">{m.name}</span>
                    )}
                    <span className="text-xs text-[var(--color-ink-subtle)]">{m.id}</span>
                    <span
                      data-testid={`annotation-${m.id}`}
                      className="text-xs text-[var(--color-ink-subtle)]"
                    >
                      {annotationFor(m, undefined).ids ||
                        `Uncatalogued in catalogue B — ${m.uncataloguedScreen?.note ?? ''}`}
                    </span>
                  </div>
                  <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                    {m.purpose}
                  </p>
                  {href === null ? (
                    <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-subtle)]">
                      <span className="font-medium text-[var(--color-ink)]">No route offered: </span>
                      {withheldReason(m)}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </main>
  )
}

/**
 * The annotation region. A module's identifier and its `SCR-STU-NN` screen
 * numbers live here and nowhere else on the route — never in a breadcrumb,
 * never in a heading, and never in a URL. Where catalogue B carries no row
 * for the module, the declared absence renders in the same place rather
 * than the region going blank.
 */
function StudioAnnotation({
  module,
  screenId,
}: {
  readonly module: StudioModuleDefinition
  readonly screenId: StudioScreenId | undefined
}) {
  const { ids, note } = annotationFor(module, screenId)
  return (
    <p
      data-testid="annotation-region"
      className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]"
    >
      {module.id}
      {ids === '' ? '' : ` · ${ids}`} — annotation, never a route key. This route is keyed on the
      module slug {module.slug === null ? '(this module has no route of its own)' : `“${module.slug}”`}
      .{note === null ? '' : ` ${note}`}
    </p>
  )
}

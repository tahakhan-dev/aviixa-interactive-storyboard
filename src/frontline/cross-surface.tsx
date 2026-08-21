import Link from 'next/link'
import type { RoleId } from '@/domain/roles'
import { surfaceById, type SurfaceId } from '@/domain/surfaces'
import { routeBySurface, routeOpenDecisionFor, routesForRole } from '@/routes/definitions'
import { flDestinationBySlug, type FrontlineSlug } from './screens'

/**
 * THE CROSS-SURFACE ACT RENDERER FOR `SURF-FL`, AND THE NAMED-PLACE
 * RENDERER BESIDE IT.
 *
 * WHAT ALREADY EXISTED AND WHY IT COULD NOT BE REUSED AS IT STANDS. The
 * build has this rendering three times: `stu-02/AgentConfigurationView.tsx`
 * and `stu-15/AgentBuilderView.tsx` hand-copy an `<h3>Held on another
 * surface</h3>` block, `app/studio/learning/LearningView.tsx` carries a
 * third copy as a `<section aria-label="Held on another surface">`, and
 * slice 6 built a real one at `src/ui/doh/CrossSurfaceStatement.tsx`. The
 * Hub's is the right shape and is Hub-typed by construction: its model is
 * keyed on `DohBoundaryId`, the eight rows of the §19.1.2 register, and its
 * `owningSurface` is `Exclude<SurfaceId, 'SURF-DOH'>`. Neither key fits this
 * surface — the Frontline has no boundary register, and `SURF-DOH` is a
 * place this surface points AT.
 *
 * So this is the same discipline re-derived over the same route registry,
 * not a fourth hand-copy: the pointer is CHECKED against
 * `@/routes/definitions` rather than asserted, the three link states are the
 * Hub's three, and there is no prop that could add a control. A later slice
 * lifting the Hub's onto this shape is a real piece of work and is not
 * pretended to have happened here.
 *
 * THE COMPONENT DRAWS NO CONTROL AND HAS NO PROP THAT COULD ADD ONE. Not a
 * button, not a field, not a disabled control. A disabled control would be
 * its own false claim here: it implies a condition that could become true,
 * and this boundary does not move.
 *
 * CROSSING A SURFACE IS NOT CROSSING A DESTINATION. `owningSurface` is typed
 * `Exclude<SurfaceId, 'SURF-FL'>`, so a capability met on another Frontline
 * destination cannot be dressed as a surface crossing — L1598 and
 * `AC-PROD-040` (L1614) cap the platform at five surfaces, and this
 * application's six destinations are all inside one of them. That case is
 * `NamedPlace` below.
 */

/**
 * Three states, and the third is not a shade of either other one.
 *
 * - `link` — the viewer's own role reaches the owning surface.
 * - `statement` — it does not, so there is no link. This is the usual answer
 *   on this surface: the Worker holds an execution session here and nowhere
 *   else (`AC-FL-009-2`, L39945), so a Worker reaches no other surface and
 *   every row is a plain statement.
 * - `open-decision` — whether the role reaches the owning surface is a
 *   question the source refuses to answer, and drawing no link would assert
 *   the refusal it withholds.
 */
export type FrontlineLinkState = 'link' | 'statement' | 'open-decision'

export interface FrontlineCrossSurfaceAct {
  /** The act, in the source's own words. */
  readonly capability: string
  /** Never `SURF-FL`. */
  readonly owningSurface: Exclude<SurfaceId, 'SURF-FL'>
  /** What happens there, in the source's own words. */
  readonly whatHappensThere: string
  /** The row's own line, or lines, in the frozen source. */
  readonly sourceRef: string
}

export interface FrontlineCrossSurfaceModel extends FrontlineCrossSurfaceAct {
  readonly owningSurfaceName: string
  readonly linkState: FrontlineLinkState
  readonly linkLabel: string | null
  readonly linkHref: string | null
  /** Why there is no link, or which question is open. Never blank. */
  readonly note: string
}

/**
 * THE POINTER IS CHECKED, NEVER ASSERTED. A reviewer reads a link as a
 * verified fact, so the link renders only where `@/routes/definitions`
 * actually admits this role to the target surface, and a target the role
 * cannot open collapses to the plain statement.
 */
export function frontlineCrossSurfaceModel(
  act: FrontlineCrossSurfaceAct,
  viewerRole: RoleId,
): FrontlineCrossSurfaceModel {
  const owningSurfaceName = surfaceById(act.owningSurface).name
  const route = routeBySurface(act.owningSurface)
  const admits = routesForRole(viewerRole).some((r) => r.id === route.id)
  const open = routeOpenDecisionFor(act.owningSurface, viewerRole)

  if (admits) {
    return {
      ...act,
      owningSurfaceName,
      linkState: 'link',
      linkLabel: `Open the ${owningSurfaceName}`,
      linkHref: route.pathname,
      note: `Owned there, not here. ${act.whatHappensThere}`,
    }
  }
  if (open !== null) {
    return {
      ...act,
      owningSurfaceName,
      linkState: 'open-decision',
      linkLabel: null,
      linkHref: null,
      note: `Whether your role opens the ${owningSurfaceName} is an open question: ${open.decision}. No link is drawn and none is refused.`,
    }
  }
  return {
    ...act,
    owningSurfaceName,
    linkState: 'statement',
    linkLabel: null,
    linkHref: null,
    note: `The ${owningSurfaceName} is not a surface this device opens, so no link is drawn to it. ${act.whatHappensThere}`,
  }
}

export function CrossSurfaceAct({ model }: { readonly model: FrontlineCrossSurfaceModel }) {
  return (
    <div
      role="note"
      data-testid="fl-cross-surface"
      data-link-state={model.linkState}
      className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
    >
      <p className="font-medium text-[var(--color-ink)]">
        Held on another surface — owned by the {model.owningSurfaceName}
      </p>
      <p className="mt-1 text-[var(--color-ink-muted)]">{model.capability}</p>
      <p data-testid="fl-cross-surface-note" className="mt-1 text-[var(--color-ink-muted)]">
        {model.note}
      </p>
      {model.linkState === 'link' && model.linkHref !== null && model.linkLabel !== null ? (
        <p className="mt-2">
          <Link href={model.linkHref} className="underline text-[var(--color-ink)]">
            {model.linkLabel}
          </Link>
        </p>
      ) : null}
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{model.sourceRef}</p>
    </div>
  )
}

/**
 * The other half of the same rule: an act met on ANOTHER DESTINATION OF THIS
 * SURFACE. It is not a boundary and a cross-surface statement over it would
 * claim another surface owns something this one does. What it draws is a
 * named place and no control — the Hub reaches the same conclusion for its
 * own fourth case and says so: a cross-surface statement "claims a place on
 * another surface", and a different screen of this surface is not one.
 */
export function NamedPlace({
  capability,
  destination,
  note,
  sourceRef,
}: {
  readonly capability: string
  readonly destination: FrontlineSlug
  readonly note: string
  readonly sourceRef: string
}) {
  const d = flDestinationBySlug(destination)
  return (
    <div
      role="note"
      data-testid="fl-named-place"
      className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4 text-sm"
    >
      <p className="font-medium text-[var(--color-ink)]">
        Met on {d.name}, not on this screen
      </p>
      <p className="mt-1 text-[var(--color-ink-muted)]">{capability}</p>
      <p className="mt-1 text-[var(--color-ink-muted)]">{note}</p>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{sourceRef}</p>
    </div>
  )
}

/**
 * THE ACTS THIS WHOLE SURFACE NEVER CARRIES, at surface level rather than at
 * matrix level. Every one of them has a permissive token somewhere in the
 * twelve matrices and every one of them belongs to another surface, which is
 * the trap the twelve module tasks each meet independently.
 *
 * They are declared here, once, so the surface shell can state them before a
 * single module screen exists — a claim that is true on day one is worse
 * disclosed on day thirty.
 */
export const FL_ACTS_HELD_ELSEWHERE = [
  {
    capability: 'Cancelling a Run, and terminally completing one.',
    owningSurface: 'SURF-DOH',
    whatHappensThere:
      'A Supervisor cancels in their own area and a Quality Manager in any area, both with a categorised reason. Six cells across three of this surface’s matrices read Allowed or Allowed with conditions for those two roles, and every one of them says "in the Delivery Operations Hub" or "not here". EXCL-FL-06 makes it an invariant exclusion, so a control here would be a broken guarantee rather than a misplaced button.',
    sourceRef: 'L40369, L40535, L41953, L41954; EXCL-FL-06 at L39489',
  },
  {
    capability: 'Releasing a held lot, unit, or run.',
    owningSurface: 'SURF-CC',
    whatHappensThere:
      'A Quality Manager releases from the Client Command Center and it reaches this device as a lot-release command on the next synchronisation. A Supervisor requests a release with a note and cannot grant one. The device applies the release; it never originates it.',
    sourceRef: 'L40916, L39662',
  },
  {
    capability: 'Authoring, editing or versioning training and coaching material.',
    owningSurface: 'SURF-STU',
    whatHappensThere:
      'A Quality Manager with an authoring grant does this in the Standards and Operations Studio. Both of this surface’s cells for it end in the words "never here", and the viewer built here creates no production record and cannot download material to the device.',
    sourceRef: 'L41473, L42115, L42116, L42118',
  },
  {
    capability: 'Applying a soft, hard, or compliance suspension.',
    owningSurface: 'SURF-SA',
    whatHappensThere:
      'Platform roles apply it from the Super Admin platform console, or it arrives through tenant lifecycle in the Delivery Operations Hub. It reaches the device as a suspension command and the device applies it; no role on this surface can apply or dismiss one.',
    sourceRef: 'L41301, L41302, L41303, L39665',
  },
] as const satisfies readonly FrontlineCrossSurfaceAct[]

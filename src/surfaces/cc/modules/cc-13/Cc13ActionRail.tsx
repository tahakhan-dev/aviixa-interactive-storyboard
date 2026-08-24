import Link from 'next/link'
import { CC13_OWNING_PLACES } from '@/surfaces/cc/actions/action-set'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { Button } from '@/ui/primitives'
import {
  CC13_AUDIT_POINTER,
  CC13_RAIL_SPEC,
  cc13ActionsOnModule,
  cc13Rail,
  type Cc13RailContext,
  type Cc13RailRendering,
  type Cc13ScopeFilter,
} from './rail'
import type { CcModuleId } from '@/surfaces/cc/modules'

/**
 * `MOD-CC-13`'s ACTION RAIL AS `SB-16-02` DRAWS IT — ten controls, not a
 * transcription.
 *
 * TWO TREATMENTS, AND THEY ARE NOT DUPLICATES.
 * `src/surfaces/cc/actions/ActionRail.tsx` is wave 0's and renders the
 * module's CARD: both §21.16 tables, the four exclusions, the outside-write
 * register and the propagation roll-up. It belongs on a page that is about
 * this module. THIS is the rail the storyboard describes — the thing that
 * mounts inside another module's screen and puts ten controls next to the
 * work. Neither is the other's second spelling: the card renders cell TEXT
 * and no control, and this renders CONTROLS and no matrix.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Everything it
 * renders comes from `./rail`, `./readings` and wave 0's `action-set`, all
 * plain data modules. A `'use client'` directive on any of them replaces
 * those exports with client references and the strings are gone by the time
 * a route prerenders — the defect that put an undefined module id into four
 * built pages in slice 7 while every component test stayed green.
 *
 * IT PASSES NO HANDLER, and that is why it can stay a server component. This
 * is a storyboard; an enabled control here states that the act is reachable
 * for this person, which is exactly what `SB-16-02` draws. The act itself is
 * a command against a Delivery Operations Hub-owned record executed through
 * the owning Hub service (L38657), and no such service exists in this build.
 *
 * ── THE HEADER CARRIES TWO THINGS, AND A GATE COUNTS THEM ───────────────
 *
 * L20195: "Above the rail sits the person's name and the current scope
 * filter — Site or Area — and nothing else. There is no role indicator,
 * because there is no active role." So the header renders the name and the
 * scope and neither a role name nor a role identifier, and
 * `tests/component/cc-13.test.tsx` asserts the absence by searching the
 * header subtree for every one of the five column words and every one of
 * the five tenant `RoleId`s. Asserting "no role indicator" by eye is how a
 * role indicator ships.
 *
 * ── WHERE IT MOUNTS ─────────────────────────────────────────────────────
 *
 * `MOD-CC-13` has no route: `AC-CC-040` (L35261) forbids a fourteenth module
 * route and the spine records `slug: null`. L38793 names the seven modules
 * whose screens exercise one or more of the ten. Each of those screens hands
 * this component to `CommandCenterShell`'s `actionRail` prop, or renders it
 * directly, and passes its own module id as `mountedOn` so the rail can say
 * which of the ten that screen is the context for.
 *
 * THIS TASK OWNED NO FILE UNDER `app/` AND NO MODULE SCREEN, SO IT COULD NOT
 * WIRE ITSELF, and that was declared here rather than left to look like an
 * oversight — the `cc-10-s366` lesson, which slice 8 paid for by shipping
 * its best disclosure to no page at all. The seven screens are task 6's,
 * 10's, 11's, 12's, 15's, 16's and 18's, and THEY HAVE SINCE WIRED IT.
 *
 * THE EXACT MOUNT, AS A PAGE IN THIS TREE ALREADY WRITES IT.
 * `app/command-center/deviation-workspace/page.tsx` — `MOD-CC-04`'s screen,
 * another task's file — passes this component to `CommandCenterShell`, with
 * the module id read off the spine rather than typed:
 *
 *     actionRail={
 *       <Cc13ActionRail
 *         personName={…}
 *         scopeFilter="Site"
 *         heldColumns={…}
 *         mountedOn={CC04_MODULE.id}
 *       />
 *     }
 *
 * THE FILE THIS PARAGRAPH USED TO NAME WAS THE ONE PAGE THAT REFUSES.
 * It cited `app/command-center/live-shift-board/page.tsx` as passing
 * `actionRail={<ActionRail viewerRole={…} />}`; that file imports no action
 * rail at all and its own comment says the opposite — L38793 does not name
 * `MOD-CC-01` among the seven, so it leaves `actionRail` unfilled on purpose.
 * The spelling `<ActionRail>` also named the CARD in
 * `src/surfaces/cc/actions/ActionRail.tsx`, which is a different component,
 * and no file under `app/` renders it. A warrant is only worth as much as the
 * file it points at, so it now points at a page that actually fills the prop.
 *
 * `heldColumns` is a set rather than one role on purpose, and that is the
 * one thing a mounting screen must not flatten: L20197's own worked example
 * is a person holding Supervisor at an Area and Quality Manager at a Site
 * with "no dropdown asking which role he is using".
 */

export interface Cc13ActionRailProps extends Cc13RailContext {
  /** L20195's "the person's name". Not a role, and never rendered as one. */
  readonly personName: string
  /** L20195's "the current scope filter — Site or Area". */
  readonly scopeFilter: Cc13ScopeFilter
  /**
   * The module whose screen this rail is mounted inside, where there is one.
   * Used only to say which of the ten L38793 names on that screen; the rail
   * still lists all ten either way, because L20197 says it shows all ten.
   */
  readonly mountedOn?: CcModuleId
}

function RailControl({ rendering }: { readonly rendering: Cc13RailRendering }) {
  if (rendering.state === 'absent') {
    return (
      <ProhibitionNotice
        rendering={{
          kind: 'absent',
          note: `${rendering.label} — not applicable to the selected object. ${rendering.reason ?? ''}`,
        }}
      />
    )
  }
  if (rendering.state === 'disabled') {
    return (
      <ProhibitionNotice
        rendering={{
          kind: 'disabled-with-reason',
          label: rendering.label,
          reason: rendering.reason ?? '',
        }}
      />
    )
  }
  return <Button variant="secondary">{rendering.label}</Button>
}

export function Cc13ActionRail({
  personName,
  scopeFilter,
  mountedOn,
  heldColumns,
  outOfScope,
  notApplicable,
}: Cc13ActionRailProps) {
  const rail = cc13Rail({
    heldColumns,
    ...(outOfScope !== undefined ? { outOfScope } : {}),
    ...(notApplicable !== undefined ? { notApplicable } : {}),
  })
  const here = mountedOn === undefined ? [] : cc13ActionsOnModule(mountedOn)

  return (
    <section
      data-testid="cc13-rail"
      data-module-id="MOD-CC-13"
      data-screen-name={CC13_RAIL_SPEC.screenName}
      className="mt-10"
    >
      {/* ABOVE THE RAIL: the person's name and the scope filter, and nothing
          else. No role indicator — L20195 is explicit that there is no
          active role to indicate. */}
      <header data-testid="cc13-rail-header" className="flex flex-wrap items-baseline gap-3">
        <span data-testid="cc13-rail-person" className="text-lg font-semibold">
          {personName}
        </span>
        <span data-testid="cc13-rail-scope" className="text-sm text-[var(--color-ink-subtle)]">
          Scope: {scopeFilter}
        </span>
      </header>

      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        The ten operational actions, in their canonical order. The Command Center is the cockpit,
        never the engine: the control is here and the record, the rule set and the audit entry are
        on the Delivery Operations Hub.
      </p>
      {mountedOn === undefined ? null : (
        <p data-testid="cc13-rail-mount" className="mt-1 text-sm text-[var(--color-ink-subtle)]">
          Mounted inside {mountedOn}, which the interconnection line names for{' '}
          {here.length === 0
            ? 'none of the ten — it lists seven of the twelve other modules and this is not one of them'
            : `action${here.length === 1 ? '' : 's'} ${here.join(', ')}`}
          . All ten are listed here regardless.
        </p>
      )}

      <ol data-testid="cc13-rail-controls" className="mt-4 space-y-3">
        {rail.map((r) => {
          const place = CC13_OWNING_PLACES.find((p) => p.ordinal === r.ordinal)
          return (
            <li
              key={r.ordinal}
              data-testid={`cc13-rail-control-${r.ordinal}`}
              data-state={r.state}
              data-substituted={r.substituted ? 'yes' : 'no'}
              className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3"
            >
              <RailControl rendering={r} />
              {r.condition === null ? null : (
                <p
                  data-testid={`cc13-rail-condition-${r.ordinal}`}
                  className="mt-1 text-xs text-[var(--color-ink-muted)]"
                >
                  Condition: {r.condition}
                </p>
              )}
              {/* THE AUDIT POINTER. L48437 makes it an obligation for every
                  one of the ten, and SCR-DOH-20 (L48114) is the Hub route
                  that answers it. The place is named AND the explorer is
                  linked; the href comes from the DOH spine's own slug. */}
              <p
                data-testid={`cc13-rail-audit-${r.ordinal}`}
                data-audit-linked={CC13_AUDIT_POINTER.destinationBuilt ? 'yes' : 'no'}
                className="mt-1 text-xs text-[var(--color-ink-subtle)]"
              >
                Audit entry:{' '}
                {place?.owningPlace ??
                  'the Executes via column names no owning record for this action'}
                {' — '}
                <Link
                  href={CC13_AUDIT_POINTER.destinationRoute}
                  className="underline text-[var(--color-ink)]"
                >
                  {CC13_AUDIT_POINTER.destinationScreen} audit log explorer
                </Link>
                . {CC13_AUDIT_POINTER.obligationRef} ·{' '}
                {CC13_AUDIT_POINTER.destinationScreenRef} · {r.sourceRef}
              </p>
            </li>
          )
        })}
      </ol>

      <p
        role="note"
        data-testid="cc13-rail-audit-note"
        className="mt-4 max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-3 text-sm"
      >
        {CC13_AUDIT_POINTER.whyLinked}
      </p>
    </section>
  )
}

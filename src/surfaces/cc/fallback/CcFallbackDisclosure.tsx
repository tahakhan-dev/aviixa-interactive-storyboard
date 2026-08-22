'use client'

import { WriteControl } from '@/ui/WriteControl'
import type { PermissionDecision } from '@/policy/decision'
import { CC_FALLBACK_PATTERNS, type CcFallbackPatternId } from './patterns'
import {
  CC_FROZEN_CONTROL_REASON,
  CC_FROZEN_SESSION_FACTS,
  CC_FROZEN_SESSION_RULES,
  frozenBannerText,
  type CcSessionState,
} from './session'

/**
 * The three §21.2.5 / §21.2.3 mechanisms, rendered. Components only — the
 * data they read lives in `./patterns` and `./session`, which carry no
 * `'use client'` directive, so a server component may read those and this
 * file exports nothing but components.
 *
 * ── A STATED ABSTENTION, NOT AN OVERSIGHT ──────────────────────────────
 *
 * AT THE TIME OF WRITING NO ROUTE MOUNTS THIS FILE. Measured, not assumed:
 * `grep -rn "cc/fallback" src app tests` returns this directory and the two
 * test files, and nothing under `app/`. That is the exact shape slice 8
 * shipped `cc-10-s366/SecondTreatmentDisclosure.tsx` in, and the difference
 * between an abstention and an oversight is that the abstention says so.
 *
 * This is a wave-0 mechanism task and it owns no route file. `MOD-CC-02`'s
 * comparable absence is declared in `CC_SEAMS`; this one is declared here,
 * because `src/surfaces/cc/seams.ts` is not this task's to edit either.
 *
 * WHAT WIRES IT, in one line, for whoever owns the surface index:
 * `<CcFallbackLibrary />` inside the Command Center shell. `FB-CC-SESS` and
 * `FB-CC-QUEUE` are surface-wide, not module-scoped, so the library belongs
 * on the surface index rather than on any one of the thirteen screens.
 * `GateItemDecision` is for the gate-queue module's own screen.
 *
 * THE FIFTH `WriteControl` BRANCH THIS FILE USES DOES ALREADY SHIP:
 * `src/ui/WriteControl.tsx` is imported by three built Hub screens, so the
 * not-decidable rendering is in the tree whether or not this disclosure is
 * mounted. It is the DISCLOSURE that is unreached, not the mechanism.
 */

/**
 * `FB-CC-SESS` (L35658), rule 2 "Freeze and label, never blank." (L35508)
 * and rule 5 "Name the alternate route." (L35511), as `SB-CC-05` renders
 * them (L35535).
 */
export function FrozenSessionBanner({ lastUpdate }: { readonly lastUpdate: string }) {
  return (
    <section
      aria-label="Session frozen"
      className="rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-4"
    >
      <p className="text-sm font-semibold">{frozenBannerText(lastUpdate)}</p>
      <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        Nothing on this screen is stored for later transmission. That is the single most
        important difference between this surface and the Frontline Worker Application: the
        Frontline Worker Application queues because captures are facts about the past; the
        Command Center does not queue because decisions are instructions about the future
        (L35510).
      </p>
    </section>
  )
}

export interface GateItemDecisionProps {
  /** The decision control's own label, e.g. `Approve`. */
  readonly label: string
  /** Handed in by the screen, exactly as `WriteControl` requires. */
  readonly decision: PermissionDecision
  readonly roleName: string
  readonly refusalNote: string
  readonly neverQueuedNote: string
  /**
   * `FB-CC-QUEUE` (L35670): the element the item could not resolve — the
   * scope of impact or the evidence. Absent means the context is complete
   * and the item is decidable.
   */
  readonly missingElement?: string | undefined
  /** `FB-CC-SESS`. `frozen` closes every decision control on the surface. */
  readonly sessionState: CcSessionState
  /** Minutes, from the injected clock. Never `Date.now()`. */
  readonly raisedAtMinute: number
  readonly nowMinute: number
  readonly onAct: () => void
}

/**
 * ONE approval-queue item, under both mechanisms at once.
 *
 * THE WAITING TIME IS COMPUTED IN ONE PLACE FOR EVERY STATE, which is the
 * whole obligation and the easiest one to lose. `FB-CC-QUEUE`'s terminal
 * safe state is "Item not decidable, ages visibly, never expires" (L35702)
 * and its recovery clause is that a resolved item becomes decidable
 * "retaining its original waiting-time clock" (L35670). A clock that stops
 * because an item cannot be decided is a different and wrong thing, so
 * neither `missingElement` nor `sessionState` may reach this expression.
 *
 * THE FROZEN SESSION IS HANDED TO `WriteControl` AS ITS GATE REASON rather
 * than as a sixth branch, and the choice is deliberate: a frozen session is
 * a condition outside this person and outside this record that closes the
 * control, which is what that branch already is, and it sits ahead of the
 * object's own condition. §21.2.3's third rule reads "Disable every decision
 * control, with the reason shown." (L35509); that every is what makes the
 * earlier position the right one, and the precedence itself is derived here
 * rather than stated there. A second write control is how two surfaces come
 * to render one status two ways.
 */
export function GateItemDecision({
  label,
  decision,
  roleName,
  refusalNote,
  neverQueuedNote,
  missingElement,
  sessionState,
  raisedAtMinute,
  nowMinute,
  onAct,
}: GateItemDecisionProps) {
  const waitingMinutes = nowMinute - raisedAtMinute
  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-ink-subtle)]">Waiting {waitingMinutes} min</p>
      {missingElement !== undefined ? (
        <p role="status" className="text-sm text-[var(--color-ink-muted)]">
          Not decidable — {missingElement} could not be resolved. This item never executes on
          its own and never silently expires; it ages visibly until the context resolves.
        </p>
      ) : null}
      <WriteControl
        label={label}
        decision={decision}
        roleName={roleName}
        gateReason={sessionState === 'frozen' ? CC_FROZEN_CONTROL_REASON : null}
        objectReason={null}
        refusalNote={refusalNote}
        neverQueuedNote={neverQueuedNote}
        missingElement={missingElement}
        onAct={onAct}
      />
    </div>
  )
}

/**
 * §21.2.5's own selection table, and the two tokens that are not in it.
 * `AC-CC-090` (L35710) is asserted against these nine.
 */
export function CcFallbackLibrary() {
  return (
    <section aria-label="Command Center fallback pattern library">
      <h2 className="text-sm font-semibold">
        Nine fallback patterns cover every failure mode on this surface
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr>
              <th scope="col">Pattern</th>
              <th scope="col">Triggering condition</th>
              <th scope="col">Decision controls</th>
              <th scope="col">Client-side queueing</th>
              <th scope="col">Terminal safe state</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {CC_FALLBACK_PATTERNS.map((p) => (
              <tr key={p.id}>
                <th scope="row" className="font-mono font-normal">
                  {p.id}
                </th>
                <td>{p.triggeringCondition}</td>
                <td>{p.decisionControls}</td>
                <td>{p.clientSideQueueing}</td>
                <td>{p.terminalSafeState}</td>
                <td className="text-[var(--color-ink-subtle)]">{p.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        FB-CC-001 (L11414) and FB-CC-002 (L13846) are not members of this library. They are
        numbered where this library is mnemonic and they sit in other chapters, so a pattern
        matching FB-CC- followed by anything collects eleven tokens where nine are the
        library.
      </p>
      <h3 className="mt-6 text-sm font-semibold">
        A frozen session, and what it is not (DEC-CCOFF-001, L35503)
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--color-ink-muted)]">
        {CC_FROZEN_SESSION_RULES.map((r) => (
          <li key={r.sourceRef}>
            {r.rule} <span className="text-[var(--color-ink-subtle)]">({r.sourceRef})</span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[max-content_1fr]">
        {CC_FROZEN_SESSION_FACTS.map((f) => (
          <div key={f.sourceRef} className="contents">
            <dt className="text-[var(--color-ink-subtle)]">{f.aspect}</dt>
            <dd>
              {f.commandCenterSessionOffline}{' '}
              <span className="text-[var(--color-ink-subtle)]">({f.sourceRef})</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        A frozen Command Center session is not an offline device. The scenario controls carry
        six connectivity modes and none of them is this state; reusing offline would put a
        device that holds captures for later onto a browser tab that holds nothing.
      </p>
    </section>
  )
}

/** Re-exported for callers that render the library and name a pattern. */
export type { CcFallbackPatternId }

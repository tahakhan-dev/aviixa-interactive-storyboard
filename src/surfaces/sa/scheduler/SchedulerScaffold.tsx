import type { ReactNode } from 'react'
import Link from 'next/link'
import { surfaceById } from '@/domain/surfaces'
import { rolesInDomain, type RoleId } from '@/domain/roles'
import { cellFor } from '@/policy/columns'
import {
  MATRIX_A,
  operationEnumeratedAs,
  scheduleRow,
  type ScheduleOperationId,
} from '@/policy/schedule-operations'
import { Banner, Breadcrumbs, StatusPill } from '@/ui/primitives'
import { PrototypeDisclosure } from '@/ui/sa/PrototypeDisclosure'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { ViewerRole, type ViewerRoleAnswer } from './ViewerRole'
import {
  OFFLINE_IS_NOT_UNHEALTHY,
  SCHEDULER_SCREENS,
  THE_NOUN,
  TRIGGER_MODEL,
  UNESTABLISHED,
  type UncataloguedScreen,
} from './registry'

/**
 * The chrome both scheduler screens share, and the two things it deliberately
 * does NOT do.
 *
 * IT RENDERS NO BAND-AND-MODULE ANNOTATION. Every other route on this surface
 * wraps itself in `SaConsoleShell` with a `SaModuleDefinition`, which prints
 * the owning module's id beside the screen name. Neither of these two screens
 * has an owning module — measured: zero `MOD-*` identifiers occur in either
 * passage that storyboards them — so printing one would be the claim the
 * source does not make. The breadcrumb goes to the console index and the trail
 * says plainly that no module claims the screen.
 *
 * NEITHER SCREEN IS LINKED FROM THE CONSOLE INDEX, AND THAT IS DECLARED
 * RATHER THAN MISSED. `SaConsoleShell`'s module rail is built from
 * `SA_MODULES`, and adding a rail entry for a screen no module owns would
 * either need a registry row this task does not own or would put a screen
 * under a module header that does not claim it. So the two are reachable by
 * URL and from each other's cross-link, and the missing rail entry is a
 * reported hand-off, not an oversight: a stated abstention and an oversight
 * look identical from outside, which is why this says which it is.
 *
 * IT TAKES NO FUNCTION PROP AND CARRIES NO `'use client'`. Both screens are
 * server components with no interactive control anywhere in them, which is why
 * the server/client boundary defect that reached six of slice 9's seven panels
 * cannot occur here: there is no `onAct` to hand across a boundary, and no
 * plain data is exported from a client module for a server component to read
 * back as `undefined`.
 *
 * ── AND IT DOES OFFER THE SURFACE'S VIEWER CONTROL ─────────────────────────
 * `ViewerRole` is the one interactive element on either screen, and it is the
 * CHROME's, rendered here above the screen body. It is the honest half of the
 * accessibility gate's own name — offer the control, or record why not — and
 * this is the first half: eighteen of this console's twenty other routes offer
 * `View as platform role`, and the two that do not are recorded because they
 * carry no viewer control at all rather than because a reviewer should not
 * have one.
 *
 * NOTHING ABOUT THE MODULE ABSTENTION IS WEAKENED BY OFFERING IT. The rail
 * entry, the band-and-module annotation and the claim that a module owns
 * either screen are all still refused above, on the measurement that no
 * `MOD-*` identifier occurs in either passage. That measurement argues against
 * the console shell's MODULE MODE. It says nothing about whether a reviewer
 * may look at an unowned screen as each of the four platform roles Matrix A
 * declares, and withholding that would record an exemption the source gives no
 * reason for.
 *
 * THE CONSOLE SHELL IS NOT THE HOME FOR IT, and that was checked rather than
 * assumed: `SaConsoleShell` renders NO viewer control in either of its two
 * modes, and its non-module mode is the console index itself — it drops
 * `children` entirely and draws the nineteen-module rail. Wrapping either
 * screen in it would render the module index instead of the screen, print the
 * rail these two are deliberately absent from, and still offer no viewer
 * control. `HubShell` has a third mode for an unowned route; this shell has
 * two, and adding a third to it is not this task's file to change.
 */

const SURFACE = surfaceById('SURF-SA')

/** The four platform roles, in the role registry's own order. */
const PLATFORM_ROLES = rolesInDomain('PLATFORM')

/**
 * The Matrix A column for a platform role. A throw rather than a fallback:
 * every one of the four platform roles is a column of that matrix by
 * transcription, so a miss is a transcription defect and a silent default
 * would answer a permission question from the wrong column.
 *
 * Exported because the registry screen asks the same question of the same
 * matrix for each of its seven governed controls, and two copies of this
 * lookup would be two things to drift.
 */
export function platformColumn(role: RoleId) {
  const column = MATRIX_A.columns.find((c) => c.kind === 'role' && c.role === role)
  if (column === undefined) {
    throw new Error(`Matrix A has no column for ${role}; its header declares four platform roles`)
  }
  return column
}

/**
 * What each platform role's own Matrix A cell says about the read this screen
 * IS, transcribed. Not a decision: `evaluateAccess` is never asked, because a
 * read-permissive cell is answered by the cell alone and a decision rendered
 * in the chrome would claim a tenant-isolation check neither screen makes.
 *
 * THE NON-EMPTY TUPLE IS THE POINT OF THE THROW. A viewer control offering
 * one position proves nothing about a page, and an EMPTY option set classifies
 * as a screen-state driver in the accessibility harness — `[].every(...)` is
 * `true` — and would then drive nothing while reporting a pass.
 */
function answersFor(
  operation: ScheduleOperationId,
): readonly [ViewerRoleAnswer, ...ViewerRoleAnswer[]] {
  const row = scheduleRow(MATRIX_A, operation)
  const [head, ...rest] = PLATFORM_ROLES.map(
    (role): ViewerRoleAnswer => ({
      roleId: role.id,
      roleName: role.name,
      cellDetail: cellFor(row, platformColumn(role.id)).detail,
    }),
  )
  if (head === undefined) {
    throw new Error(
      `the role registry declares no PLATFORM role, so ${operation} has no viewer position`,
    )
  }
  return [head, ...rest]
}

export interface SchedulerScaffoldProps {
  readonly screen: UncataloguedScreen
  /** One sentence saying what this screen is for, in the source's own terms. */
  readonly purpose: string
  /**
   * The governed scheduling operation this screen is a view of — the read
   * whose Matrix A row the viewer control reports per role. `PER-SCHED-01`
   * view definition for the registry, `PER-SCHED-02` view occurrences and
   * receipts for the occurrence detail.
   */
  readonly readOperation: ScheduleOperationId
  readonly children: ReactNode
}

function occurrenceWord(n: number): string {
  return n === 1 ? '1 occurrence' : `${n} occurrences`
}

/**
 * THE ASYMMETRY, RENDERED. Both screens print both counts, not only their own,
 * because the finding is the comparison: one identifier is written down four
 * times and the other once, so the second screen's specification has nothing
 * to be checked against. A screen printing only its own count would state a
 * number and hide the finding.
 */
function AsymmetryNotice({ screen }: { readonly screen: UncataloguedScreen }) {
  const [first, second] = SCHEDULER_SCREENS
  const mine = screen.identifier === second.identifier

  return (
    <Banner
      tone={mine ? 'attention' : 'info'}
      heading="Two screens, and only one of them is corroborated"
      body={`Measured across the whole frozen source: ${first.identifier} occurs ${occurrenceWord(
        first.occurrences.length,
      )} and ${second.identifier} occurs ${occurrenceWord(second.occurrences.length)}. ${
        second.identifier
      } is specified — its one line gives eight fields and one explicit exclusion — but it is specified exactly once, with no storyboard section, no controls block, no prohibition block, no acceptance criterion and no example naming it. Nothing here is extrapolated from ${
        first.identifier
      } to fill that in.`}
    />
  )
}

export function SchedulerScaffold({
  screen,
  purpose,
  readOperation,
  children,
}: SchedulerScaffoldProps) {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <Breadcrumbs
        items={[
          { label: SURFACE.name, href: '/super-admin/' },
          { label: 'Scheduled work — no owning module' },
          { label: screen.name },
        ]}
      />

      <h1 className="mt-2 text-3xl font-semibold">{screen.name}</h1>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        {screen.identifier} — the source&rsquo;s own screen identifier. No catalogue number is
        shown because no screen register carries a row for this screen.
      </p>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">{purpose}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill tone="info" icon="◈" label={screen.classification} />
        <StatusPill tone="attention" icon="◇" label={`Pending ${screen.pendingDecision}`} />
        <StatusPill tone="neutral" icon="○" label="No owning module" />
      </div>

      <ViewerRole
        answers={answersFor(readOperation)}
        operation={readOperation}
        operationName={operationEnumeratedAs(readOperation)}
        sourceRef={scheduleRow(MATRIX_A, readOperation).sourceRef}
      />

      <div className="mt-6">
        <AsymmetryNotice screen={screen} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Where this screen comes from</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink-muted)]">
          {screen.occurrences.map((o) => (
            <li key={o.line}>
              <span className="font-medium text-[var(--color-ink)]">L{o.line}</span> —{' '}
              {o.contributes}
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The Statement of Work places the platform schedulers in the console&rsquo;s System
          settings category and does not describe a screen. Everything drawn here is a product
          extension awaiting {screen.pendingDecision}, and nothing on it is presented as a fact of
          the Statement of Work.
        </p>
      </section>

      {children}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What this screen does not claim</h2>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          No {THE_NOUN} runs behind this screen. There is no scheduler process, no execution worker
          and no timer anywhere in this application; every reading below is seeded storyboard data
          or an explicit absence, and an absence is never drawn as a zero.
        </p>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The architecture this screen storyboards refuses one claim and makes a narrower one. It
          does not claim {TRIGGER_MODEL.refused}. What it claims is {TRIGGER_MODEL.claimed}. That
          is why an attempt count is shown rather than hidden: a second attempt is not a second
          business effect.
        </p>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {OFFLINE_IS_NOT_UNHEALTHY.statement}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Three things the source could not establish, carried unanswered
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each of these is an absence that was measured rather than assumed. None is answered here,
          and none is filled in by inference from the parts of the source that do speak.
        </p>
        <ol className="mt-4 space-y-6">
          {UNESTABLISHED.map((item) => (
            <li key={item.question}>
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">{item.question}</h3>
              <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
                {item.whatTheSourceSays.map((said) => (
                  <li key={said.locator}>
                    <span className="font-medium text-[var(--color-ink)]">{said.locator}</span> —{' '}
                    {said.text}
                  </li>
                ))}
              </ul>
              <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">{item.notKnown}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <DecisionDisclosure id="DEC-FINISH-002" />
        </div>
      </section>

      <nav className="mt-10 text-sm">
        <h2 className="text-lg font-semibold">The other scheduler screen</h2>
        <p className="mt-2">
          <Link
            href={
              screen.identifier === 'SCR-SA-SCHED-01'
                ? '/super-admin/occurrence-detail/'
                : '/super-admin/scheduler-registry/'
            }
            className="text-[var(--color-primary)] underline"
          >
            {screen.identifier === 'SCR-SA-SCHED-01'
              ? 'Occurrence detail'
              : 'Scheduler Registry'}
          </Link>
        </p>
      </nav>

      <PrototypeDisclosure />
    </main>
  )
}

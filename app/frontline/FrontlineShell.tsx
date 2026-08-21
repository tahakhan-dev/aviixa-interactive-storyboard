import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  FL_DESTINATIONS,
  frontlinePathname,
  type FrontlineDestination,
} from '@/frontline/screens'
import { captureStateLine, type CaptureState } from '@/frontline/capture'
import { frontlineConnectivityTreatment } from '@/frontline/access'

/**
 * THE SURFACE SHELL. Every one of the six destinations wraps its content in
 * this, and the six modules that mount into the Run Player never touch it.
 *
 * WHAT IT EXISTS TO GUARANTEE, and both are acceptance criteria rather than
 * taste:
 *
 *  - `AC-FL-010-5` (L40049): "The sync indicator is present on every screen
 *    of every destination." Drawn here, once, so it cannot be forgotten on
 *    the seventh screen somebody adds.
 *  - `AC-FL-006-3` (L39636) and `TEST-SCR-FL-003` (L48700): the indicator
 *    names the capture's actual state from the ladder and never a bare
 *    success. It cannot say "Synced" — `captureStateLine` reads a total
 *    record over a thirteen-member union that has no such member.
 *
 * The persistent-chrome column of the source's own destination table
 * (L40032-L40037) differs per destination — Login shows a device-mode
 * indicator, the other five show the sync indicator and My Runs also shows
 * who is logged in — so the shell renders the destination's OWN chrome text
 * rather than one line copied five times.
 */

/**
 * A shipped fixture, and it is deliberately a state that is still on the
 * device: a shell whose only demonstrated state were a settled one would
 * never exercise the sentence the criteria exist to force.
 */
const FIXTURE_CAPTURE_STATE: CaptureState = 'queued'
const FIXTURE_PENDING_COUNT = 6

export interface FrontlineShellProps {
  readonly destination: FrontlineDestination
  /** Omitted on a destination whose modules are a later wave's. */
  readonly children?: ReactNode
}

export function FrontlineShell({ destination, children }: FrontlineShellProps) {
  const offline = frontlineConnectivityTreatment({ kind: 'write' })

  return (
    <main id="main" className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">
        Frontline Worker Application
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{destination.name}</h1>
      <p className="mt-3 max-w-prose text-[var(--color-ink-muted)]">{destination.purpose}</p>

      <p
        role="status"
        data-testid="fl-sync-indicator"
        className="mt-5 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] px-4 py-3 text-sm text-[var(--color-ink)]"
      >
        <span className="font-medium">{destination.persistentChrome}. </span>
        {FIXTURE_PENDING_COUNT} captures are held on this device.{' '}
        {captureStateLine(FIXTURE_CAPTURE_STATE)} {offline.reason}
      </p>

      <nav
        aria-label="Frontline destinations"
        className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-b border-[var(--color-border-strong)] pb-3 text-sm"
      >
        {FL_DESTINATIONS.map((d) => {
          const isCurrent = d.slug === destination.slug
          return (
            <Link
              key={d.slug}
              href={`${frontlinePathname(d.slug)}/`}
              aria-current={isCurrent ? 'page' : undefined}
              className={
                isCurrent
                  ? 'font-semibold text-[var(--color-ink)]'
                  : 'text-[var(--color-primary)] underline'
              }
            >
              {d.name}
            </Link>
          )
        })}
      </nav>

      <section aria-label="Offline behaviour" className="mt-6">
        <h2 className="text-lg font-semibold">With no connection</h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {destination.offlineNote}. {destination.sourceRef}
        </p>
      </section>

      <section aria-label="How this destination is identified" className="mt-6">
        <h2 className="text-lg font-semibold">How this destination is identified</h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          This route is keyed on its name,{' '}
          <span className="font-mono">{destination.slug}</span>, and never on a screen
          identifier. Two tables in the source both call themselves the screen register for
          this application, and they do not agree about what{' '}
          <span className="font-mono">{destination.contested.token}</span> names.
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          <li data-testid="fl-contested-a">
            <span className="text-[var(--color-ink)]">
              {destination.contested.token} — {destination.contested.registerA}
            </span>{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{destination.contested.registerARef}]
            </span>
          </li>
          <li data-testid="fl-contested-b">
            <span className="text-[var(--color-ink)]">
              {destination.contested.token} — {destination.contested.registerB}
            </span>{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{destination.contested.registerBRef}]
            </span>
          </li>
        </ul>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          A client-delegated choice. The full ruling, with both registers and their
          locators, is on the surface index.
        </p>
      </section>

      <section aria-label="What this destination holds" className="mt-6">
        <h2 className="text-lg font-semibold">What this destination holds</h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {destination.modulesShown}. Roles that can open it: {destination.rolesThatCanOpen}.
          Reached from: {destination.navigationEntryPoint}.
        </p>
        {children === undefined ? (
          <p
            data-testid="fl-not-built-yet"
            className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
          >
            No control is drawn here yet. This wave built the surface shell, the six route
            keys and the shared player route; the modules above are real and land in later
            waves of this slice. That is a statement about a schedule, not about the
            product.
          </p>
        ) : null}
      </section>

      {children !== undefined ? <div className="mt-8">{children}</div> : null}

      <p className="mt-10 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a
        connected production system.
      </p>
    </main>
  )
}

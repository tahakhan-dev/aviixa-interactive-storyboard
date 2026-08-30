import type { Metadata } from 'next'
import Link from 'next/link'
import { surfaceById } from '@/domain/surfaces'
import { routeBySurface, routeOpenDecisionFor } from '@/routes/definitions'
import {
  AGREED_TOKENS,
  CONTESTED_TOKENS,
  FL_DESTINATIONS,
  FL_PLAYER_VIEWS,
  FL_OVERLAY_ON_ANY_DESTINATION,
  SCR_FL_NAMESPACE_RULING,
  S227_ROW_COUNT,
  frontlinePathname,
} from '@/frontline/screens'
import {
  CrossSurfaceAct,
  FL_ACTS_HELD_ELSEWHERE,
  frontlineCrossSurfaceModel,
} from '@/frontline/cross-surface'

const SURFACE = surfaceById('SURF-FL')

// M2: sourced from the route registry, not a second hand-typed string.
export const metadata: Metadata = { title: routeBySurface('SURF-FL').title }

/**
 * THE SURFACE INDEX, AND IT IS NOT A SEVENTH DESTINATION.
 *
 * `AC-FL-010-1` (L40045) counts destinations a worker can stand in. This
 * page is the build's own map of the surface — the ruling, the six route
 * keys, the acts the surface does not carry — and a worker never arrives
 * here: no destination links back to it, and the six-item navigation the
 * shell draws does not include it. If it became worker-facing the count
 * would be seven and the criterion would fail.
 *
 * IDENTIFIERS ARE RENDERED FROM DATA, NOT WRITTEN AS LITERALS IN THIS FILE,
 * AND THAT IS DELIBERATE. `scripts/build-registries.mjs` derives every
 * inventory's coverage status from the identifier-shaped tokens a shipped
 * route file NAMES, and it discloses its own ceiling: a screen that names an
 * identifier in order to record that it does NOT act on it counts the same
 * as one that renders it. Spelling the seventeen unbuilt player-view
 * identifiers here would move seventeen rows to demonstrated on the strength
 * of a sentence saying they are not built. The line is what a reader can
 * check; the identifier is what a generator would miscount.
 */

// The Worker is the only role that holds an execution session here
// (AC-FL-009-2, L39945), so this is the viewer every cross-surface pointer
// below is checked against.
const VIEWER = 'WORKER' as const

export default function FrontlineHome() {
  const tenantAdminOpen = routeOpenDecisionFor('SURF-FL', 'TENANT_ADMIN')

  return (
    <main id="main" className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">
        AVIIXA
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{SURFACE.name}</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">{SURFACE.purpose}</p>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        <span className="font-medium text-[var(--color-ink)]">What this surface owns: </span>
        {SURFACE.ownership}
      </p>

      {/* ---- THE SIX DESTINATIONS ---- */}
      <section aria-label="The six destinations" className="mt-10">
        <h2 className="text-xl font-semibold">Six destinations, and no seventh</h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          This page is the build&rsquo;s map of the surface, not a place a worker stands.
          Nothing links back here from a destination.
        </p>
        <ul className="mt-4 space-y-4">
          {FL_DESTINATIONS.map((d) => (
            <li key={d.slug} data-testid={`fl-destination-${d.slug}`}>
              <Link
                href={`${frontlinePathname(d.slug)}/`}
                className="font-medium text-[var(--color-primary)] underline"
              >
                {d.name}
              </Link>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{d.purpose}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                With no connection: {d.offlineNote}.
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{d.sourceRef}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- THE NAMESPACE RULING ---- */}
      <section
        aria-label="The screen identifier ruling"
        data-testid="fl-namespace-ruling"
        className="mt-10 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-5"
      >
        <h2 className="text-xl font-semibold">
          A build ruling on the screen identifiers, disclosed rather than made quietly
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {SCR_FL_NAMESPACE_RULING.question}
        </p>

        <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Both registers stand. Neither is this build&rsquo;s to correct.
        </h3>
        <ul className="mt-2 space-y-3">
          {SCR_FL_NAMESPACE_RULING.readings.map((r) => (
            <li key={r.locator} data-testid="fl-namespace-reading">
              <p className="text-sm font-medium text-[var(--color-ink)]">{r.label}</p>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                {r.reading}
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{r.locator}</p>
            </li>
          ))}
        </ul>

        <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Where they disagree
        </h3>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {CONTESTED_TOKENS.length} of the {CONTESTED_TOKENS.length + AGREED_TOKENS.length}{' '}
          shared identifiers name a different screen in each register.
          {AGREED_TOKENS.map((t) => (
            <span key={t.token}>
              {' '}
              The one they agree on is {t.token}, which both read as &ldquo;{t.registerA}
              &rdquo;.
            </span>
          ))}
        </p>
        <ul className="mt-2 space-y-2">
          {CONTESTED_TOKENS.map((t) => (
            <li key={t.token} data-testid="fl-contested-token" className="text-sm">
              <span className="font-mono text-[var(--color-ink)]">{t.token}</span> reads
              &ldquo;{t.registerA}&rdquo;{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">[{t.registerARef}]</span>{' '}
              and &ldquo;{t.registerB}&rdquo;{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">[{t.registerBRef}]</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
          This build&rsquo;s working position
        </h3>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink)]">
          {SCR_FL_NAMESPACE_RULING.ruling}
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {SCR_FL_NAMESPACE_RULING.whyNotQuiet}
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {SCR_FL_NAMESPACE_RULING.delegation}
        </p>
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
          {SCR_FL_NAMESPACE_RULING.sourceRef}
        </p>
      </section>

      {/* ---- THE SEVENTEEN THAT ARE NOT ROUTES ---- */}
      <section aria-label="Views that are not destinations" className="mt-10">
        <h2 className="text-xl font-semibold">
          The other {FL_PLAYER_VIEWS.length} rows are states, not places
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The twenty-three-row register holds {S227_ROW_COUNT} rows in total. Six of them
          carry the identifiers the destinations above are annotated with. The other{' '}
          {FL_PLAYER_VIEWS.length} are states of a destination and one full-screen
          interrupt, and none of them becomes a route: a deep link to a deviation, a
          containment checklist, a coaching card, a handover or a sign-off is exactly what
          this surface must not have.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {FL_PLAYER_VIEWS.map((v) => (
            <li key={v.sourceRef} data-testid="fl-non-route-view">
              <span className="text-[var(--color-ink)]">{v.name}</span> — a state of{' '}
              {v.destinationColumn}{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{v.sourceRef}]
              </span>
            </li>
          ))}
          <li data-testid="fl-overlay-row">
            <span className="text-[var(--color-ink)]">
              {FL_OVERLAY_ON_ANY_DESTINATION.name}
            </span>{' '}
            — {FL_OVERLAY_ON_ANY_DESTINATION.destinationColumn}. Not a
            twenty-fourth row: it is the same register row the Run Player&rsquo;s
            identifier is contested with, read the other way.{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{FL_OVERLAY_ON_ANY_DESTINATION.sourceRef}]
            </span>
          </li>
        </ul>
      </section>

      {/* ---- ACTS THIS SURFACE NEVER CARRIES ---- */}
      <section aria-label="Acts held on another surface" className="mt-10">
        <h2 className="text-xl font-semibold">What this surface never carries</h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each of these has a permissive status somewhere in this surface&rsquo;s twelve
          permission tables, and each of them belongs to another surface. The status is not
          corrected here and the table goes on saying what it says; what is refused is the
          control.
        </p>
        <div className="mt-4 space-y-4">
          {FL_ACTS_HELD_ELSEWHERE.map((act) => (
            <CrossSurfaceAct
              key={act.capability}
              model={frontlineCrossSurfaceModel(act, VIEWER)}
            />
          ))}
        </div>
      </section>

      {/* ---- THE OPEN QUESTION THE SOURCE REFUSES TO ANSWER ---- */}
      {tenantAdminOpen !== null ? (
        <section
          aria-label="An open question about who may open this surface"
          data-testid="fl-tenant-admin-open"
          className="mt-10 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-5"
        >
          <h2 className="text-xl font-semibold">
            Whether a Tenant Admin holds a session on a device is unanswered
          </h2>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {tenantAdminOpen.why}
          </p>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Eleven cells across this surface&rsquo;s permission tables read{' '}
            <span className="text-[var(--color-ink)]">Client Decision Required</span>, and{' '}
            <span className="text-[var(--color-ink)]">ten</span> of them defer to this
            question. The eleventh does not: it asks whether a Tenant Admin may trigger a
            remote wipe, and its own cell gives a different reason — the Statement of Work
            places device wipe and de-authorisation in the platform critical class. None of
            the eleven is answered here in either direction.
          </p>
        </section>
      ) : null}

      <p className="mt-10 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a
        connected production system.
      </p>
    </main>
  )
}

import { A1MatrixSection } from './MatrixSection'
import {
  A1CharterCard,
  A1ComplianceMessageReadings,
  A1DestinationCard,
  A1FallbackContract,
  A1OfflineStanding,
  A1OpenDecisions,
} from './Disclosures'
import { A1_DEVICE_MODES, a1DeviceMode } from './service'
import { GENUINE_NON_WORKER_CONTROLS, a1RowById, type A1Column } from './matrix'

/**
 * `SCR-FL-01` — Login, the first of `MOD-FL-A1`'s two destinations.
 *
 * A PLAIN VIEW COMPONENT, NOT A `RunPlayerPanel`. This module's destinations
 * are Login and Profile-lite; neither is the Run Player, so neither exports
 * a panel. Nothing in this module reads or writes anything under `app/`.
 *
 * §22.7 NAMES THIS SCREEN "Login, adapting to device mode" (L39863), which
 * is why the device mode is a prop and both modes render. The mode itself is
 * set per device at enrollment in the Super Admin platform console and
 * cannot be changed from the device (L40193, L40274) — so the mode selects
 * what this screen OFFERS and never becomes a control on it.
 *
 * THIS IS WHERE THE SIX GENUINE NON-WORKER CELLS ARE. Three rows —
 * single sign-on (L40189), managed username and Personal Identification
 * Number (L40190), and the second-identity step-up (L40192) — carry a
 * permissive Supervisor and Quality Manager cell each side, and every one of
 * them is an on-device act rather than an elsewhere-act. They are stated on
 * screen rather than left implicit, because the rule that deletes them
 * ("a permissive Supervisor cell means the act is elsewhere") is right
 * everywhere else on this surface.
 */
export interface LoginViewProps {
  /** The persona column the reader is standing in. */
  readonly column: A1Column
  /** Set at enrollment, never on the device. Both modes render. */
  readonly deviceMode?: 'shared' | 'personal'
}

export function LoginView({ column, deviceMode = 'shared' }: LoginViewProps) {
  const mode = a1DeviceMode(deviceMode)

  return (
    <div data-testid="fl-a1-login" data-device-mode={mode.id} className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">
          Login — MOD-FL-A1, Identity, Authentication and Device Mode
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Who is using this tablet right now. The device confers no identity: a stolen device is not
          a stolen account, and permissions, qualifications and language all come from the person
          who signs in.{' '}
          <span className="text-xs text-[var(--color-ink-subtle)]">[L40172, L40248]</span>
        </p>
      </header>

      <A1DestinationCard viewing="sign-in" />

      <A1CharterCard
        heading="The module card"
        ids={['identifier', 'purpose', 'user-benefit', 'owning-surface', 'roles', 'states']}
      />

      <section
        data-testid="fl-a1-device-mode"
        aria-label="Device mode"
        className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4 space-y-3"
      >
        <h2 className="text-base font-semibold text-[var(--color-ink)]">
          This device is enrolled in {mode.name}
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)]">{mode.loginBehaviour}</p>
        <p className="text-sm text-[var(--color-ink-muted)]">{mode.posture}</p>
        <p className="text-xs text-[var(--color-ink-subtle)]">{mode.sourceRef}</p>
        <p className="text-sm text-[var(--color-ink)]">
          The mode is set per device at enrollment in the Super Admin platform console and cannot be
          changed from here. No control for changing it is drawn on this screen, and TEST-A1-4
          asserts that no interface for it exists at all.{' '}
          <span className="text-xs text-[var(--color-ink-subtle)]">[L40193, L40274, L40330]</span>
        </p>
        <ul className="text-xs text-[var(--color-ink-subtle)]">
          {A1_DEVICE_MODES.map((m) => (
            <li key={m.id} data-testid="fl-a1-mode-listed" data-mode={m.id}>
              {m.name} — {m.sourceRef}
            </li>
          ))}
        </ul>
      </section>

      <section
        data-testid="fl-a1-genuine-controls"
        aria-label="The non-Worker controls this surface genuinely holds"
        className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4 space-y-3"
      >
        <h2 className="text-base font-semibold text-[var(--color-ink)]">
          The non-Worker acts this device genuinely holds
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Across the twelve module matrices of this surface, a permissive Supervisor or Quality
          Manager cell almost always describes an act held on the Delivery Operations Hub, the
          Client Command Center, the Standards and Operations Studio or the Super Admin platform
          console. Six rows are the exception and three of them are this module’s. Every one of the
          three is the second-identity step-up, which L40182 names as the only way either role
          touches this device.
        </p>
        <ul className="space-y-2">
          {GENUINE_NON_WORKER_CONTROLS.map((g) => (
            <li key={g.rowId} data-testid="fl-a1-genuine-control" data-row={g.rowId} className="text-sm">
              <span className="font-medium text-[var(--color-ink)]">
                {a1RowById(g.rowId).control}
              </span>{' '}
              <span className="text-[var(--color-ink-muted)]">
                — {g.columns.join(' and ')}. {g.why}
              </span>{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">[{g.sourceRef}]</span>
            </li>
          ))}
        </ul>
      </section>

      <A1MatrixSection
        viewing="sign-in"
        column={column}
        heading={`What Login draws for the ${column} column`}
      />

      <A1OfflineStanding viewing="sign-in" />
      <A1ComplianceMessageReadings />
      <A1FallbackContract />
      <A1OpenDecisions />
    </div>
  )
}

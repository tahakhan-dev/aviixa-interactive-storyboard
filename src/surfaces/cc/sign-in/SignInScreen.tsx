import {
  CC_EXCLUSION_TOKEN_READINGS,
  CC_LANDING_PRECEDENCE,
  CC_REGISTER_NAMED_LANDINGS,
  CC_SIGN_IN_EXCLUSION,
  CC_SIGN_IN_FALLBACK,
  CC_SIGN_IN_MOD_DOH_09_READINGS,
  CC_SIGN_IN_SCREEN,
  CC_SIGN_IN_SOURCE_TESTS,
  CC_TENANT_ADMIN_READINGS,
  CC_TENANT_ADMIN_UNRESOLVED,
  ccLandingIsRegisterNamed,
} from './model'

/**
 * `SCR-CC-01` — THE SIGN-IN, RENDERED.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Everything it
 * draws comes from `./model.ts` and, through it, from five modules this task
 * does not own. A client directive here would replace those exports with
 * client references and empty every string in the build while the component
 * suite stayed green.
 *
 * ── NO ACTION RAIL, AND THE REASON IS ENUMERATED ─────────────────────────
 *
 * L38793 names the modules where one or more of the ten operational actions
 * is exercised: `MOD-CC-04`, `MOD-CC-05`, `MOD-CC-06`, `MOD-CC-09`,
 * `MOD-CC-10`, `MOD-CC-12` and `MOD-CC-03` — seven, counted off that line.
 * This screen reuses the Delivery Operations Hub's identity module and is on
 * none of them. Ten operational controls on a screen exercising none of them
 * is the drift the closed set exists to prevent, and on a sign-in it would
 * sit in front of a session that does not exist yet.
 *
 * ── NO CONTROL AT ALL, ACTUALLY ──────────────────────────────────────────
 *
 * There is no credential field here and it is not an omission. This screen's
 * authority question is answered before the request by `evaluateCCAccess`,
 * and its failure mode is `FB-CC-AUTH`, whose decision-controls cell is a
 * single word and whose queueing cell denies the session outright. A
 * disabled control would imply a condition that could become true; there is
 * none between "no session" and "session".
 *
 * ── IT RENDERS NO LANDING FOR THE TENANT ADMIN ───────────────────────────
 *
 * The precedence table's seven rows are drawn whole, each with the register's
 * verdict on whether that landing is a landing the register receives.
 * `ccLandingIsRegisterNamed` computes that from the register's own
 * `Navigation entry point` column, so the two Tenant Admin rows read "not
 * named as a landing by the register" because the register says so, not
 * because this file says so.
 */

const CELL = 'px-3 py-2 align-top text-sm'
const HEAD =
  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]'

function Readings({
  id,
  heading,
  readings,
}: {
  readonly id: string
  readonly heading: string
  readonly readings: readonly { readonly text: string; readonly locator: string }[]
}) {
  return (
    <section className="mt-8" data-testid={`cc-sign-in-${id}`}>
      <h3 className="text-base font-semibold">{heading}</h3>
      <ul className="mt-2 space-y-3">
        {readings.map((r) => (
          <li key={r.locator} data-testid={`cc-sign-in-${id}-${r.locator}`}>
            <p className="max-w-prose text-sm text-[var(--color-ink)]">{r.text}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{r.locator}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SignInScreen() {
  const screen = CC_SIGN_IN_SCREEN
  return (
    <section data-testid="cc-sign-in" className="mt-8">
      <h2 className="text-2xl font-semibold">{screen.name}</h2>
      <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">{screen.purpose}</p>
      <p data-testid="cc-sign-in-register" className="mt-2 text-sm text-[var(--color-ink-subtle)]">
        {screen.id} · register row {screen.registerRef} · roles that can open it:{' '}
        {screen.rolesColumn} · modules and features shown: {screen.modulesShown} · navigation entry
        point: {screen.navigationEntry}
      </p>

      {/* THE ABSTENTION, ON SCREEN RATHER THAN ONLY IN A HEADER. */}
      <p
        data-testid="cc-sign-in-no-route"
        className="mt-4 max-w-prose rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm text-[var(--color-ink-muted)]"
      >
        <span className="font-medium text-[var(--color-ink)]">
          This surface authors no route directory for this screen.{' '}
        </span>
        The register carries thirteen screens and this surface authors twelve directories. This row
        reuses the Delivery Operations Hub&rsquo;s identity module, and its route key already names
        a directory on two other surfaces, so a thirteenth directory here would collide on the
        first name and be refused as an unregistered route on any other.
      </p>

      {/* THE SURFACE EXCLUSION — REPORTED, NEVER RE-DECIDED. */}
      <section className="mt-8" data-testid="cc-sign-in-exclusion">
        <h3 className="text-base font-semibold">The surface exclusion, checked at the door</h3>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Two of the five tenant roles hold no access to this surface at all, and the check runs
          before the request rather than as a matrix cell. Nothing on this screen decides it a
          second time.
        </p>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="text-[var(--color-ink-subtle)]">Roles the route layer grants:</dt>
            <dd data-testid="cc-sign-in-route-grants" className="text-[var(--color-ink)]">
              {CC_SIGN_IN_EXCLUSION.routeLayerGrants.join(', ')}
            </dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-[var(--color-ink-subtle)]">Excluded at the door:</dt>
            <dd data-testid="cc-sign-in-excluded" className="text-[var(--color-ink)]">
              {CC_SIGN_IN_EXCLUSION.excludedAtTheDoor.join(', ')}
            </dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-[var(--color-ink-subtle)]">
              Refused this screen by the screen gate:
            </dt>
            <dd data-testid="cc-sign-in-refused" className="text-[var(--color-ink)]">
              {CC_SIGN_IN_EXCLUSION.refusedByScreenGate.join(', ')}
            </dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-[var(--color-ink-subtle)]">
              No excluded role appears in the route layer&rsquo;s grant:
            </dt>
            <dd data-testid="cc-sign-in-satisfied" className="text-[var(--color-ink)]">
              {String(CC_SIGN_IN_EXCLUSION.satisfiedAtRouteLayer)}
            </dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-[var(--color-ink-subtle)]">
              Every role the register admits is granted by the route layer:
            </dt>
            <dd data-testid="cc-sign-in-register-agrees" className="text-[var(--color-ink)]">
              {String(CC_SIGN_IN_EXCLUSION.registerAgreesWithRouteLayer)}
            </dd>
          </div>
        </dl>
      </section>

      <Readings
        id="exclusion-tokens"
        heading="One exclusion, three status tokens, none chosen"
        readings={CC_EXCLUSION_TOKEN_READINGS}
      />

      {/* THE PRECEDENCE TABLE, WHOLE. */}
      <section className="mt-8" data-testid="cc-sign-in-landings">
        <h3 className="text-base font-semibold">Landing resolution at session open</h3>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The landing is a routing default, never a permission: every role may reach any view
          within its scope in one navigation act. The register itself names{' '}
          {CC_REGISTER_NAMED_LANDINGS.length} of these as landings, and that column is derived from
          the register rather than restated here.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--color-border-strong)]">
                <th className={HEAD}>Grant set held</th>
                <th className={HEAD}>Landing view</th>
                <th className={HEAD}>Reason</th>
                <th className={HEAD}>Named as a landing by the register</th>
                <th className={HEAD}>Row</th>
              </tr>
            </thead>
            <tbody>
              {CC_LANDING_PRECEDENCE.map((row) => (
                <tr
                  key={row.sourceRef}
                  data-testid={`cc-sign-in-landing-${row.sourceRef}`}
                  className="border-b border-[var(--color-border)]"
                >
                  <td className={CELL} data-testid={`cc-sign-in-landing-${row.sourceRef}-grantSet`}>
                    {row.grantSet}
                  </td>
                  <td className={CELL} data-testid={`cc-sign-in-landing-${row.sourceRef}-view`}>
                    {row.landingView}
                  </td>
                  <td className={CELL} data-testid={`cc-sign-in-landing-${row.sourceRef}-reason`}>
                    {row.reason}
                  </td>
                  <td className={CELL} data-testid={`cc-sign-in-landing-${row.sourceRef}-named`}>
                    {ccLandingIsRegisterNamed(row)
                      ? `Yes — ${String(row.registerScreen)}`
                      : row.registerScreen === null
                        ? 'No register row resolves this landing'
                        : `No — ${row.registerScreen} is entered from main navigation`}
                  </td>
                  <td className={CELL} data-testid={`cc-sign-in-landing-${row.sourceRef}-ref`}>
                    {row.sourceRef}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Readings
        id="tenant-admin"
        heading="What a Tenant Admin session reaches — eight statements, no ruling"
        readings={CC_TENANT_ADMIN_READINGS}
      />
      <p
        data-testid="cc-sign-in-tenant-admin-unresolved"
        className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        {CC_TENANT_ADMIN_UNRESOLVED}
      </p>

      <Readings
        id="mod-doh-09"
        heading="The module this screen reuses, and its own authority row"
        readings={CC_SIGN_IN_MOD_DOH_09_READINGS}
      />

      {/* FB-CC-AUTH, READ FROM THE WAVE-0 REGISTRY. */}
      <section className="mt-8" data-testid="cc-sign-in-fallback">
        <h3 className="text-base font-semibold">
          When identity, role or scope will not resolve — {CC_SIGN_IN_FALLBACK.id}
        </h3>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="text-[var(--color-ink-subtle)]">Triggering condition:</dt>
            <dd data-testid="cc-sign-in-fb-trigger" className="text-[var(--color-ink)]">
              {CC_SIGN_IN_FALLBACK.triggeringCondition}
            </dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-[var(--color-ink-subtle)]">Decision controls:</dt>
            <dd data-testid="cc-sign-in-fb-controls" className="text-[var(--color-ink)]">
              {CC_SIGN_IN_FALLBACK.decisionControls}
            </dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-[var(--color-ink-subtle)]">Client-side queueing:</dt>
            <dd data-testid="cc-sign-in-fb-queue" className="text-[var(--color-ink)]">
              {CC_SIGN_IN_FALLBACK.clientSideQueueing}
            </dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-[var(--color-ink-subtle)]">Terminal safe state:</dt>
            <dd data-testid="cc-sign-in-fb-terminal" className="text-[var(--color-ink)]">
              {CC_SIGN_IN_FALLBACK.terminalSafeState}
            </dd>
          </div>
        </dl>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          There is no degraded-authentication mode. The session is denied and audited; nothing is
          held on the client to replay later.
        </p>
      </section>

      <Readings
        id="source-tests"
        heading="The source's own tests for this screen"
        readings={CC_SIGN_IN_SOURCE_TESTS}
      />
    </section>
  )
}

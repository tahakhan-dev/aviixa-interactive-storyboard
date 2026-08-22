import { A1MatrixSection } from './MatrixSection'
import {
  A1CharterCard,
  A1DestinationCard,
  A1FallbackContract,
  A1OfflineStanding,
  A1OpenDecisions,
} from './Disclosures'
import { type A1Column } from './matrix'

/**
 * `SCR-FL-06` — Profile-lite, the second of `MOD-FL-A1`'s two destinations.
 * A plain view component; neither of this module's destinations is the Run
 * Player, so neither exports a `RunPlayerPanel`.
 *
 * §25.5 gives this destination the purpose "Set language preference and log
 * out" (L48534), and the happy path's own step 8 puts the end-of-shift
 * logout here (L40218). Those are rows 8 and 10 of the matrix, and this is
 * the destination on which they are `screen` rather than a named place.
 *
 * ROW 10 IS THE CLEAREST `Not applicable` IN THE SLICE, AND IT RENDERS AS
 * ONE. L40197 gives the Supervisor and the Quality Manager
 * "Not applicable — a step-up is released rather than logged out" and
 * "Not applicable — same basis". Rendered in the prohibition band, that
 * would tell a Supervisor they are forbidden from logging out, when the
 * truth is that they were never logged in — a step-up is released. Both
 * cells name the step-up row of this same matrix in their own words, so
 * `frontlineAffordance` reaches them at question 4 and returns a routed
 * pointer, not a refusal.
 *
 * THE TENANT ADMIN CELL ON THAT ROW IS A BARE `Not applicable` NAMING
 * NOTHING, so it carries no route and renders as what it is, with its token
 * shown and the sentence that says a `Not applicable` is not a refusal.
 */
export interface ProfileLiteViewProps {
  readonly column: A1Column
}

export function ProfileLiteView({ column }: ProfileLiteViewProps) {
  return (
    <div data-testid="fl-a1-profile-lite" className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          Profile-lite — MOD-FL-A1, Identity, Authentication and Device Mode
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Language preference and logout, for the identity currently signed in. Both work with no
          connection.{' '}
          <span className="text-xs text-[var(--color-ink-subtle)]">[L48534, L40037]</span>
        </p>
      </header>

      <A1DestinationCard viewing="profile-lite" />

      <A1CharterCard
        heading="What this module says about this destination"
        ids={['purpose', 'roles', 'logout-place', 'offline', 'fallback']}
      />

      <A1MatrixSection
        viewing="profile-lite"
        column={column}
        heading={`What Profile-lite draws for the ${column} column`}
      />

      <A1OfflineStanding viewing="profile-lite" />
      <A1FallbackContract />
      <A1OpenDecisions />
    </div>
  )
}

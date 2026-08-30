'use client'

import { useState } from 'react'
import { StudioShell } from '../StudioShell'
import { CapabilityPanel } from '../permissions-and-grants/CapabilityPanel'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import type { StudioPersonaColumn } from '@/studio/access/evaluate'
import type { StudioGrantState } from '@/studio/access/grants'
import { stu18Row } from '@/studio/modules/stu-18/matrix'
import {
  SEEDED_SCENARIO,
  affordanceFor,
  decisionForRow,
  type Stu18Scenario,
} from '@/studio/modules/stu-18/rendering'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { routeOpenDecisionFor } from '@/routes/definitions'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { Button, Select } from '@/ui/primitives'

/**
 * `SCR-STU-01` — Sign-in (L48259), rendering `SB-STU-21`'s capability panel
 * (L34631) for the identity that just arrived.
 *
 * WHY THE CAPABILITY PANEL IS HERE AND NOT ONLY ON `SCR-STU-15`. Catalogue B
 * restricts `SCR-STU-15` to the Tenant Admin, while `SB-STU-21` describes the
 * panel as a view of "the signed-in identity, its roles, its grants, and the
 * tenant's tier" with the Tenant Admin's view merely ADDING the two controls.
 * A panel only one persona can open cannot satisfy `AC-STU-155` for the
 * people whose capabilities are unavailable, so it renders on the screen
 * every signed-in identity reaches. The divergence is recorded on
 * `SCR-STU-15`'s unspecified-in-source panel rather than resolved silently.
 *
 * THE HAPPY PATH THIS SCREEN DRAWS, in the source's own five steps (L34599):
 * a user signs in and selects the Studio; the identity layer supplies roles,
 * grants and the tenant's tier; the Studio composes the visible capability
 * set from that authorisation state; every action is authorised at the
 * service layer; refusals are stated with a reason and audited.
 *
 * THIS SCREEN OFFERS NO WRITE. Grant administration is `SCR-STU-15`'s, and
 * `Continue into the Studio` is the one control here — decided per control,
 * over row 1 of the consolidated matrix.
 */

const OPEN_ROW = stu18Row('open-the-studio')

export type SignInScreenProps = Partial<Stu18Scenario>

export function SignInScreen(props: SignInScreenProps) {
  const [persona, setPersona] = useState<StudioPersonaColumn>(
    props.persona ?? SEEDED_SCENARIO.persona,
  )
  const [identityLayer, setIdentityLayer] = useState(
    props.identityLayer ?? SEEDED_SCENARIO.identityLayer,
  )
  const [authoringGrant] = useState<StudioGrantState | null>(
    props.authoringGrant === undefined ? SEEDED_SCENARIO.authoringGrant : props.authoringGrant,
  )

  const scenario: Stu18Scenario = {
    persona,
    online: props.online ?? SEEDED_SCENARIO.online,
    identityLayer,
    commercialTier: props.commercialTier ?? SEEDED_SCENARIO.commercialTier,
    authoringGrant,
    agentGrant: props.agentGrant === undefined ? SEEDED_SCENARIO.agentGrant : props.agentGrant,
    implGrant: props.implGrant === undefined ? SEEDED_SCENARIO.implGrant : props.implGrant,
  }

  const openDecision = decisionForRow(OPEN_ROW, scenario)
  const affordance = affordanceFor('Continue into the Studio', openDecision)
  const auditorOpen = routeOpenDecisionFor('SURF-STU', 'READONLY_AUDITOR')

  return (
    <StudioShell
      module={stuModuleById(STU_MODULES, 'MOD-STU-18')}
      screenId="SCR-STU-01"
      persona={persona as StudioPersonaId}
      onPersonaChange={(next) => setPersona(next as StudioPersonaColumn)}
    >
      <section aria-labelledby="sign-in" className="mt-6">
        <h2 id="sign-in" className="text-lg font-semibold">
          Sign in to the authoring workspace
        </h2>
        <ol className="mt-2 max-w-prose list-decimal space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          <li>A user signs in and selects the Studio.</li>
          <li>The identity layer supplies the user&rsquo;s roles, grants, and the tenant&rsquo;s tier.</li>
          <li>
            The Studio composes the navigation and the visible capability set from that
            authorisation state.
          </li>
          <li>Every action the user attempts is authorised at the service layer.</li>
          <li>Refusals are stated with a reason and audited (L34599&ndash;L34603, L34657).</li>
        </ol>

        <div className="mt-4">
          {affordance.kind === 'enabled' ? (
            <Button>{affordance.label}</Button>
          ) : affordance.kind === 'disabled' ? (
            <Button disabledReason={affordance.reason}>{affordance.label}</Button>
          ) : affordance.kind === 'decision-open' ? (
            <p role="note" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
              {affordance.label} is not offered while {affordance.openDecision} is open.{' '}
              {affordance.note}
            </p>
          ) : (
            <ProhibitionNotice rendering={{ kind: 'absent', note: affordance.note }} />
          )}
        </div>

        {identityLayer === 'unreachable' ? (
          <div
            role="note"
            className="mt-4 max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4 text-sm"
          >
            <p className="font-medium text-[var(--color-ink)]">
              The identity layer is unreachable, so the Studio has failed closed.
            </p>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              L34605 and AC-STU-156 (L34673): the Studio denies authoring capabilities and permits
              nothing beyond published read. Published Workflow content can be read; nothing can be
              authored, reviewed or released, and nothing attempted while the layer is down is
              retroactively permitted when it returns (L34663).
            </p>
            <p className="mt-2 text-[var(--color-ink-subtle)]">
              Being wrong in this direction costs an author a session. Being wrong in the other
              direction lets an unevaluated grant put a specification limit on a factory floor,
              which is why the grant is denied rather than assumed (L34584).
            </p>
          </div>
        ) : null}
      </section>

      <CapabilityPanel scenario={scenario} />

      <section aria-labelledby="sign-in-decisions" className="mt-10 space-y-4">
        <h2 id="sign-in-decisions" className="text-lg font-semibold">
          What this screen cannot answer
        </h2>
        {auditorOpen === null ? null : (
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            The route registry records the Read-only Auditor&rsquo;s Studio access as{' '}
            <strong>{auditorOpen.decision}</strong> rather than as a refusal. {auditorOpen.why}
          </p>
        )}
        <DecisionDisclosure id="DEC-AUDSTU-001" />
        <DecisionDisclosure id="DEC-TENGRANT-001" />
      </section>

      <section
        aria-label="Storyboard scenario switchers"
        className="mt-10 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Reviewer controls — not part of the product
        </p>
        <div className="mt-3 max-w-md">
          <Select
            label="Identity layer"
            value={identityLayer}
            options={[
              { value: 'reachable', label: 'Reachable' },
              { value: 'unreachable', label: 'Unreachable — fail closed to published read' },
            ]}
            onChange={(v) => setIdentityLayer(v === 'unreachable' ? 'unreachable' : 'reachable')}
          />
        </div>
      </section>
    </StudioShell>
  )
}

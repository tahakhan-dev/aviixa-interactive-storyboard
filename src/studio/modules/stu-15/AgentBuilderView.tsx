import type { CapabilityAffordance } from '@/studio/modules/stu-18/rendering'
import { Button } from '@/ui/primitives'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'
import {
  DISABLEMENT_HONESTY_LINE,
  NO_TERMINAL_STATE_STATEMENT,
  SEEDED_COMPOSED_AGENTS,
  builderSeams,
  composedAgents,
  disabledCapabilitiesOf,
  type ComposedAgentRegister,
} from './builder'
import {
  AGENT_BUILDER_PERMANENT_LINE,
  NO_ENABLEMENT_OPERATOR_STATEMENT,
  OBJ_STU_CAPSTATE_GAP,
  STU_15_LOCAL_DISCLOSURES,
  TIER_RENDERING_DIVERGENCE,
  agentBuilderControls,
  capabilityEnablementReadings,
  governanceTrack,
  stu15CrossSurfaceStatements,
  type Stu15Scenario,
} from './rendering'

/**
 * `SB-STU-18` (L34096), the Agent Builder: "A list of composed agents with
 * name, state badge, capability count, mapping count, and last state change.
 * A New Agent flow steps through name, capability selection with
 * drag-ordering, configuration, trigger, and mapping, with a running validity
 * panel naming any capability that is not enabled. A Governance tab per agent
 * shows the three gates as a progress track with each gate's outcome,
 * timestamp, and decider."
 *
 * **NOTHING HERE CLAIMS AN EVALUATION RAN.** Every gate outcome drawn is the
 * record the service wrote; a gate nobody reached prints "not reached" and a
 * result nobody gave prints "unknown".
 *
 * THIS COMPONENT COMPUTES NO PERMISSION.
 */
export interface AgentBuilderViewProps {
  readonly scenario: Stu15Scenario
  readonly register?: ComposedAgentRegister
}

const CARD = 'rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4'
const HEADING = 'text-base font-semibold text-[var(--color-ink)]'
const BODY = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const META = 'mt-1 text-xs text-[var(--color-ink-subtle)]'

function Affordance({ affordance }: { readonly affordance: CapabilityAffordance }) {
  if (affordance.kind === 'enabled') return <Button>{affordance.label}</Button>
  if (affordance.kind === 'disabled') {
    return <Button disabledReason={affordance.reason}>{affordance.label}</Button>
  }
  if (affordance.kind === 'decision-open') {
    return (
      <p role="note" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
        <span className="font-medium text-[var(--color-ink)]">{affordance.label}: </span>
        {affordance.note} No control is offered while {affordance.openDecision} is open — an
        offered control would assert the access the decision has not granted.
      </p>
    )
  }
  return (
    <p role="note" className="max-w-prose text-sm text-[var(--color-ink-subtle)]">
      {affordance.note}
    </p>
  )
}

export function AgentBuilderView({
  scenario,
  register = SEEDED_COMPOSED_AGENTS,
}: AgentBuilderViewProps) {
  const controls = agentBuilderControls(scenario)
  const crossSurface = stu15CrossSurfaceStatements()
  const agents = composedAgents(register)
  const enablement = capabilityEnablementReadings()
  const seams = builderSeams()

  return (
    <div className="space-y-6">
      <section className={CARD}>
        <h2 className={HEADING}>The Agent Builder — MOD-STU-15</h2>
        <p className={BODY} data-testid="agent-builder-permanent-line">
          {AGENT_BUILDER_PERMANENT_LINE}
        </p>
        <p className={BODY}>
          The Agent Builder composes from the registry; it never adds to it. Authoring a new atomic
          capability is a platform engineering task. A tenant enables and composes; a tenant never
          authors an atom.
        </p>
        <p className={META}>Source: L33971 · L33990 · card §5.15, L33961-L34152.</p>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>Composed agents in this workspace</h3>
        {agents.length === 0 ? (
          <p className={BODY}>No composed agent exists in this workspace.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {agents.map((agent) => {
              const notEnabled = disabledCapabilitiesOf(agent)
              return (
                <li key={agent.id} data-testid={`composed-agent-${agent.id}`}>
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {agent.name} — <span data-testid={`state-${agent.id}`}>{agent.state}</span>
                  </p>
                  <p className={META}>
                    {agent.capabilities.length} capabilities · {agent.mappings.length} mappings ·
                    last state change {agent.lastStateChange}
                  </p>
                  <p className={BODY}>
                    Ordered capabilities: {agent.capabilities.map((c) => c.name).join(' → ')}
                  </p>
                  <p className={BODY} data-testid={`validity-${agent.id}`}>
                    {notEnabled.length === 0
                      ? 'Running validity: every capability in this composition is enabled for this tenant.'
                      : `Running validity: not enabled — ${notEnabled.join(', ')}.`}
                  </p>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-[var(--color-ink)]">Governance</p>
                    <ol className="mt-1 space-y-1 text-sm text-[var(--color-ink-muted)]">
                      {governanceTrack(agent).map((step) => (
                        <li key={step.gate.id} data-testid={`gate-${agent.id}-${step.gate.id}`}>
                          {step.line}
                        </li>
                      ))}
                    </ol>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <p className={BODY} data-testid="no-terminal-state">
          {NO_TERMINAL_STATE_STATEMENT}
        </p>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>What this screen offers, per capability</h3>
        <p className={BODY}>{TIER_RENDERING_DIVERGENCE}</p>
        <ul className="mt-3 space-y-3">
          {controls.map((control) => (
            <li key={control.id} data-testid={`stu15-control-${control.id}`}>
              <Affordance affordance={control.affordance} />
              <p className={META}>Source: {control.sourceRefs.join(' · ')}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>Held on another surface</h3>
        <ul className="mt-3 space-y-3">
          {crossSurface.map((reading) => (
            <li key={reading.row.id} data-testid={`stu15-cross-surface-${reading.row.id}`}>
              <p className="text-sm font-medium text-[var(--color-ink)]">{reading.label}</p>
              <p className={BODY}>{reading.statement.owner}</p>
              <p className={BODY}>{reading.statement.whatThisScreenDoes}</p>
              <p className={META}>Source: {reading.statement.sourceRef}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>Configuration follows capability</h3>
        <p className={BODY} data-testid="no-enablement-operator">
          {NO_ENABLEMENT_OPERATOR_STATEMENT}
        </p>
        <ul className="mt-3 space-y-2">
          {enablement.map((reading) => (
            <li key={reading.row.id} data-testid={`capability-${reading.row.id}`}>
              <p className="text-sm text-[var(--color-ink)]">
                <span className="font-medium">{reading.row.name}</span> — {reading.row.enablement},{' '}
                {reading.row.entitlement}. Switches on: {reading.row.surfaceWording}
              </p>
              <p className={META}>{reading.consequence}</p>
            </li>
          ))}
        </ul>
        <p className={BODY} data-testid="disablement-honesty">
          {DISABLEMENT_HONESTY_LINE}
        </p>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>Cross-slice seams this module reads</h3>
        <ul className="mt-3 space-y-3">
          {seams.map((reading) => (
            <li key={reading.seam.id}>
              <StudioSeamNotice seam={reading.seam} />
              <p className={META}>While it cannot answer: {reading.whileUnanswered}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>Registered gap — {OBJ_STU_CAPSTATE_GAP.mnemonic}</h3>
        <p className={BODY} data-testid="capstate-gap">
          {OBJ_STU_CAPSTATE_GAP.mnemonic} has no numeric counterpart in the canonical object
          register. It is produced by {OBJ_STU_CAPSTATE_GAP.producedBy}, and is recorded as a
          registered gap under {OBJ_STU_CAPSTATE_GAP.disclosure} rather than minted as a new row,
          because minting one would inflate a closed register of ninety-nine.
        </p>
        <p className={META}>Source: {OBJ_STU_CAPSTATE_GAP.sourceRefs.join(' · ')}</p>
      </section>

      <DecisionDisclosure id="D11" />
      <DecisionDisclosure id="D12" />
      <DecisionDisclosure id="D13" />

      {STU_15_LOCAL_DISCLOSURES.map((disclosure) => (
        <section
          key={disclosure.decisionRef}
          role="note"
          aria-label={`Open decision ${disclosure.decisionRef}`}
          className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
        >
          <p className="font-medium text-[var(--color-ink)]">
            Open decision {disclosure.decisionRef}
          </p>
          <p className="mt-1 text-[var(--color-ink-muted)]">{disclosure.question}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            All readings stand. None is this build&rsquo;s to settle.
          </p>
          <ul className="mt-1 space-y-2">
            {disclosure.readings.map((reading) => (
              <li key={reading.locator + reading.text.slice(0, 24)}>
                <span className="text-[var(--color-ink)]">{reading.text}</span>{' '}
                <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                  [{reading.locator}]
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            This build&apos;s working position
          </p>
          <p className="mt-1 text-[var(--color-ink)]">{disclosure.adopted}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{disclosure.canonNote}</p>
        </section>
      ))}
    </div>
  )
}

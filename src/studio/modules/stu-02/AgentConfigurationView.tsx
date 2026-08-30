import type { ReactNode } from 'react'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import type { CapabilityAffordance } from '@/studio/modules/stu-18/rendering'
import { Button, Field } from '@/ui/primitives'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import {
  AGENT_CONFIGURATION_DRAFT,
  DETECTION_MECHANISMS,
  EMERGENCY_PAUSE_STATEMENT,
  STANDARD_AGENTS,
  agentParameterReadings,
  shiftHandoffLeadTime,
} from './agents'
import {
  AGENT_SIMULATION_STATEMENT,
  ARMING_CROSS_REFERENCE,
  STU_02_LOCAL_DISCLOSURES,
  agentConfigurationControls,
  crossSurfaceStatements,
  type Stu02Scenario,
} from './rendering'

/**
 * `SCR-STU-13`'s agent-configuration half, and `SB-010-01`'s panel fields
 * (L68013): "agent name, type of reasoning or action, on or off state,
 * trigger conditions, bounds for what it may show and when it may fire,
 * mapped workflows and screens, evaluation status, and the Shift Handoff
 * Agent's lead time before shift end."
 *
 * **THE LEAD TIME IS A FIELD AND IT IS READ-ONLY, AND THOSE ARE NOT IN
 * TENSION.** The storyboard lists it as a panel field; row 7 of the matrix
 * puts the act in the tenant administration area and gives this surface the
 * read. So the field renders with its value and cannot be edited here, and
 * the cell's own sentence renders as its description.
 *
 * THIS COMPONENT COMPUTES NO PERMISSION. It is handed a scenario, asks
 * `./rendering` — which lives under `src/studio/` — and draws the answers.
 */
export interface AgentConfigurationViewProps {
  readonly scenario: Stu02Scenario
  /** Which screen of the seeded draft the parameter map is read for. */
  readonly screenId?: string
}

const CARD = 'rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4'
const HEADING = 'text-base font-semibold text-[var(--color-ink)]'
const BODY = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const META = 'mt-1 text-xs text-[var(--color-ink-subtle)]'

function Affordance({
  affordance,
  children,
}: {
  readonly affordance: CapabilityAffordance
  readonly children?: ReactNode
}) {
  if (affordance.kind === 'enabled') {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <Button>{affordance.label}</Button>
        {children}
      </span>
    )
  }
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

export function AgentConfigurationView({
  scenario,
  screenId = 'screen 3',
}: AgentConfigurationViewProps) {
  const controls = agentConfigurationControls(scenario)
  const crossSurface = crossSurfaceStatements()
  const leadTime = shiftHandoffLeadTime()
  const parameters = agentParameterReadings(AGENT_CONFIGURATION_DRAFT, screenId)

  return (
    <div className="space-y-6">
      <section className={CARD}>
        <h2 className={HEADING}>Agent configuration — MOD-STU-02</h2>
        <p className={BODY} data-testid="agent-simulation-statement">
          {AGENT_SIMULATION_STATEMENT}
        </p>
        <p className={BODY}>
          An agent does not contain its own rules. The timing threshold that decides when coaching
          appears, the specification limits that define a tolerance breach, the severity mapping
          that determines how serious a deviation is, the containment checklist that launches in
          response — none of these live in the agent. They live in the Workflow.{' '}
          <strong>The agent is the engine; the Studio is where the engine is tuned.</strong>
        </p>
        <p className={META}>Source: L31688 · L31699 · card §5.2, L31680-L31869.</p>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>The three standard agents, and what each needs from the Studio</h3>
        <ul className="mt-3 space-y-4">
          {STANDARD_AGENTS.map((agent) => (
            <li key={agent.id} data-testid={`agent-${agent.id}`}>
              <p className="text-sm font-medium text-[var(--color-ink)]">{agent.name}</p>
              <p className={BODY}>{agent.typeWording}</p>
              <p className="mt-1 text-sm text-[var(--color-ink)]">
                <span className="font-medium">Governance binding: </span>
                <span data-testid={`governance-binding-${agent.id}`}>{agent.governanceBinding}</span>
              </p>
              <p className={META}>{agent.governanceNote}</p>
              <p className={BODY}>
                <span className="font-medium text-[var(--color-ink)]">
                  What the Studio must supply:{' '}
                </span>
                {agent.studioMustSupply}
              </p>
              <p className={META}>Where it is configured: {agent.configuredIn}</p>
              <p className={META}>Source: {agent.sourceRef}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>The three deterministic detection mechanisms</h3>
        <p className={BODY}>
          Detection is deterministic; interpretation is agentic. Whether a deviation has occurred is
          decided by fixed rules — time, sequence, specification and evidence — never by artificial
          intelligence. An agent activates only after a deterministic trigger fires.
        </p>
        <ul className="mt-3 space-y-3">
          {DETECTION_MECHANISMS.map((mechanism) => (
            <li key={mechanism.id} data-testid={`detection-${mechanism.id}`}>
              <p className="text-sm font-medium text-[var(--color-ink)]">{mechanism.name}</p>
              <p className={BODY}>{mechanism.triggeredBy}</p>
              <p className={META}>
                Configured in {mechanism.configuredIn}. Fires before any agent. Source:{' '}
                {mechanism.sourceRef}
              </p>
            </li>
          ))}
        </ul>
        <p className={BODY} data-testid="emergency-pause-statement">
          {EMERGENCY_PAUSE_STATEMENT}
        </p>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>
          What the authored configuration currently supplies — {screenId}
        </h3>
        <p className={BODY}>
          Read from a seeded draft of {AGENT_CONFIGURATION_DRAFT.workflowName}. Every value below
          was authored by a human in the section named beside it; this screen writes none of them.
        </p>
        <ul className="mt-3 space-y-3">
          {parameters.map((reading) => (
            <li key={`${reading.agent}-${reading.parameter}`}>
              <p className="text-sm text-[var(--color-ink)]">
                <span className="font-medium">{reading.parameter}: </span>
                {reading.value}
              </p>
              <p className={META}>
                Authored in {reading.authoredIn}. Source: {reading.sourceRef}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>Shift Handoff Agent schedule</h3>
        <Field label={leadTime.label} description={`${leadTime.ownershipStatement} Computed against ${leadTime.computedAgainst}. This creates ${leadTime.scheduleId}.`}>
          <input
            readOnly
            value={leadTime.value}
            data-testid="shift-handoff-lead-time"
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-[var(--color-ink)]"
          />
        </Field>
        <p className={META}>Source: {leadTime.sourceRefs.join(' · ')}</p>
        <div className="mt-3">
          <StudioSeamNotice seam={leadTime.seam} />
        </div>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>What this screen offers, per capability</h3>
        <ul className="mt-3 space-y-3">
          {controls.map((control) => (
            <li key={control.id} data-testid={`stu02-control-${control.id}`}>
              <Affordance affordance={control.affordance} />
              {control.authoredIn === null ? null : (
                <p className={META}>Authored in {control.authoredIn}.</p>
              )}
              <p className={META}>Source: {control.sourceRefs.join(' · ')}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>Held on another surface</h3>
        <p className={BODY}>
          These capabilities are real and somebody holds them — not on a Studio route. No control is
          drawn for either, because a disabled Studio control justified by a permission that lives
          somewhere else teaches the wrong rule.
        </p>
        <ul className="mt-3 space-y-3">
          {crossSurface.map((reading) => (
            <li key={reading.row.id} data-testid={`stu02-cross-surface-${reading.row.id}`}>
              <p className="text-sm font-medium text-[var(--color-ink)]">{reading.label}</p>
              <p className={BODY}>{reading.statement.owner}</p>
              <p className={BODY}>{reading.statement.whatThisScreenDoes}</p>
              <p className={META}>Source: {reading.statement.sourceRef}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={CARD}>
        <h3 className={HEADING}>{ARMING_CROSS_REFERENCE.heading}</h3>
        <p className={BODY}>
          A read-only cross-reference. The confirmation itself belongs to{' '}
          {ARMING_CROSS_REFERENCE.implementedBy}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {ARMING_CROSS_REFERENCE.statements.map((statement) => (
            <li key={statement}>{statement}</li>
          ))}
        </ul>
        <p className={META}>
          Cited section: {ARMING_CROSS_REFERENCE.citedSection}. Actual section:{' '}
          {ARMING_CROSS_REFERENCE.actualSection}. Source:{' '}
          {ARMING_CROSS_REFERENCE.sourceRefs.join(' · ')}
        </p>
      </section>

      <DecisionDisclosure id="DEC-STUXREF-001" />

      {STU_02_LOCAL_DISCLOSURES.map((disclosure) => (
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

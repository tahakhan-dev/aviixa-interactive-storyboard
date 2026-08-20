'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { SEEDED_LIBRARY_REGISTER, type LibraryRegister } from '@/studio/modules/stu-07/libraries'
import type { LibraryActor, LibraryAuditEntry } from '@/studio/modules/stu-07/writes'
import { STU_14_LOCAL_DISCLOSURES } from '@/studio/modules/stu-14/rendering'
import { SEEDED_TENANT, studioIdentityFor } from '@/studio/modules/stu-18/rendering'
import {
  LANE_A_SIMULATION_NOTE,
  LOW_PERFORMER_NOTE,
  SEEDED_CASE_RELEVANCE,
  SEEDED_LANE_A_LEDGER,
  coachingEffectiveness,
  laneASignalKey,
  type LaneARefinement,
  type SelectionWeights,
} from '@/studio/modules/stu-16/lane-a'
import {
  LANE_A_HAS_NO_PROPOSAL_STATE,
  LANE_B_PROPOSAL_STATES,
  LANE_B_SIMULATION_NOTE,
  SEEDED_OPEN_PROPOSALS,
  STALE_FLAG_DAYS,
  staleBadge,
} from '@/studio/modules/stu-16/lane-b'
import {
  LEARNING_FOOTER,
  SINGLE_TEST_STATEMENT,
  applyLaneABacklog,
  type LearningAuditEntry,
} from '@/studio/modules/stu-16/learning'
import {
  MEMORY_STORES,
  TENANT_ISOLATION_STATEMENT,
  anonymisationPolicy,
  memoryArchitectureRefusal,
  writeOnPublication,
} from '@/studio/modules/stu-16/memory'
import {
  boundaryStatements,
  learningControls,
  learningService,
  learningViewAffordance,
  learningViewIsOpen,
  otherSurfaceStatements,
  stu16Decision,
  stu16Scenario,
  type LearningStatement,
} from '@/studio/modules/stu-16/rendering'
import type { CapabilityAffordance } from '@/studio/modules/stu-18/rendering'
import { STU_SEAMS, stuSeamById } from '@/studio/seams'
import { Banner, Button, Select, StatusPill, Table } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import { StudioShell } from '../StudioShell'

/**
 * `SCR-STU-LEARN` — the learning read view (`SB-STU-19`, L34293), rendered on
 * its own route and annotated `SCR-STU-13`, minting no new screen id (D1,
 * plan C12).
 *
 * ## THE THING THIS SCREEN MUST NOT DO
 *
 * This module describes LEARNING, and a screen implying that a model
 * actually learned, that memory actually persisted across runs, or that a
 * suggestion was actually derived from observed work would be exactly the
 * claim this build's founding constraint forbids. So:
 *
 * - `LANE_A_SIMULATION_NOTE` and `LANE_B_SIMULATION_NOTE` render at the top
 *   of the panels they describe, in the same type as the figures beside
 *   them, saying plainly that the ledger is seeded and that the weighting is
 *   arithmetic computed on this page load.
 * - Nothing here persists. The Lane-A backlog is recomputed from the seeded
 *   ledger on every load, and the screen says so rather than presenting a
 *   figure that looks accumulated.
 * - No proposal on this screen was assembled by anything. They are fixtures.
 *
 * What IS real is the CONTRACT: the single test, the two lanes, the routing
 * after a decision, the ageing, the audit refusal, and the permission table.
 * Those are computed and they are what the screen is for.
 *
 * ## THE STUDIO DISPLAYS, IT DOES NOT DECIDE
 *
 * There is no approve control, no reject control, and no control of any kind
 * for row 2 — the row is `another-surface` and `./`'s rendering module builds
 * controls only from `STU_16_ACT_ROW_IDS`. The Lane-B decision is a
 * cross-slice seam (`MOD-CC-06` / `MOD-CC-13` action 3, slice 9) and renders
 * as one.
 *
 * **No proposal carries a hyperlink to the Client Command Center**, and that
 * is deliberate rather than an omission. `SB-STU-19` describes each proposal
 * as "linking to the Client Command Center where the decision is made"; that
 * surface is slice 9's and no route to it exists in this build. An anchor
 * pointing at a route that does not exist would assert a surface this build
 * does not have, which is the same false claim in the opposite direction. So
 * each proposal NAMES where its decision is made, in the source's own words,
 * beside the seam notice that says who owns it and when it lands. The task
 * report carries the divergence.
 *
 * ## SCOPE IS ENFORCED IN THE READ
 *
 * `learningViewIsOpen` is asked once. Where it refuses, no panel is built —
 * not built and hidden.
 */

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-16')

/** The card's own illustrative version, from the Bright Bikes example (L34324). */
const CURRENT_VERSION = 'v2.1.0'
const SEEDED_QUALIFICATION_REQUIREMENTS = [
  'Torque tool certification, current',
  'Line 2 induction, within 12 months',
]

/**
 * The row's own cells, verbatim, above whatever the row means for the reader.
 *
 * This is where row 4's architectural absence actually renders: the sentence
 * "there is no separate on/off switch" is written on that row's Quality
 * Manager cell and is a fact about the platform, so every reader of this
 * screen sees it rather than only the persona whose column carries it. The
 * affordance below it is the reader's own answer and is a different thing.
 */
function StatedRules({ statement }: { readonly statement: LearningStatement }) {
  return (
    <ul
      data-testid={`stated-rules-${statement.id}`}
      className="text-sm text-[var(--color-ink)]"
    >
      {statement.statedRules.map((rule) => (
        <li key={rule}>
          {statement.capability} — {rule}
        </li>
      ))}
    </ul>
  )
}

function AffordanceRendering({
  affordance,
  onAnotherSurface = false,
}: {
  readonly affordance: CapabilityAffordance
  readonly onAnotherSurface?: boolean
}) {
  if (affordance.kind === 'decision-open') {
    return (
      <ProhibitionNotice
        rendering={{
          kind: 'absent',
          note: `${affordance.note} This is an open client decision — ${affordance.openDecision} — and is not answered here.`,
        }}
      />
    )
  }
  if (affordance.kind === 'absent') {
    return <ProhibitionNotice rendering={{ kind: 'absent', note: affordance.note }} />
  }
  // `readOnly` and `unavailable`, and the permissive tokens on the three
  // rows held elsewhere. All four render as TEXT: this screen states the
  // cell, and a control for it would be on a surface this one is not.
  return (
    <p role="note" className="text-sm text-[var(--color-ink-muted)]">
      {affordance.kind === 'disabled' ? affordance.reason : affordance.note}
      {onAnotherSurface
        ? ' This capability is held on another surface, so this screen states it and offers no control for it.'
        : ''}
    </p>
  )
}

/** A row this screen STATES: its cells verbatim, then what it means for the reader. */
function StatementRendering({ statement }: { readonly statement: LearningStatement }) {
  return (
    <div className="space-y-1">
      <StatedRules statement={statement} />
      <AffordanceRendering
        affordance={statement.affordance}
        onAnotherSurface={statement.onAnotherSurface}
      />
    </div>
  )
}

export interface LearningViewProps {
  /**
   * Which seeded persona's view renders.
   *
   * A PERSONA, NOT A ROLE. The Studio's permission tables are headed by eight
   * persona columns, two of which are the same role split by a grant
   * (L34584: "authoring is a capability, not a sixth role"). A `role` prop
   * would have to collapse `supervisor-with-authoring-grant` and
   * `supervisor-without-grant` onto one value, and this card's rows 1 and 3
   * answer them differently.
   */
  readonly persona?: StudioPersonaId
}

export function LearningView({ persona: initialPersona = 'quality-manager' }: LearningViewProps) {
  const [persona, setPersona] = useState<StudioPersonaId>(initialPersona)
  const [register, setRegister] = useState<LibraryRegister>(SEEDED_LIBRARY_REGISTER)
  const [auditPath, setAuditPath] = useState<'commits' | 'write-fails'>('commits')
  const [log, setLog] = useState<readonly string[]>([])
  const [note, setNote] = useState<string | null>(null)

  const scenario = stu16Scenario({ persona })
  const identity = studioIdentityFor(persona)
  const actor: LibraryActor = {
    identityId: identity.identityId,
    displayName: persona,
    tenant: identity.tenant ?? SEEDED_TENANT,
  }

  /**
   * What Lane A did unattended, recomputed from the seeded ledger on this
   * load. Lazily initialised so the audit entries it writes are collected
   * once rather than on every render.
   */
  const [seed] = useState(() => {
    const entries: LearningAuditEntry[] = []
    const backlog = applyLaneABacklog({}, SEEDED_LANE_A_LEDGER, identity.identityId, (entry) => {
      entries.push(entry)
      return { ok: true }
    })
    return { ...backlog, entries }
  })
  const [weights, setWeights] = useState<SelectionWeights>(seed.weights)

  const writeLearningAudit = (entry: LearningAuditEntry) => {
    if (auditPath === 'write-fails') {
      return { ok: false as const, reason: 'the tenant audit log rejected the write' }
    }
    setLog((entries) => [...entries, `${entry.act} — ${entry.actorIdentityId} — ${entry.detail}`])
    return { ok: true as const }
  }

  const writeLibraryAudit = (entry: LibraryAuditEntry) => {
    if (auditPath === 'write-fails') {
      return { ok: false as const, reason: 'the tenant audit log rejected the write' }
    }
    setLog((entries) => [
      ...entries,
      `${entry.action} — ${entry.actorIdentityId} — ${entry.library}/${entry.itemId}`,
    ])
    return { ok: true as const }
  }

  const reverse = (refinement: LaneARefinement) => {
    setNote(null)
    const result = learningService.reverseRefinement(
      weights,
      refinement,
      identity.identityId,
      writeLearningAudit,
    )
    if (result.outcome === 'refused') setNote(result.reason)
    else {
      setWeights(result.weights)
      setNote(result.summary)
    }
  }

  const retire = (itemId: string) => {
    setNote(null)
    const result = learningService.retireAsset({
      register,
      itemId,
      actor,
      decision: stu16Decision('flag-or-retire-a-low-performing-coaching-asset', scenario),
      writeAudit: writeLibraryAudit,
    })
    setRegister(result.register)
    setNote(result.message)
  }

  const readAffordance = learningViewAffordance(scenario)
  const controls = learningControls(scenario)
  const reverseControl = controls.find((c) => c.id === 'reverse-a-lane-a-refinement')
  const retireControl = controls.find(
    (c) => c.id === 'flag-or-retire-a-low-performing-coaching-asset',
  )
  /**
   * **SCOPE IS APPLIED HERE AND NOWHERE ELSE.** Row 1 is asked once, and
   * where it refuses this is `null` — so there is nothing for the markup
   * below to draw, and the markup below asks no permission question of its
   * own. It null-checks the DATA, which is a consequence of the read rather
   * than a second test of the rule.
   *
   * The first cut of this file guarded twice — the read computed an empty
   * list AND the markup re-tested the same boolean — and the planted defect
   * proved the read-side guard was decorative: deleting it left the suite
   * green, because the markup's copy was still holding. That is Task 17's
   * defect shape exactly, and one guard in two places is how a build gets it.
   */
  const panels =
    learningViewIsOpen(scenario) === false
      ? null
      : {
          effectiveness: coachingEffectiveness(register, SEEDED_LANE_A_LEDGER),
          proposals: SEEDED_OPEN_PROPOSALS,
          cases: SEEDED_CASE_RELEVANCE,
          refinements: seed.refinements,
        }
  const architecture = memoryArchitectureRefusal()
  const anonymisation = anonymisationPolicy('standard-commercial')
  const memoryWrites = writeOnPublication(CURRENT_VERSION, SEEDED_QUALIFICATION_REQUIREMENTS)
  const packageFieldDisclosure = STU_14_LOCAL_DISCLOSURES.find(
    (d) => d.decisionRef === 'DEC-PKGFIELD-001',
  )

  return (
    <StudioShell module={MODULE} persona={persona} onPersonaChange={setPersona}>
      <section className="space-y-6">
        <header className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">
            What the platform has learned — {MODULE.name}
          </h2>
          <p data-testid="single-test" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            {SINGLE_TEST_STATEMENT}
          </p>
        </header>

        <Select
          label="Audit sink"
          value={auditPath}
          onChange={(v) => setAuditPath(v as 'commits' | 'write-fails')}
          options={[
            { value: 'commits', label: 'The audit entry commits' },
            { value: 'write-fails', label: 'The audit write fails (FB-STU-10)' },
          ]}
        />

        {panels === null ? <AffordanceRendering affordance={readAffordance} /> : null}

        {panels === null ? null : (
          <>
            {readAffordance.kind === 'disabled' ? (
              <Banner tone="info" heading="Read-only" body={readAffordance.reason} />
            ) : null}

            {/* PANEL 1 — coaching effectiveness, grouped by ASSET. */}
            <section aria-label="Coaching effectiveness" className="space-y-3">
              <h3 className="text-base font-semibold text-[var(--color-ink)]">
                Coaching effectiveness
              </h3>
              <p data-testid="lane-a-simulation" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                {LANE_A_SIMULATION_NOTE}
              </p>
              <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
                Grouped by asset. The Lane-A signal is that this asset, in this language, worked
                for this failure pattern on this screen (L34166) — asset, language, pattern,
                screen, and no worker. Nothing on this panel is measured against a person.
              </p>
              <Table
                caption={`Coaching assets: ${panels.effectiveness.length} in the corpus`}
                columns={[
                  { key: 'asset', header: 'Asset' },
                  { key: 'rate', header: 'Resolution rate' },
                  { key: 'sample', header: 'Sample size' },
                  { key: 'screens', header: 'Screens where used' },
                  { key: 'flag', header: 'Flag' },
                ]}
                emptyState={{
                  title: 'The coaching corpus holds no assets',
                  whatCreatesIt:
                    'Uploading and approving a coaching asset in the Content Libraries adds a row here.',
                }}
                rows={panels.effectiveness.map((row) => ({
                  asset: (
                    <span className="text-sm text-[var(--color-ink)]">
                      {row.assetName}
                      <span className="block text-xs text-[var(--color-ink-subtle)]">
                        {row.assetId} · {row.locale} · {row.assetState}
                      </span>
                    </span>
                  ),
                  rate:
                    row.resolutionRate === null
                      ? 'Not observed'
                      : `${Math.round(row.resolutionRate * 100)} per cent`,
                  sample: String(row.sampleSize),
                  screens:
                    row.screensWhereUsed.length === 0 ? '—' : row.screensWhereUsed.join(' · '),
                  flag: (
                    <div data-testid={`flag-${row.assetId}`} className="space-y-1">
                      {row.flagged ? (
                        <StatusPill tone="blocked" icon="⚠️" label="Flagged for review" />
                      ) : (
                        <StatusPill tone="ok" icon="—" label="No flag" />
                      )}
                      <span className="block text-xs text-[var(--color-ink-subtle)]">
                        {row.flagNote}
                      </span>
                      {row.flagged ? (
                        <>
                          <Link
                            href="/studio/content-libraries/"
                            className="inline-block text-xs underline text-[var(--color-ink)]"
                            data-testid={`review-${row.assetId}`}
                          >
                            Review it in the coaching corpus
                          </Link>
                          {retireControl === undefined ? null : retireControl.affordance.kind ===
                            'enabled' ? (
                            <Button onClick={() => retire(row.assetId)}>
                              {retireControl.affordance.label}
                            </Button>
                          ) : (
                            <AffordanceRendering affordance={retireControl.affordance} />
                          )}
                        </>
                      ) : null}
                    </div>
                  ),
                }))}
              />
              <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
                {LOW_PERFORMER_NOTE}
              </p>
            </section>

            {/* PANEL 2 — open Lane-B proposals. The Studio displays. */}
            <section aria-label="Proposed threshold changes" className="space-y-3">
              <h3 className="text-base font-semibold text-[var(--color-ink)]">
                Proposed threshold changes
              </h3>
              <p data-testid="lane-b-simulation" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                {LANE_B_SIMULATION_NOTE}
              </p>
              <p data-testid="studio-displays" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                The Studio displays, it does not decide. A proposal is never auto-approved: the
                decision is always human, made exactly once, and it is made in the Client Command
                Center — not here, and not by anyone on this screen.
              </p>
              <ul className="space-y-4">
                {panels.proposals.map((proposal) => (
                  <li
                    key={proposal.id}
                    data-testid={`proposal-${proposal.id}`}
                    className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4 text-sm"
                  >
                    <p className="font-medium text-[var(--color-ink)]">
                      {proposal.summary}
                      {/* The reference a person quotes when they open the
                          proposal on the surface that decides it. A card that
                          renders the id only as a test hook gives the reader
                          nothing to carry across the seam. */}
                      <span className="block text-xs text-[var(--color-ink-subtle)]">
                        {proposal.id}
                      </span>
                    </p>
                    <p className="mt-1 text-[var(--color-ink-muted)]">
                      {proposal.field}: {proposal.currentValue} → {proposal.proposedValue}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                      Scope of impact: {proposal.scopeOfImpact}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                      Evidence: {proposal.evidenceSummary}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                      Age: {proposal.ageInDays} days · {proposal.state}
                    </p>
                    {staleBadge(proposal) === null ? null : (
                      <StatusPill tone="attention" icon="⏳" label={staleBadge(proposal) ?? ''} />
                    )}
                    <p
                      data-testid={`decided-at-${proposal.id}`}
                      className="mt-2 text-xs text-[var(--color-ink-subtle)]"
                    >
                      Decided in the Client Command Center, where a Quality Manager accepts or
                      rejects it exactly once. That surface is slice 9’s and no route to it exists
                      in this build, so this line names it rather than pointing at a page that is
                      not there.
                    </p>
                  </li>
                ))}
              </ul>
              <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
                A proposal is {LANE_B_PROPOSAL_STATES.join(', ')} (L34212). Undecided proposals age
                visibly with a {STALE_FLAG_DAYS}-day stale flag and never expire silently.{' '}
                {LANE_A_HAS_NO_PROPOSAL_STATE}
              </p>
              <StudioSeamNotice seam={stuSeamById(STU_SEAMS, 'lane-b-decision')} />
            </section>

            {/* PANEL 3 — prior-case relevance. */}
            <section aria-label="Prior-case relevance" className="space-y-3">
              <h3 className="text-base font-semibold text-[var(--color-ink)]">
                Prior-case relevance
              </h3>
              <Table
                caption={`Prior cases the operation has given feedback on: ${panels.cases.length}`}
                columns={[
                  { key: 'case', header: 'Prior case' },
                  { key: 'feedback', header: 'Feedback the operation has given' },
                  { key: 'shift', header: 'How similarity has shifted' },
                ]}
                emptyState={{
                  title: 'No relevance feedback yet',
                  whatCreatesIt:
                    'A supervisor marking a surfaced prior case genuinely relevant, or not, adds a row here.',
                }}
                rows={panels.cases.map((row) => ({
                  case: (
                    <span className="text-sm text-[var(--color-ink)]">
                      {row.caseSummary}
                      <span className="block text-xs text-[var(--color-ink-subtle)]">
                        {row.caseId} · {row.operation}
                      </span>
                    </span>
                  ),
                  feedback: `${row.markedRelevant} relevant · ${row.markedNotRelevant} not relevant`,
                  shift: `${row.priorSimilarityWeight} → ${row.similarityWeight}`,
                }))}
              />
              <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
                The feedback is attributed to the operation, which is how the source states it
                (L34293). Which supervisor gave which piece of feedback is not what this panel is
                for and is not recorded on it.
              </p>
            </section>

            {/* Lane-A refinements, logged and reversible. */}
            <section aria-label="Lane-A refinements" className="space-y-3">
              <h3 className="text-base font-semibold text-[var(--color-ink)]">
                Lane-A refinements — applied automatically, logged, reversible
              </h3>
              <ul className="space-y-3">
                {panels.refinements.map((refinement) => (
                  <li
                    key={refinement.id}
                    data-testid={`refinement-${refinement.id}`}
                    className="text-sm text-[var(--color-ink-muted)]"
                  >
                    <p>{refinement.summary}</p>
                    <p className="text-xs text-[var(--color-ink-subtle)]">
                      Weight now: {weights[laneASignalKey(refinement.signal)] ?? refinement.weight}
                    </p>
                    {reverseControl === undefined ? null : reverseControl.affordance.kind ===
                      'enabled' ? (
                      <Button variant="secondary" onClick={() => reverse(refinement)}>
                        {reverseControl.affordance.label}
                      </Button>
                    ) : (
                      <AffordanceRendering affordance={reverseControl.affordance} />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {/* The five typed stores. Stated for every persona: it is the
            architecture, not a reading of what this tenant has learned. */}
        <section aria-label="The five typed memory stores" className="space-y-3">
          <h3 className="text-base font-semibold text-[var(--color-ink)]">
            The five typed memory stores
          </h3>
          <Table
            caption="The tenant’s manufacturing memory: five distinct, persistent stores, not one"
            columns={[
              { key: 'store', header: 'Store' },
              { key: 'holds', header: 'What it holds' },
              { key: 'studio', header: 'Written by the Studio' },
              { key: 'tenant', header: 'What a tenant may set' },
            ]}
            emptyState={{ title: 'No stores', whatCreatesIt: 'Unreachable — the five are fixed.' }}
            rows={MEMORY_STORES.map((store) => ({
              store: store.name,
              holds: store.holds,
              studio: store.writtenByStudio ? 'Yes' : 'No',
              tenant: store.tenantMaySet ?? '—',
            }))}
          />
          <p data-testid="memory-writes" className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
            {memoryWrites
              .map((write) => `${write.store}: ${write.what}. ${write.note}`)
              .join(' ')}
          </p>
          <ProhibitionNotice
            rendering={{ kind: 'absent', note: `${architecture.reason} ${architecture.example} is the source’s own example of it.` }}
          />
          <p data-testid="isolation" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            {TENANT_ISOLATION_STATEMENT}
          </p>
          <p data-testid="anonymisation" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            {anonymisation.statement}
          </p>
        </section>

        {/* What this screen states rather than offers — rows 4, 7 and 8. */}
        <section aria-label="What this screen does not offer" className="space-y-2">
          <h3 className="text-base font-semibold text-[var(--color-ink)]">
            What this screen does not offer
          </h3>
          {boundaryStatements(scenario).map((statement) => (
            <div key={statement.id} data-testid={`statement-${statement.id}`}>
              <StatementRendering statement={statement} />
            </div>
          ))}
        </section>

        {/* Held on another surface — rows 2, 5 and 6. */}
        <section aria-label="Held on another surface" className="space-y-2">
          <h3 className="text-base font-semibold text-[var(--color-ink)]">
            Held on another surface
          </h3>
          {otherSurfaceStatements(scenario).map((statement) => (
            <div key={statement.id} data-testid={`other-surface-${statement.id}`}>
              <StatementRendering statement={statement} />
            </div>
          ))}
        </section>

        {note === null ? null : <Banner tone="info" heading="Result" body={note} />}

        {log.length > 0 ? (
          <section aria-label="Audit entries written on this screen" className="space-y-1">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Audit</h3>
            <ul className="text-xs text-[var(--color-ink-muted)]">
              {log.map((line, index) => (
                <li key={`${line}-${index}`}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* D14 — DEC-LANEB-001, through the one disclosure component and the
            canon's own wording. A second disclosure of this decision is a
            defect: task 7 built it and both locator sets live there. */}
        <DecisionDisclosure id="D14" />
        {/* D18 — DEC-LANEBAUTH-001, who may decide a Lane-B proposal. Row 2's
            Supervisor-with-grant cell is Client Decision Required for exactly
            this reason. */}
        <DecisionDisclosure id="D18" />
        {/* D11 — the object naming scheme. This module's objects are the five
            typed stores, OBJ-STU-VERSION on a Lane-B patch, and OBJ-STU-ASSET
            on flagging and retirement (L34210). */}
        <DecisionDisclosure id="D11" />

        {packageFieldDisclosure === undefined ? null : (
          <section
            role="note"
            aria-label="Open decision DEC-PKGFIELD-001"
            data-testid="pkgfield-disclosure"
            className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
          >
            <p className="font-medium text-[var(--color-ink)]">
              Open decision — {packageFieldDisclosure.decisionRef}
            </p>
            <p className="mt-1 text-[var(--color-ink-muted)]">{packageFieldDisclosure.question}</p>
            <ul className="mt-2 space-y-2">
              {packageFieldDisclosure.readings.map((reading) => (
                <li key={reading.locator}>
                  <span className="text-[var(--color-ink)]">{reading.text}</span>{' '}
                  <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                    [{reading.locator}]
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[var(--color-ink)]">{packageFieldDisclosure.adopted}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              {packageFieldDisclosure.canonNote} It governs this module too: on approval, the
              package test routes a package-borne value to an auto-published patch and a
              server-only value to immediate application, and neither path can be chosen for a
              value whose assignment is unstated.
            </p>
          </section>
        )}

        {/* SB-STU-19's footer, verbatim. Not conditional on anything. */}
        <p data-testid="learning-footer" className="max-w-prose text-sm text-[var(--color-ink)]">
          {LEARNING_FOOTER}
        </p>
      </section>
    </StudioShell>
  )
}

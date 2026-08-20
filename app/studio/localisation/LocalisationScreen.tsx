'use client'

import { useState } from 'react'
import Link from 'next/link'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'
import { PUBLISH_CHECKS } from '@/studio/publish/checks'
import {
  createPublishCheckRegister,
  evaluatePublish,
  type PublishCheckRegister,
} from '@/studio/publish/register'
import { registerPublishChecks } from '@/studio/publish/register'
import type { Locale } from '@/studio/vocab'
import {
  OBJ_STU_LOCALE_GAP,
  PERMANENT_LINE,
  WHEEL_BOLT_LOCALISATION,
  coverageGrid,
  localeCompletenessCheck,
  type CompletenessCheckStatus,
  type CoverageCell,
  type LocalisationAuditEntry,
  type LocalisedWorkflow,
} from '@/studio/modules/stu-17/locales'
import {
  coverageReportAffordance,
  localisationControls,
  localisationService,
  stu17Scenario,
  type LocalisationControl,
} from '@/studio/modules/stu-17/rendering'
import { Banner, Button, Select, StatusPill, Table } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { StudioShell } from '../StudioShell'

/**
 * `SCR-STU-14` — Localisation coverage (`SB-STU-20`, L34447), with catalogue
 * A's `SCR-STU-LOCALE` folded in as the same screen under a second name (D1).
 *
 * THE SCREEN DECIDES NOTHING. Every affordance comes from
 * `localisationControls` and `coverageReportAffordance`, which are
 * `evaluateStudioAccess` over one matrix row; every write goes through
 * `localisationService`, which writes the audit entry before it mutates.
 * There is no role list in this file and no second copy of any rule.
 *
 * SCOPE IS ENFORCED IN THE READ. `coverageReportAffordance` is asked once,
 * and where it refuses no grid is built at all — the coverage report is not
 * drawn and then hidden.
 *
 * PUBLICATION CANNOT BE TALKED PAST, AND IT IS PER LOCALE. The publish
 * decision for each declared locale is `evaluatePublish` over task 5's own
 * register with check 6 registered for that locale. Ten of the eleven checks
 * have no implementation in this wave, and the register reports each of them
 * as `cannot-run` — which BLOCKS. That is the fail-closed rule visible on
 * screen rather than asserted in a comment: an unregistered check is the
 * strongest form of a check that cannot run.
 *
 * ROW 7 DRAWS NOTHING. The eighth row of the source's table (L34382) reads
 * `Not applicable` in all six of its columns, because that lifecycle sits
 * platform-side — so this screen carries no section, no control, no disabled
 * control and no statement for it. A panel here would invent a surface the
 * source does not describe. The row's own words are transcribed once, in
 * `src/studio/modules/stu-17/matrix.ts`, and `tests/unit/stu-localisation.
 * test.ts` scans every file under `app/` to prove none of them reaches a
 * screen — comments included, because a comment is the easiest way for the
 * phrase to creep back toward a rendering.
 */

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-17')

const RENDERING_TONE = {
  Complete: 'ok',
  'Drafted awaiting review': 'attention',
  Missing: 'blocked',
} as const

const RENDERING_ICON = {
  Complete: '✅',
  'Drafted awaiting review': '✍️',
  Missing: '⛔',
} as const

function ControlRendering({ control }: { readonly control: LocalisationControl }) {
  const { affordance } = control
  if (affordance.kind === 'absent') {
    return <ProhibitionNotice rendering={{ kind: 'absent', note: affordance.note }} />
  }
  if (affordance.kind === 'disabled') {
    return (
      <Button variant="secondary" disabledReason={affordance.reason}>
        {affordance.label}
      </Button>
    )
  }
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
  return null
}

/** One Missing or awaiting cell's link to the editor for that element in that locale. */
function EditorLinkCell({ cell }: { readonly cell: CoverageCell }) {
  const link = cell.editorLink
  if (link === null) return null
  if (link.href === null) {
    return <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{link.unavailableNote}</p>
  }
  return (
    <Link
      href={link.href}
      className="mt-1 inline-block text-xs underline text-[var(--color-ink)]"
      data-testid={`editor-link-${cell.elementId}-${cell.locale}`}
    >
      {link.label}
    </Link>
  )
}

export function LocalisationScreen() {
  const [persona, setPersona] = useState<StudioPersonaId>('quality-manager')
  const [workflow, setWorkflow] = useState<LocalisedWorkflow>(WHEEL_BOLT_LOCALISATION)
  const [checkStatus, setCheckStatus] = useState<CompletenessCheckStatus>('runnable')
  const [auditPath, setAuditPath] = useState<'commits' | 'write-fails'>('commits')
  const [log, setLog] = useState<readonly LocalisationAuditEntry[]>([])
  const [note, setNote] = useState<string | null>(null)

  const scenario = stu17Scenario({ persona })
  const report = coverageReportAffordance(scenario)
  const controls = localisationControls(scenario)
  const grid = coverageGrid(workflow)

  const writeAudit = (entry: LocalisationAuditEntry): 'committed' | 'failed' => {
    if (auditPath === 'write-fails') return 'failed'
    setLog((entries) => [...entries, entry])
    return 'committed'
  }

  /**
   * The publish decision for ONE locale, through task 5's register. Built per
   * render from a fresh register, never from a module-load snapshot.
   */
  const publishFor = (locale: Locale) => {
    const empty: PublishCheckRegister<LocalisedWorkflow> =
      createPublishCheckRegister<LocalisedWorkflow>()
    const registered = registerPublishChecks(
      empty,
      localeCompletenessCheck(locale, { checkStatus }),
    )
    if (!registered.ok) return null
    return evaluatePublish(registered.register, workflow)
  }

  const act = (control: LocalisationControl) => {
    if (control.serviceKey === null) return
    setNote(null)
    if (control.serviceKey === 'declareLocaleCoverage') {
      const result = localisationService.declareLocaleCoverage(
        workflow,
        workflow.declaredLocales,
        'IDN-BB-ELENA',
        writeAudit,
      )
      if (result.outcome === 'refused') setNote(result.reason)
      else setWorkflow(result.workflow)
      return
    }
    // Both remaining acts operate on the element the source's own example
    // names, so the demonstration is the card's own scenario rather than an
    // invented one.
    const elementId = 'screen-7-section-6-coaching-default'
    const result =
      control.serviceKey === 'requestDrafting'
        ? localisationService.requestDrafting(
            workflow,
            elementId,
            'Spanish',
            'IDN-BB-ELENA',
            writeAudit,
          )
        : localisationService.authorLocaleVariant(
            workflow,
            elementId,
            'Spanish',
            'Complete',
            'IDN-BB-ELENA',
            writeAudit,
          )
    if (result.outcome === 'refused') setNote(result.reason)
    else setWorkflow(result.workflow)
  }

  return (
    <StudioShell module={MODULE} persona={persona} onPersonaChange={setPersona}>
      <section className="space-y-6">
        <header className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">
            Localisation coverage — {workflow.workflowName}
          </h2>
          {/* The permanent line. Not conditional on anything (L34447). */}
          <p data-testid="permanent-line" className="text-sm text-[var(--color-ink-muted)]">
            {PERMANENT_LINE}
          </p>
        </header>

        {/* Reviewer controls — the two states the card names, made reachable. */}
        <div className="flex flex-wrap gap-4">
          <Select
            label="Completeness check"
            value={checkStatus}
            onChange={(v) => setCheckStatus(v as CompletenessCheckStatus)}
            options={[
              { value: 'runnable', label: 'The check runs' },
              { value: 'unrunnable', label: 'The check cannot run (TEST-STU-147)' },
            ]}
          />
          <Select
            label="Audit sink"
            value={auditPath}
            onChange={(v) => setAuditPath(v as 'commits' | 'write-fails')}
            options={[
              { value: 'commits', label: 'The audit entry commits' },
              { value: 'write-fails', label: 'The audit write fails (FB-STU-10)' },
            ]}
          />
        </div>

        {report.kind !== 'enabled' && report.kind !== 'disabled' ? (
          <ControlRendering
            control={{
              id: 'view-the-coverage-report',
              label: 'View the coverage report',
              affordance: report,
              serviceKey: null,
              sourceRefs: ['L34383'],
            }}
          />
        ) : (
          <>
            {report.kind === 'disabled' ? (
              <Banner tone="info" heading="Read-only" body={report.reason} />
            ) : null}

            {/* SB-STU-20 — one row per worker-facing element, one column per
                declared locale. */}
            <Table
              caption={`Locale coverage: ${grid.elements.length} worker-facing elements by ${grid.locales.length} declared locales`}
              columns={[
                { key: 'element', header: 'Worker-facing element' },
                ...grid.locales.map((locale) => ({ key: locale, header: locale })),
              ]}
              emptyState={{
                title: 'This Workflow has no worker-facing content yet',
                whatCreatesIt:
                  'Authoring a screen, a note, a shared block, a deviation form, a coaching asset or Training Library content adds a row here, in every locale the Workflow declares.',
              }}
              rows={grid.elements.map((element) => ({
                element: (
                  <span className="text-sm text-[var(--color-ink)]">
                    {element.name}
                    <span className="block text-xs text-[var(--color-ink-subtle)]">
                      {element.kind}
                    </span>
                  </span>
                ),
                ...Object.fromEntries(
                  grid.locales.map((locale) => {
                    const cell = grid.cells.find(
                      (c) => c.elementId === element.id && c.locale === locale,
                    )
                    if (cell === undefined) {
                      throw new Error(
                        `LocalisationScreen: no cell for ${element.id} in ${locale}. A missing ` +
                          'cell and a Complete cell must never read the same.',
                      )
                    }
                    return [
                      locale,
                      <div key={`${element.id}-${locale}`} data-testid={`cell-${element.id}-${locale}`}>
                        <StatusPill
                          tone={RENDERING_TONE[cell.rendering]}
                          icon={RENDERING_ICON[cell.rendering]}
                          label={cell.note}
                        />
                        <EditorLinkCell cell={cell} />
                      </div>,
                    ]
                  }),
                ),
              }))}
            />

            {/* The per-locale summary line, and the publication decision the
                register actually returns for that locale. */}
            <ul className="space-y-3">
              {grid.summaries.map((summary) => {
                const evaluation = publishFor(summary.locale)
                return (
                  <li key={summary.locale} data-testid={`summary-${summary.locale}`}>
                    <StatusPill
                      tone={summary.state === 'Complete and publishable' ? 'ok' : 'blocked'}
                      icon={summary.state === 'Complete and publishable' ? '✅' : '⛔'}
                      label={`${summary.locale}: ${summary.line}`}
                    />
                    {evaluation === null ? null : (
                      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                        {evaluation.blocked
                          ? `Publication in ${summary.locale} is blocked by ${evaluation.blockers.length} of the ${PUBLISH_CHECKS.length} publish-time checks: ${evaluation.blockers
                              .map((b) => b.blockingElement)
                              .join(' · ')}`
                          : `Every publish-time check passes for ${summary.locale}.`}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}

        {/* The controls. The same list for every persona; three of the six
            are refusals nobody holds, and each states its rule where a
            control would be. */}
        <ul className="space-y-3">
          {controls.map((control) => (
            <li key={control.id} data-testid={`control-${control.id}`}>
              {control.affordance.kind === 'enabled' ? (
                <>
                  <Button onClick={() => act(control)}>{control.affordance.label}</Button>
                  <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                    {control.affordance.note}
                  </p>
                </>
              ) : (
                <ControlRendering control={control} />
              )}
            </li>
          ))}
        </ul>

        {note === null ? null : <Banner tone="blocked" heading="Refused" body={note} />}

        {log.length > 0 ? (
          <section aria-label="Audit entries written on this screen" className="space-y-1">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Audit</h3>
            <ul className="text-xs text-[var(--color-ink-muted)]">
              {log.map((entry, index) => (
                <li key={`${entry.act}-${index}`}>
                  {entry.act} — {entry.identityId} — {entry.detail}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* D29 — the Derived Clarification at L34361, both readings, through
            the one disclosure component. The wording lives in the canon, so
            this screen carries no second copy of it. */}
        <DecisionDisclosure id="D29" />

        {/* D11 — the object naming scheme, through the one disclosure
            component. `OBJ-STU-LOCALE` is one of its three registered gaps. */}
        <DecisionDisclosure id="D11" />
        <p data-testid="obj-gap" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          {OBJ_STU_LOCALE_GAP.screenNote}
        </p>
      </section>
    </StudioShell>
  )
}

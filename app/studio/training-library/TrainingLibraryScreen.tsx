'use client'

import { useState } from 'react'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { STU_SEAMS, stuSeamById } from '@/studio/seams'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { STU_08_CROSS_SURFACE } from '@/studio/modules/stu-08/matrix'
import {
  SEEDED_TRAINING_REGISTER,
  STORAGE_ENTITLEMENT_GAP,
  TRAINING_BANNER,
  TRAINING_ITEM_OBJECT,
  TRAINING_PACKAGE_EXCLUSION,
  TRAINING_RELEASE_AUTHORITY,
  trainingService,
  type TrainingAuditEntry,
  type TrainingRegister,
} from '@/studio/modules/stu-08/training'
import {
  itemsReadableBy,
  stu08Scenario,
  trainingControls,
  uploadStatement,
  type TrainingControl,
} from '@/studio/modules/stu-08/rendering'
import { studioIdentityFor } from '@/studio/modules/stu-18/rendering'
import { Banner, Button, Select, StatusPill, Table } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import { StudioShell } from '../StudioShell'

/**
 * `SCR-STU-09` — Training Library management (`SB-STU-11`, L32887), with
 * catalogue A's `SCR-STU-TRAINING` folded in as the same screen under a
 * second name (D1).
 *
 * THE SCREEN DECIDES NOTHING. Every affordance comes from
 * `trainingControls`, which is `evaluateStudioAccess` over one matrix row;
 * every write goes through `trainingService`, whose one mutator writes the
 * audit entry before it mutates and refuses the act outright where the write
 * fails. There is no role list in this file and no second copy of any rule.
 *
 * SCOPE IS ENFORCED IN THE READ. `itemsReadableBy` is asked once, and the
 * list is built from what it returns — never loaded and then filtered in the
 * markup.
 *
 * ROWS 7 AND 8 DRAW NO CONTROL. Both are Frontline consequences of a Studio
 * configuration rather than Studio capabilities (L31515), so each renders one
 * statement and nothing clickable. A disabled "View on the device" control
 * would promise a Studio user a capability the source places on another
 * surface entirely.
 *
 * THE CAPABILITY L32800 CUTS FROM SCOPE DRAWS NOTHING HERE. L32802 binds this
 * build: nothing designs, proposes or implies it — not as a control, not as a
 * disabled control, and not as a sentence. Its name is not written down in
 * this tree at all; `tests/unit/stu-training.test.ts` holds the pattern.
 */

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-08')
const FRONTLINE_SEAM = stuSeamById(STU_SEAMS, 'frontline-training-library-viewer')

const STATUS_TONE = {
  Draft: 'neutral',
  'In Review': 'attention',
  Published: 'ok',
  Archived: 'neutral',
} as const

function ControlRendering({ control }: { readonly control: TrainingControl }) {
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

export function TrainingLibraryScreen() {
  const [persona, setPersona] = useState<StudioPersonaId>('quality-manager')
  const [register, setRegister] = useState<TrainingRegister>(SEEDED_TRAINING_REGISTER)
  const [auditPath, setAuditPath] = useState<'commits' | 'write-fails'>('commits')
  const [releaseActor, setReleaseActor] = useState<'this-persona' | 'tenant-default'>(
    'tenant-default',
  )
  const [log, setLog] = useState<readonly TrainingAuditEntry[]>([])
  const [note, setNote] = useState<string | null>(null)

  const scenario = stu08Scenario({ persona })
  const controls = trainingControls(scenario)
  const readable = itemsReadableBy(scenario, register)

  const writeAudit = (entry: TrainingAuditEntry): 'committed' | 'failed' => {
    if (auditPath === 'write-fails') return 'failed'
    setLog((entries) => [...entries, entry])
    return 'committed'
  }

  const act = (control: TrainingControl) => {
    if (control.serviceKey === null) return
    setNote(null)
    const own = studioIdentityFor(persona).identityId
    const itemId = readable.items[0]?.id ?? register.items[0]?.id ?? ''
    const result =
      control.serviceKey === 'upload'
        ? trainingService.upload(register, 'Paint bay orientation', 120, own, writeAudit)
        : control.serviceKey === 'release'
          ? trainingService.release(
              register,
              itemId,
              releaseActor === 'tenant-default' ? TRAINING_RELEASE_AUTHORITY.identityId : own,
              writeAudit,
            )
          : trainingService[control.serviceKey](register, itemId, own, writeAudit)
    if (result.outcome === 'refused') setNote(result.reason)
    else setRegister(result.register)
  }

  return (
    <StudioShell module={MODULE} persona={persona} onPersonaChange={setPersona} screenId="SCR-STU-09">
      <section className="space-y-6">
        {/* SB-STU-11's prominent banner, verbatim and unconditional. It states
            the three things this module deliberately does not do. */}
        <Banner tone="attention" heading="Online-only delivery" body={TRAINING_BANNER} />

        <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          Viewing training content is not execution: it generates no run telemetry and no
          production record. Qualifications and certifications remain Delivery Operations Hub
          master data, and nothing watched here changes one (L32799, AC-STU-081).
        </p>

        {/* Reviewer controls — the two conditions the card names, made reachable. */}
        <div className="flex flex-wrap gap-4">
          <Select
            label="Audit sink"
            value={auditPath}
            onChange={(v) => setAuditPath(v as 'commits' | 'write-fails')}
            options={[
              { value: 'commits', label: 'The audit entry commits' },
              { value: 'write-fails', label: 'The audit write fails (L32912)' },
            ]}
          />
          <Select
            label="Who releases"
            value={releaseActor}
            onChange={(v) => setReleaseActor(v as 'this-persona' | 'tenant-default')}
            options={[
              {
                value: 'tenant-default',
                label: 'The tenant-default Release Authority, a distinct person',
              },
              { value: 'this-persona', label: 'This persona — their own submission (TEST-STU-087)' },
            ]}
          />
        </div>

        {/* The list SB-STU-11 asks for. Built from what the read returned. */}
        <Table
          caption={`Training Library — ${readable.items.length} item${readable.items.length === 1 ? '' : 's'} readable from this view`}
          columns={[
            { key: 'title', header: 'Title' },
            { key: 'locales', header: 'Language coverage' },
            { key: 'version', header: 'Version' },
            { key: 'status', header: 'Status' },
            { key: 'published', header: 'Last published' },
          ]}
          emptyState={{
            title: 'No training item is readable from this view',
            whatCreatesIt:
              'An authoring-grant holder uploads or authors a training item per language, and it becomes readable here once it is published.',
          }}
          rows={readable.items.map((item) => ({
            title: (
              <span className="text-sm text-[var(--color-ink)]">
                {item.title}
                <span className="block text-xs text-[var(--color-ink-subtle)]">
                  {item.id} · {TRAINING_ITEM_OBJECT.mnemonic} ({TRAINING_ITEM_OBJECT.numericId})
                </span>
              </span>
            ),
            locales: (
              <span className="text-sm text-[var(--color-ink)]">
                {item.authoredLocales.join(' and ')}
              </span>
            ),
            version: (
              <span className="text-sm text-[var(--color-ink)]">{item.version ?? 'None yet'}</span>
            ),
            status: <StatusPill tone={STATUS_TONE[item.status]} icon="●" label={item.status} />,
            published: (
              <span className="text-sm text-[var(--color-ink)]">
                {item.lastPublishedAt ?? 'Never published'}
              </span>
            ),
          }))}
        />

        {readable.withheldReason === null ? null : (
          <Banner tone="info" heading="What this view does not read" body={readable.withheldReason} />
        )}

        {/* "Each item shows its approval log" (L32887). */}
        <section aria-label="Approval log per item" className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Approval log</h3>
          {readable.items.map((item) => (
            <div key={item.id} data-testid={`approval-log-${item.id}`}>
              <p className="text-sm text-[var(--color-ink)]">{item.title}</p>
              {item.approvalLog.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-subtle)]">
                  Nothing yet — this item has not entered the approval chain.
                </p>
              ) : (
                <ul className="text-xs text-[var(--color-ink-muted)]">
                  {item.approvalLog.map((entry, index) => (
                    <li key={`${entry.transition}-${index}`}>
                      {entry.transition} — {entry.actor} — {entry.at}
                      {entry.version === null ? '' : ` — version ${entry.version}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>

        {/* The upload control states the entitlement and remaining storage. */}
        <section aria-label="Upload" className="space-y-2">
          <p data-testid="entitlement" className="max-w-prose text-sm text-[var(--color-ink)]">
            {uploadStatement(register)}
          </p>
          <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
            {STORAGE_ENTITLEMENT_GAP.screenNote}
          </p>
        </section>

        {/* The controls. The same list for every persona; each states its rule
            where a control would be. */}
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

        {/* Rows 7 and 8 — statements, never controls. */}
        <section aria-label="What a Worker meets on the device" className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            On the device — the Frontline consequence, not a Studio control
          </h3>
          {STU_08_CROSS_SURFACE.map((row) => (
            <div key={row.id} data-testid={`cross-surface-${row.id}`} role="note">
              <p className="text-sm font-medium text-[var(--color-ink)]">{row.capability}</p>
              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">{row.statement}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">
                Source: {row.sourceRefs.join(' · ')}
              </p>
            </div>
          ))}
        </section>

        <StudioSeamNotice seam={FRONTLINE_SEAM} />

        <p data-testid="package-exclusion" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          <span className="font-medium text-[var(--color-ink)]">
            {TRAINING_PACKAGE_EXCLUSION.acceptanceCriterion}:{' '}
          </span>
          {TRAINING_PACKAGE_EXCLUSION.statement}
        </p>

        {/* DEC-AUDSTU-001 — DEC-AUDSTU-001, which governs row 6's Read-only Auditor cell,
            and D11, the object-identifier scheme this module's OBJ-044 /
            OBJ-STU-TRAINING pairing reads. Both through the ONE disclosure
            component: a module writing its own disclosure prose is how two
            screens come to disclose one decision differently. */}
        <DecisionDisclosure id="DEC-AUDSTU-001" />
        <DecisionDisclosure id="D11" />

        {log.length > 0 ? (
          <section aria-label="Audit entries written on this screen" className="space-y-1">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Audit</h3>
            <ul className="text-xs text-[var(--color-ink-muted)]">
              {log.map((entry, index) => (
                <li key={`${entry.act}-${index}`}>
                  {entry.act} — {entry.identityId} — {entry.outcome} — {entry.detail}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </StudioShell>
  )
}

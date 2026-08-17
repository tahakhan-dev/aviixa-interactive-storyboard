'use client'

import { useState, type ReactNode } from 'react'
import type { RoleId } from '@/domain/roles'
import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import { evaluateAccess, type AccessContext } from '@/policy/evaluate'
import type { PermissionDecision } from '@/policy/decision'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { ACCESS_CLASSES } from '@/surfaces/sa/access-classes'
import { SCREEN_STATES, type ScreenStateId } from '@/ui/screen-state'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { CommandStateBadge } from '@/ui/sa/CommandStateBadge'
import {
  Banner,
  Button,
  FreshnessLabel,
  PermissionNotice,
  Select,
  SkeletonBlock,
  StatusPill,
  Table,
  Tabs,
} from '@/ui/primitives'
import { SaConsoleShell } from '../SaConsoleShell'
import {
  CHANGE_CLASS_LABEL,
  CROSS_CUTTING_SECTIONS,
  EXTENSION_FEATURE_CONTROL,
  EXTENSION_LABEL,
  EXTENSION_SCHEDULED_WORK,
  FLOOR_REGISTER_ROWS,
  GOVERNED_SETTINGS_COUNT,
  LOCALE_PACKS,
  LOCALE_PACK_STATES,
  PAUSE_STATES,
  PER_TENANT_OVERRIDE_NOTE,
  POSTURE_AS_OF,
  POSTURE_ORIGIN,
  POSTURE_STALE_AS_OF,
  SA07_ABSENT_CONTROLS,
  SA07_PLATFORM_ROLES,
  SA07_SOURCE_CONFLICTS,
  SA07_UNSPECIFIED_IN_SOURCE,
  SA07_WORKFLOWS,
  SEEDED_TAXONOMY_STATES,
  SETTINGS_CATEGORIES,
  SETTINGS_POSTURE,
  SETTING_STATES,
  SEVERITY_CATALOG_DISTRIBUTION,
  type SettingsCategoryId,
} from './fixtures'

const MODULE = saModuleById('MOD-SA-07')

/** The twelve applicable states: all thirteen less the frontline-only STATE-07. */
const APPLICABLE_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

/** No backend, no clock — the policy layer is handed an empty seeded state. */
const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-07-PLATFORM-SETTINGS'))

/**
 * What the settings surface itself is doing, which is a separate axis from
 * who is looking. Driven through `evaluateAccess`'s object-state stage
 * rather than a hand-rolled `if`, so a state refusal is a typed decision
 * like any other.
 *
 * `STATE-11` is deliberately absent from this function. With every model
 * unavailable the module stays fully operable and the emergency pause stays
 * exercisable (`AC-SA-000-09`, L42887) — that is the whole point of the
 * criterion, and gating settings on model availability would break it.
 */
type SettingsAvailability = 'available' | 'read-only' | 'unavailable'

function settingsAvailability(state: ScreenStateId): SettingsAvailability {
  if (state === 'STATE-06') return 'read-only'
  if (state === 'STATE-12') return 'unavailable'
  return 'available'
}

type PostureMode = 'current' | 'stale' | 'unavailable' | 'loading'

function postureMode(state: ScreenStateId): PostureMode {
  if (state === 'STATE-02') return 'loading'
  if (state === 'STATE-08') return 'stale'
  if (state === 'STATE-12') return 'unavailable'
  return 'current'
}

/** The named reason a drawn-but-inert control carries. Never a bare "denied". */
function namedReason(
  decision: PermissionDecision,
  role: RoleId,
  fallback: string,
  availability: SettingsAvailability,
): string {
  if (decision.outcome === 'allowed') return ''
  if (decision.reasonCode === 'ROLE_NOT_GRANTED') return fallback
  if (availability === 'unavailable') {
    return 'The settings change ledger cannot be read in this state, so nothing may be submitted from it.'
  }
  if (availability === 'read-only') {
    return 'This screen is read-only in this state. One banner names the cause; nothing else is scattered.'
  }
  if (decision.reasonCode === 'DECISION_OPEN') return fallback
  // Never `decision.explanation` as a last resort. The shared REASON_CODES
  // copy is written for every surface, so this screen states its own reason
  // in its own words and stays inside SURF-SA's banned-word rule (D10)
  // whatever the spine says. The outcome still comes from `evaluateAccess`;
  // only the wording is this screen's.
  return fallback
}

function Section({
  id,
  heading,
  children,
}: {
  readonly id: string
  readonly heading: string
  readonly children: ReactNode
}) {
  return (
    <section aria-labelledby={`${id}-h`} id={id} className="mt-10">
      <h2 id={`${id}-h`} className="text-lg font-semibold">
        {heading}
      </h2>
      {children}
    </section>
  )
}

function crossCutting(id: string): string {
  const found = CROSS_CUTTING_SECTIONS.find((s) => s.id === id)
  if (found === undefined) throw new Error(`Unknown cross-cutting section: ${id}`)
  return `${found.name} · ${found.sectionAnnotation} · ${found.screenAnnotation}`
}

function crossCuttingName(id: string): string {
  const found = CROSS_CUTTING_SECTIONS.find((s) => s.id === id)
  if (found === undefined) throw new Error(`Unknown cross-cutting section: ${id}`)
  return found.name
}

export interface PlatformSettingsScreenProps {
  /** View-switcher seed, not a login (spec §8). */
  readonly role?: RoleId
  readonly screenState?: ScreenStateId
  readonly category?: SettingsCategoryId
}

export function PlatformSettingsScreen({
  role: initialRole = 'ADMIN',
  screenState: initialScreenState = 'STATE-03',
  category: initialCategory = 'model-and-inference',
}: PlatformSettingsScreenProps = {}) {
  const [role, setRole] = useState<RoleId>(initialRole)
  const [screenState, setScreenState] = useState<ScreenStateId>(initialScreenState)
  const [category, setCategory] = useState<SettingsCategoryId>(initialCategory)
  const [pauseProposal, setPauseProposal] = useState<string | null>(null)

  const availability = settingsAvailability(screenState)
  const posture = postureMode(screenState)
  const stateDefinition = SCREEN_STATES.find((s) => s.id === screenState) ?? SCREEN_STATES[0]
  const activeCategory =
    SETTINGS_CATEGORIES.find((c) => c.id === category) ?? SETTINGS_CATEGORIES[0]

  const context: AccessContext = {
    state: FIXTURE_STATE,
    identity: {
      signedIn: true,
      role,
      tenant: null,
      siteScope: [],
      areaScope: [],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'FIXTURE-CONSOLE-OPERATOR',
  }

  /* ---------------------------------------------------------------- *
   * Per-control allowed roles. D16: the module-level `roles_allowed` is
   * authoritative nowhere, so every one of these names its own list and
   * its own source line.
   * ---------------------------------------------------------------- */

  // D8. The pause is critical class and the decision is open, so the
  // request carries `openDecision` — a `clientDecisionRequired` outcome is
  // a typed decision, never a thrown error and never a silent allow.
  const proposePauseDecision = evaluateAccess(
    {
      action: 'MOD-SA-07:propose-emergency-pause',
      allowedRoles: ['ADMIN'],
      allowedObjectStates: ['available'],
      objectState: availability,
      sourceRefs: ['L54979', 'L21588', 'DEC-PAUSE-001', 'D8'],
    },
    context,
  )
  const engineerPauseDecision = evaluateAccess(
    {
      action: 'MOD-SA-07:propose-emergency-pause-engineer',
      allowedRoles: ['PLATFORM_ENGINEER'],
      openDecision: 'DEC-PAUSE-001',
      sourceRefs: ['L65401', 'L20740', 'DEC-PAUSE-001', 'D8'],
    },
    context,
  )
  const approvePauseDecision = evaluateAccess(
    {
      action: 'MOD-SA-07:approve-emergency-pause',
      allowedRoles: ['ROOT_SUPER_ADMIN'],
      allowedObjectStates: ['available'],
      objectState: availability,
      sourceRefs: ['AC-SA-07-14-01 L44604', 'L54979', 'L55942'],
    },
    context,
  )
  const proposeResumeDecision = evaluateAccess(
    {
      action: 'MOD-SA-07:propose-resume',
      allowedRoles: ['ROOT_SUPER_ADMIN'],
      allowedObjectStates: ['available'],
      objectState: availability,
      sourceRefs: ['L21588', 'AC-SA-07-14-01 L44604'],
    },
    context,
  )
  const approveCatalogDecision = evaluateAccess(
    {
      action: 'MOD-SA-07:approve-severity-catalog-change',
      allowedRoles: ['ROOT_SUPER_ADMIN'],
      allowedObjectStates: ['available'],
      objectState: availability,
      sourceRefs: ['L42801', 'AC-SA-07-11-02 L44490'],
    },
    context,
  )
  const approveBoundDecision = evaluateAccess(
    {
      action: 'MOD-SA-07:approve-floor-register-bound-change',
      allowedRoles: ['ROOT_SUPER_ADMIN'],
      allowedObjectStates: ['available'],
      objectState: availability,
      sourceRefs: ['L42802', 'AC-SA-07-13-04 L44568'],
    },
    context,
  )
  const taxonomyDecision = evaluateAccess(
    {
      action: 'MOD-SA-07:deprecate-or-restore-seeded-taxonomy',
      allowedRoles: ['ADMIN', 'ROOT_SUPER_ADMIN'],
      allowedObjectStates: ['available'],
      objectState: availability,
      sourceRefs: ['L54850', 'WF-TAX-001 L54845'],
    },
    context,
  )
  const integrationRequestDecision = evaluateAccess(
    {
      action: 'MOD-SA-07:request-a-new-integration',
      allowedRoles: ['PLATFORM_ENGINEER'],
      allowedObjectStates: ['available'],
      objectState: availability,
      sourceRefs: ['L95577'],
    },
    context,
  )
  const complianceCategoryDecision = evaluateAccess(
    {
      action: 'MOD-SA-07:change-compliance-category-posture',
      allowedRoles: ['ADMIN', 'ROOT_SUPER_ADMIN'],
      deniedRoles: ['PLATFORM_ENGINEER'],
      sourceRefs: ['L42714', 'AC-SA-07-09-01 L44392'],
    },
    context,
  )

  /**
   * §3 applied from the DECISION, never from a role comparison. A refusal
   * at the BASE_ROLE stage is a critical-class action seen by a role that
   * does not hold it, so the whole action bar is replaced by the class
   * badge — no drawn control could be mistaken for an approval path. A
   * refusal at any later stage (here, object state: STATE-06 read-only and
   * STATE-12 failure) leaves the control drawn and inert with its cause
   * named, because the root DOES hold it, just not in this screen state.
   * An allow draws the live control.
   *
   * Driving both the enable choice and the rendering choice off
   * `evaluateAccess` is the point: a raw `role === 'ROOT_SUPER_ADMIN'`
   * cannot see screen state, so it drew a live approval button on a screen
   * whose own copy said nothing may be submitted from it.
   */
  const criticalAction = (
    decision: PermissionDecision,
    label: string,
    roleFallback: string,
    onClick?: () => void,
  ): ReactNode => {
    if (decision.outcome === 'allowed') {
      return <Button {...(onClick ? { onClick } : {})}>{label}</Button>
    }
    if (decision.stage === 'BASE_ROLE') {
      return <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
    }
    return (
      <ProhibitionNotice
        rendering={{
          kind: 'disabled-with-reason',
          label,
          reason: namedReason(decision, role, roleFallback, availability),
        }}
      />
    )
  }

  // The Platform Engineer is the only role whose pause control is drawn and
  // inert with DEC-PAUSE-001's reason; every other non-Admin gets the
  // ordinary role reason. Both are DISABLED WITH A NAMED REASON — the
  // control exists on this platform, just not for this role. The choice
  // between them is a fallback string only: whether the control acts at all
  // comes from `proposePauseDecision`, which now also carries the screen's
  // object state so a read-only or failed screen refuses it.
  const proposeReason = namedReason(
    proposePauseDecision,
    role,
    role === 'PLATFORM_ENGINEER'
      ? 'proposal only — pending DEC-PAUSE-001. Four incompatible readings of who may pause sit in the source; until the client settles it, a Platform Engineer proposal is not accepted here.'
      : role === 'SUPPORT'
        ? 'Support holds no configuration change on this console and cannot propose a pause (L42715).'
        : 'The root approves the pause rather than proposing it, so that a proposal and its approval are never the same act (D8).',
    availability,
  )
  const proposeProps =
    proposePauseDecision.outcome === 'allowed' ? {} : { disabledReason: proposeReason }

  const postureRows = SETTINGS_POSTURE.filter((p) => p.count > 0)

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screens annotated SCR-SA-08 ten categories (L42800), SCR-SA-09 severity catalog editor
        (L42801), SCR-SA-10 platform floor register (L42802), SCR-SA-11 emergency pause control
        (L42803), and SB-SA-07 (L44041). Names are canonical; the numbers are annotations only, and
        this route is keyed on the module slug.
      </p>

      <div className="mt-6 flex flex-wrap gap-6 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
        <Select
          label="Console role (fixture)"
          value={role}
          onChange={(v) => setRole(v as RoleId)}
          options={SA07_PLATFORM_ROLES.map((r) => ({
            value: r.id,
            label: `${r.name} — ${r.roleAnnotation}`,
          }))}
        />
        <Select
          label="Screen state (fixture)"
          value={screenState}
          onChange={(v) => setScreenState(v as ScreenStateId)}
          options={APPLICABLE_STATES.map((s) => ({ value: s.id, label: `${s.id} — ${s.name}` }))}
        />
        <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The role control is a view switcher, not a login. Nothing here authenticates anybody, and
          no state below is computed — each is a seeded fixture.
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius-surface)] bg-[var(--color-surface-sunken)] p-4 text-sm">
        <p className="font-medium">
          {stateDefinition.id} — {stateDefinition.name}
        </p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.contract}</p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.neverDo}</p>
      </div>

      {availability === 'read-only' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Read-only"
            body="One cause: this fixture puts the settings surface into a read-only state, so nothing can be submitted from it — the emergency pause, the catalog approval and the floor-register approval included. Every panel still reads."
          />
        </div>
      ) : null}

      {screenState === 'STATE-11' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Every artificial-intelligence model is unavailable"
            body="This module stays fully operable and the emergency pause stays exercisable, which is exactly what AC-SA-000-09 requires. No setting on this screen depends on a model, and no cached model output is presented here as live artificial intelligence."
          />
        </div>
      ) : null}

      {screenState === 'STATE-10' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Artificial intelligence is degraded"
            body="Model-assisted summaries of a settings change are missing. Every category, the floor register, the catalog, the locale packs and the emergency pause read and act exactly as before — none of them consults a model."
          />
        </div>
      ) : null}

      {screenState === 'STATE-05' ? (
        <div className="mt-4">
          <Banner
            tone="blocked"
            heading="This console role does not carry the action you attempted"
            body="Which role does carry it is named beside each control below, and the refusal is stated rather than hidden behind a missing button. Nothing about another role’s scope is disclosed here."
          />
        </div>
      ) : null}

      {screenState === 'STATE-09' ? (
        <div className="mt-4">
          <Banner
            tone="info"
            heading="A submitted settings change is pending, not applied"
            body="An accepted change is shown in its own state — pending, then approved, then applied, then distributed, then reconciled. It is never collapsed into one word and never rendered as applied before it is."
          />
        </div>
      ) : null}

      {screenState === 'STATE-13' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Recovering"
            body="The settings change ledger is being re-read after a failure. Four of nineteen change records have been re-read so far, and nothing on this screen is presented as recovered until all nineteen are."
          />
        </div>
      ) : null}

      {/* ---------------- Aggregate: settings-change posture ---------------- */}
      <Section id="sa07-posture" heading="Settings-change posture">
        <div id="sa07-posture-panel">
          {posture === 'loading' ? (
            <SkeletonBlock lines={3} label="Loading the settings change ledger" />
          ) : posture === 'unavailable' ? (
            <p className="mt-2 text-sm">
              Unavailable — the settings change ledger could not be read. An unavailable aggregate is
              never rendered as a count, and never left blank.
            </p>
          ) : (
            <>
              <ul className="mt-2 flex flex-wrap gap-2">
                {postureRows.map((p) => (
                  <li key={p.state}>
                    <StatusPill
                      tone={p.state === 'refused' ? 'blocked' : 'info'}
                      icon="•"
                      label={`${p.count} ${p.state}`}
                    />
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <FreshnessLabel
                  asOfLabel={posture === 'stale' ? POSTURE_STALE_AS_OF : POSTURE_AS_OF}
                  originLabel={POSTURE_ORIGIN}
                />
              </div>
            </>
          )}
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Counts of settings changes by their own state, each with the time it was true. A state
          holding nothing is omitted rather than reported as a count of none.
        </p>
      </Section>

      {/* ---------------- The six invariants ---------------- */}
      <Section id="sa07-invariants" heading="The six ENFORCED invariants, rendered locked">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          This module is where all six are displayed. Each renders locked, with no off position for
          any account including the root. There is no switch below, no approval path around one, and
          no configuration key for one (AC-SA-INV-003, L47849; AC-GOAL-051, L2181).
        </p>
        <div id="sa07-invariants-panel" className="mt-3 space-y-3">
          {SA_INVARIANTS.map((i) => (
            <InvariantChip key={i.id} invariant={i} />
          ))}
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The failure idiom here is a record: an edit aimed at one of these six is refused and the
          attempt is written to the platform audit log as a locked-setting-attempt (AC-SEC-602,
          L104033). That is deliberately different from the floor register below, which leaves
          nothing behind at all.
        </p>
        {SA07_ABSENT_CONTROLS.filter((c) => c.placement === 'invariants').map((c) => (
          <div key={c.label} className="mt-3">
            <p className="text-sm font-medium">{c.label}</p>
            <ProhibitionNotice rendering={{ kind: 'absent', note: c.note }} />
          </div>
        ))}
      </Section>

      {/* ---------------- The ten categories ---------------- */}
      <Section id="sa07-categories" heading="The ten navigable settings categories">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Ten categories, closed (L43992, L44633). The severity catalog, locale packs, the invariants
          and floor register, the emergency pause and settings-as-approvable-objects are NOT an
          eleventh through fifteenth category — they are cross-cutting sections, each with its own
          screen annotation, and they appear further down this page (D21).
        </p>
        <div className="mt-3">
          <Tabs
            tabs={SETTINGS_CATEGORIES.map((c) => ({
              id: c.id,
              label: `${c.sectionAnnotation} ${c.name}`,
            }))}
            activeId={activeCategory.id}
            onChange={(id) => setCategory(id as SettingsCategoryId)}
          />
        </div>

        <div className="mt-4">
          <h3 className="text-base font-semibold">
            {activeCategory.name}{' '}
            <span className="text-xs font-normal text-[var(--color-ink-subtle)]">
              {activeCategory.sectionAnnotation}
            </span>
          </h3>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {activeCategory.summary}
          </p>

          <div className="mt-3">
            <Table
              caption={`${activeCategory.name} — the values the frozen source states`}
              columns={[
                { key: 'name', header: 'Setting' },
                { key: 'value', header: 'Stated value' },
                { key: 'class', header: 'Change class' },
                { key: 'source', header: 'Source' },
              ]}
              loading={screenState === 'STATE-02'}
              {...(availability === 'unavailable'
                ? {
                    error:
                      'This category could not be read in this state. Nothing is presented as unset while it cannot be read.',
                  }
                : {})}
              rows={
                screenState === 'STATE-01'
                  ? []
                  : activeCategory.settings.map((s) => ({
                      name: s.name,
                      value: s.value,
                      class: CHANGE_CLASS_LABEL[s.changeClass],
                      source: s.sourceRef,
                    }))
              }
              emptyState={{
                title: `The source defines no setting inside ${activeCategory.name}`,
                whatCreatesIt:
                  'A setting appears here when the frozen source states one. This category is named in the module definition at L44633 and never populated, so it is left empty rather than filled with a plausible value.',
              }}
            />
          </div>

          {/* Per-category controls and prohibitions, by rule. */}
          {activeCategory.id === 'integrations' ? (
            <div className="mt-4 space-y-3">
              <div>
                <Button
                  {...(integrationRequestDecision.outcome === 'allowed'
                    ? {}
                    : {
                        disabledReason: namedReason(
                          integrationRequestDecision,
                          role,
                          'Requesting a new integration is the Platform Engineer’s control (L95577). It opens a scope decision, so it sits with the role that takes scope decisions.',
                          availability,
                        ),
                      })}
                >
                  Request a new integration
                </Button>
                <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                  This opens the scope-decision path, not a configuration form. Nothing about an
                  endpoint is captured here.
                </p>
              </div>
              {SA07_ABSENT_CONTROLS.filter((c) => c.placement === 'integrations').map((c) => (
                <div key={c.label}>
                  <p className="text-sm font-medium">{c.label}</p>
                  <ProhibitionNotice rendering={{ kind: 'absent', note: c.note }} />
                </div>
              ))}
            </div>
          ) : null}

          {activeCategory.id === 'memory-and-data'
            ? SA07_ABSENT_CONTROLS.filter((c) => c.placement === 'memory-and-data').map((c) => (
                <div key={c.label} className="mt-4">
                  <p className="text-sm font-medium">{c.label}</p>
                  <ProhibitionNotice rendering={{ kind: 'absent', note: c.note }} />
                </div>
              ))
            : null}

          {activeCategory.id === 'compliance' ? (
            <div className="mt-4">
              <PermissionNotice
                decision={{
                  ...complianceCategoryDecision,
                  explanation:
                    'The Platform Engineer is read-only on the Compliance category. Compliance posture is commercial rather than engineering work (L42714).',
                }}
              />
              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                {role === 'PLATFORM_ENGINEER'
                  ? 'The Platform Engineer is read-only on this one category, because compliance posture is commercial rather than engineering (L42714). Every other Band A category is engineering work.'
                  : 'The Platform Engineer is read-only on this one category alone, because compliance posture is commercial rather than engineering (L42714).'}
              </p>
            </div>
          ) : null}

          {activeCategory.id === 'tenancy' ? (
            <div className="mt-4">
              <h4 className="text-sm font-semibold">Platform-seeded taxonomy</h4>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                Each seeded entry carries its code, its state, the count of tenants referencing it and
                its version (L54833). Its lifecycle is {SEEDED_TAXONOMY_STATES.join(' → ')}.
                Deprecation blocks new references while preserving existing ones — it is the only
                withdrawal there is, because nothing is ever deleted.
              </p>
              <div className="mt-3 flex flex-wrap items-start gap-4">
                <Button
                  {...(taxonomyDecision.outcome === 'allowed'
                    ? {}
                    : {
                        disabledReason: namedReason(
                          taxonomyDecision,
                          role,
                          'Deprecate and Restore on the platform-seeded taxonomy are platform Admin controls (L54850).',
                          availability,
                        ),
                      })}
                >
                  Deprecate
                </Button>
                <Button
                  variant="secondary"
                  {...(taxonomyDecision.outcome === 'allowed'
                    ? {}
                    : {
                        disabledReason: namedReason(
                          taxonomyDecision,
                          role,
                          'Deprecate and Restore on the platform-seeded taxonomy are platform Admin controls (L54850).',
                          availability,
                        ),
                      })}
                >
                  Restore
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Section>

      {/* ---------------- Governed settings ---------------- */}
      <Section id="sa07-governed" heading="Governed settings">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The platform carries seventeen governed settings, each with a floor-register bound
          (AC-SA-19-05, L46318). The count is closed; the list is enumerated nowhere in the frozen
          source, in any chapter. So this screen shows the settings the source does name, inside the
          categories above, and does not claim those are the seventeen — that mapping would be an
          inference the source never makes.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every write path, tenant-side and platform-side, lands in the tenant-configuration registry
          and no bypass exists (AC-SA-19-02). This module displays the bounds; MOD-SA-19 enforces
          them. Stated count: {GOVERNED_SETTINGS_COUNT}.
        </p>
      </Section>

      {/* ---------------- Cross-cutting: severity catalog ---------------- */}
      <Section id="sa07-severity" heading={crossCuttingName('severity-catalog')}>
        <p className="text-xs text-[var(--color-ink-subtle)]">{crossCutting('severity-catalog')}</p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The catalog is the on-device severity-classification table. A change to it is critical
          class. Devices apply at the next sync, in order; a run already in flight stays pinned to
          the version it started on.
        </p>
        <div className="mt-3">
          <Table
            caption="Severity-classification table distribution"
            columns={[
              { key: 'artifact', header: 'Artifact' },
              { key: 'version', header: 'Version' },
              { key: 'state', header: 'Command state' },
              { key: 'note', header: 'What that means' },
            ]}
            rows={SEVERITY_CATALOG_DISTRIBUTION.map((d) => ({
              artifact: d.artifact,
              version: d.version,
              state: <CommandStateBadge state={d.commandState} />,
              note: d.note,
            }))}
            emptyState={{
              title: 'No catalog version has been distributed',
              whatCreatesIt: 'An approved catalog change creates a distribution row.',
            }}
          />
        </div>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          No tenant configuration can remove or weaken the Severity 1 floor; an attempt is rejected at
          the point of entry with the floor stated (AC-SA-07-11-02, L44490).
        </p>
        <div className="mt-3">
          {criticalAction(
            approveCatalogDecision,
            'Approve the catalog change',
            'A change to the severity-classification table is critical class, so the root approves it (L42801).',
          )}
        </div>
      </Section>

      {/* ---------------- Cross-cutting: locale packs ---------------- */}
      <Section id="sa07-locale" heading={crossCuttingName('locale-packs')}>
        <p className="text-xs text-[var(--color-ink-subtle)]">{crossCutting('locale-packs')}</p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Two languages at V1, English and Spanish, and nothing is translated at runtime. A pack moves
          through {LOCALE_PACK_STATES.join(' → ')}. A pack with any untranslated key fails publication
          and names the keys (AC-SA-07-12-03, L44524).
        </p>
        <div className="mt-3">
          <Table
            caption="Locale packs"
            columns={[
              { key: 'language', header: 'Language' },
              { key: 'version', header: 'Version' },
              { key: 'state', header: 'State' },
            ]}
            rows={LOCALE_PACKS.map((p) => ({
              language: p.language,
              version: p.version,
              state: (
                <StatusPill
                  tone={p.state === 'Failed' ? 'blocked' : p.state === 'InForce' ? 'ok' : 'info'}
                  icon="•"
                  label={p.state}
                />
              ),
            }))}
            emptyState={{
              title: 'No locale pack has been prepared',
              whatCreatesIt:
                'A pack appears once it is prepared. How a pack reaches "Prepared" is not defined in the source, so no upload control is drawn.',
            }}
          />
        </div>
      </Section>

      {/* ---------------- Cross-cutting: floor register ---------------- */}
      <Section
        id="sa07-floor-register"
        heading={crossCuttingName('invariants-and-floor-register')}
      >
        <p className="text-xs text-[var(--color-ink-subtle)]">
          {crossCutting('invariants-and-floor-register')}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Eight rows. Tenants tighten; they never loosen. A looser-than-floor value is rejected at
          entry with the bound stated, and is never stored. The register rejects; it does not log —
          which is the opposite idiom from the six invariants above, where the refused attempt is
          exactly what gets written down (AC-SA-07-13-04, L44568).
        </p>
        <div className="mt-3">
          <Table
            caption="The platform floor register"
            columns={[
              { key: 'name', header: 'Row' },
              { key: 'bound', header: 'Floor or ceiling' },
              { key: 'source', header: 'Source' },
            ]}
            rows={FLOOR_REGISTER_ROWS.map((r) => ({
              name: r.namedInSource ? (
                r.name
              ) : (
                <span className="text-[var(--color-ink-subtle)]">{r.name} — unnamed</span>
              ),
              bound: r.floorOrCeiling,
              source: r.sourceRef,
            }))}
            emptyState={{
              title: 'The floor register is empty',
              whatCreatesIt: 'A row exists for every governed bound the platform holds.',
            }}
          />
        </div>
        {screenState === 'STATE-04' ? (
          <p role="alert" className="mt-3 text-sm text-[var(--color-status-blocked)]">
            Refused: an offline credential-trust window of 96 hours was submitted against a ceiling of
            72 hours. The permitted range is up to and including 72 hours. The value was not stored,
            the existing value is unchanged, and no record of the attempted value was kept — the
            register rejects rather than accepting and logging (AC-SA-07-13-04, L44568). Where a
            bound-validation check is itself unavailable the write is refused for the same reason and
            the existing value stands (FB-SA-10).
          </p>
        ) : null}
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Tightening a bound surfaces non-conforming existing tenant values in a conformance report
          rather than rewriting them (AC-SA-07-13-06, L44568). Nobody’s stored value is edited on
          their behalf.
        </p>
        <div className="mt-3">
          {criticalAction(
            approveBoundDecision,
            'Approve the bound change',
            'A change to a floor-register bound is critical class, so the root approves it (AC-SA-07-13-04, L44568).',
          )}
        </div>
      </Section>

      {/* ---------------- Cross-cutting: emergency pause ---------------- */}
      <Section id="sa07-pause" heading={crossCuttingName('emergency-pause')}>
        <p className="text-xs text-[var(--color-ink-subtle)]">{crossCutting('emergency-pause')}</p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Scope is platform-wide or one named tenant (L70933). The pause suspends agent activity: an
          agent run already in flight checkpoints at the next stage boundary and parks. It has no
          effect on on-device gates, specification checks, severity classification or the Severity 1
          hold (AC-SA-07-14-05, L44604) — the deterministic layer keeps running, which is the whole
          point of pausing only the agents.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Pause states: {PAUSE_STATES.join(' → ')}.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          D8, DEC-PAUSE-001 is open. This build renders the only reading consistent with “no fallback
          depends indefinitely on one person”: the Admin proposes, the root approves. Pause and resume
          are each critical class and each separately approved (AC-SA-07-14-01, L44604).
        </p>

        <div className="mt-4 flex flex-wrap items-start gap-6">
          <div>
            <Button {...proposeProps} onClick={() => setPauseProposal('PauseRequested')}>
              Propose an emergency pause
            </Button>
          </div>
          <div>
            {criticalAction(
              approvePauseDecision,
              'Approve the pause proposal',
              'Approving a pause is the root’s act alone (AC-SA-07-14-01, L44604).',
              () => setPauseProposal('Checkpointing'),
            )}
            {approvePauseDecision.stage === 'BASE_ROLE' ? (
              <PermissionNotice
                decision={{
                  ...approvePauseDecision,
                  explanation:
                    'Approving a pause is the root’s act alone, and the action bar above is replaced rather than disabled so no control here can be mistaken for an approval path.',
                }}
              />
            ) : null}
          </div>
          <div>
            <Button
              variant="secondary"
              {...(proposeResumeDecision.outcome === 'allowed'
                ? { onClick: () => setPauseProposal('ResumeRequested') }
                : {
                    disabledReason: namedReason(
                      proposeResumeDecision,
                      role,
                      'Resume opens its own approval request and never reverses the pause directly (L21588). It is the root’s act.',
                      availability,
                    ),
                  })}
            >
              Propose a resume
            </Button>
          </div>
        </div>

        {role === 'PLATFORM_ENGINEER' ? (
          <div className="mt-2">
            <PermissionNotice
              decision={{
                ...engineerPauseDecision,
                explanation:
                  'DEC-PAUSE-001 is open. Four incompatible readings of who may pause sit in the source, so a Platform Engineer proposal is drawn and inert rather than accepted or removed.',
              }}
            />
          </div>
        ) : null}

        {pauseProposal !== null ? (
          <p className="mt-3 text-sm">
            <StatusPill tone="attention" icon="•" label={pauseProposal} />
            <span className="ml-2 text-[var(--color-ink-muted)]">
              A seeded fixture advanced to this state on your click. Nothing was dispatched anywhere,
              and no agent anywhere changed behaviour.
            </span>
          </p>
        ) : null}

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-sm font-medium">Pause and resume in one action</p>
            <ProhibitionNotice
              rendering={{
                kind: 'disabled-with-reason',
                label: 'Pause and resume in one action',
                reason:
                  'Not offered. Resume is a separate act with its own approval and its own audit record; one control that did both would collapse two decisions into one (L65614, L21588).',
              }}
            />
          </div>
          <div>
            <p className="text-sm font-medium">Delegate this action</p>
            <ProhibitionNotice
              rendering={{
                kind: 'disabled-with-reason',
                label: 'Delegate this action',
                reason:
                  'Not offered. A critical-class action cannot be delegated out of the root, because that is the only thing making it critical class (L65614).',
              }}
            />
          </div>
          {SA07_ABSENT_CONTROLS.filter((c) => c.placement === 'pause').map((c) => (
            <div key={c.label}>
              <p className="text-sm font-medium">{c.label}</p>
              <ProhibitionNotice rendering={{ kind: 'absent', note: c.note }} />
            </div>
          ))}
          <div>
            <p className="text-sm font-medium">The runaway-loop kill switch</p>
            <ProhibitionNotice
              rendering={{
                kind: 'absent',
                note: 'Not built in this slice, for any account. The frozen source describes it beside the emergency pause and warns that the two must never be conflated — one stops a loop, the other suspends agent activity under approval. Two controls described in one paragraph become one control the moment somebody builds them together, so this one is left out and named here instead (D8).',
              }}
            />
          </div>
        </div>
      </Section>

      {/* ---------------- Cross-cutting: settings as approvable objects ---------------- */}
      <Section
        id="sa07-approvable"
        heading={crossCuttingName('settings-as-approvable-objects')}
      >
        <p className="text-xs text-[var(--color-ink-subtle)]">
          {crossCutting('settings-as-approvable-objects')}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every setting category is an approvable object. A change awaiting approval is visibly
          pending, and nothing applies silently (L44612). A settings change moves through{' '}
          {SETTING_STATES.filter((s) => s !== 'refused').join(' → ')}, with{' '}
          <strong>refused</strong> terminal wherever the change targets one of the six invariants.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Change class is determined by the setting, never by the operator’s role (AC-SA-07-15-03,
          L44627). That is why the change class sits in the category tables above, beside the value,
          and not beside the role selector.
        </p>
      </Section>

      {/* ---------------- D22: the extension material ---------------- */}
      <section
        id="sa07-extension"
        aria-labelledby="sa07-extension-h"
        className="mt-10 rounded-[var(--radius-surface)] border-2 border-dashed border-[var(--color-border-strong)] p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          {EXTENSION_LABEL}
        </p>
        <h2 id="sa07-extension-h" className="mt-1 text-lg font-semibold">
          Scheduled work and global feature control
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Everything above this border is SoW Fact from §8.7. Everything inside it is classified a
          User-Mandated Product Extension at L54620 and L98419 — it is not SoW Fact, and it is drawn
          apart so contract and extension stay distinguishable at a glance (D22).
        </p>

        <h3 className="mt-4 text-base font-semibold">Scheduled work</h3>
        <ul className="mt-2 space-y-3 text-sm">
          {EXTENSION_SCHEDULED_WORK.map((item) => (
            <li key={item.name}>
              <p className="font-medium">{item.name}</p>
              <p className="text-[var(--color-ink-muted)]">{item.detail}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{item.sourceRef}</p>
            </li>
          ))}
        </ul>

        <h3 className="mt-4 text-base font-semibold">Global feature control</h3>
        <ul className="mt-2 space-y-3 text-sm">
          {EXTENSION_FEATURE_CONTROL.map((item) => (
            <li key={item.name}>
              <p className="font-medium">{item.name}</p>
              <p className="text-[var(--color-ink-muted)]">{item.detail}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{item.sourceRef}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {PER_TENANT_OVERRIDE_NOTE}
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Capability-level enablement follows Engineer proposes, Admin approves; commercial
          entitlement is an Admin action (D14, L46668). No control is drawn for either here, because
          the source describes the routes and names no affordance on this screen.
        </p>
      </section>

      {/* ---------------- Workflows ---------------- */}
      <Section id="sa07-workflows" heading="Workflows this module renders">
        <ul className="mt-2 space-y-3 text-sm">
          {SA07_WORKFLOWS.map((w) => (
            <li key={w.name}>
              <p className="font-medium">
                {w.name} <span className="text-[var(--color-ink-subtle)]">({w.id})</span>
              </p>
              <p className="text-[var(--color-ink-muted)]">
                {w.actor} · {w.trigger}
              </p>
              <p className="text-[var(--color-ink-muted)]">Ends at: {w.terminalStates.join('; ')}.</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">Matched by {w.matchedBy}.</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------------- Reaching tenant content ---------------- */}
      <Section id="sa07-access" heading="Reaching tenant content from here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A pause scoped to one tenant, a conformance report naming a tenant’s value, a taxonomy
          entry’s reference count — each has an obvious reason to link into that tenant’s records, and
          none of them does. No link on this console resolves to record-level tenant content; it
          resolves to a session-request form under a named access class, and there is no ambient
          browsing anywhere on this surface (AC-SA-000-07, AC-SEC-801).
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-ink-muted)]">
          {ACCESS_CLASSES.map((c) => (
            <li key={c.id}>
              <span className="font-medium">{c.name}</span> — {c.description}
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------------- Unspecified in source ---------------- */}
      <Section id="sa07-unspecified" heading="Unspecified in source">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each affordance below is one the source does not define. It is named rather than invented: a
          plausible invented control reads back as a requirement.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {SA07_UNSPECIFIED_IN_SOURCE.map((u) => (
            <li key={u.affordance}>
              <p className="font-medium">{u.affordance}</p>
              <p className="text-[var(--color-ink-muted)]">{u.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------------- Conflicts ---------------- */}
      <Section id="sa07-conflicts" heading="Conflicts in the source">
        <ul className="mt-3 space-y-3 text-sm">
          {SA07_SOURCE_CONFLICTS.map((c) => (
            <li key={c.topic}>
              <p className="font-medium">{c.topic}</p>
              <p className="text-[var(--color-ink-muted)]">{c.conflict}</p>
              <p className="text-[var(--color-ink-muted)]">Resolved as: {c.resolution}</p>
            </li>
          ))}
        </ul>
      </Section>
    </SaConsoleShell>
  )
}

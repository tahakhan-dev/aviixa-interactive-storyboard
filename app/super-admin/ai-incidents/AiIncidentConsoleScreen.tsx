import Link from 'next/link'
import type { RoleId } from '@/domain/roles'
import { BLAST_RADIUS_NO_COUNT, BLAST_RADIUS_NODES, PAUSE_CONTROL_TABLE, PAUSE_DOES_NOT_TABLE } from '@/ai/controls/blast-radius'
import {
  APP_012_LABEL,
  LOCAL_OPEN_DECISIONS,
  PAUSE_FEATURE_ATTRIBUTION,
  localDecision,
} from '@/ai/controls/decisions'
import { ROLLBACK_FORMS, ROLLBACK_MAY_NEVER, ROLLBACK_NO_SINGLE_CONTROL, ROLLBACK_PROVENANCE } from '@/ai/controls/rollback'
import {
  FRONTLINE_PAUSE_DISCLOSURE,
  KILL_SWITCH,
  PAUSE_RESUME_WORKFLOW,
  PAUSE_SEMANTICS,
  RESUME_IS_SEPARATE,
  SITE_SCOPED_PAUSE,
  STOP_ACTS,
  STOP_MECHANISMS,
  AGENT_IDENTITY_COLUMNS,
} from '@/ai/controls/stop'
import { UNSET_GOVERNING_VALUES } from '@/ai/failures/open-values'
import { pauseJoins } from '@/ai/join/mode-failure'
import {
  CONSOLE_AUTHORITY_COLUMNS,
  CONSOLE_AUTHORITY_ROWS,
  CONSOLE_AUTHORITY_PROVENANCE,
  NOT_SHIPPABLE_CITED_DECISIONS,
  consoleAuthorityRow,
} from '@/surfaces/sa/ai-failure-authority'
import { AiFailureAuthorityPanel } from '@/ui/sa/AiFailureAuthorityPanel'
import { LockedControl, StatusPill, Table } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { PrototypeDisclosure } from '@/ui/sa/PrototypeDisclosure'
import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import {
  ACCESS_CLASS_RULE,
  BLAST_RADIUS_STRIP_FIELDS,
  COMMUNICATIONS_PANEL,
  DISAMBIGUATION_BANNERS,
  DISAMBIGUATION_RULE,
  INCIDENT_ROUTE,
  PAUSE_SCREEN_FIELDS,
  RECONCILIATION_CLOSE_CONTROL,
  RECONCILIATION_ITEMS,
} from './fixtures'

/**
 * `SB-43-351` (L91276) — THE ARTIFICIAL-INTELLIGENCE INCIDENT CONSOLE.
 *
 * ── IT TAKES NO ACT, AND THAT IS THE SOURCE'S RULE RATHER THAN A SHORTCUT ──
 * L91220: the console "observes the mechanism and never takes a tenant
 * operational decision". Every response control the authority matrix names is
 * either critical-class — in which case its proposal and its approval already
 * live on `app/super-admin/platform-settings/`, which holds the pause pair
 * today — or undecided, in which case there is no behaviour to build. So this
 * screen draws STATES and links to where an act lives. It builds no second
 * pause, which is what a route holding its own propose-and-approve pair would
 * be, and it therefore needs no client boundary: there is no state and no
 * handler anywhere below.
 *
 * ── NOTHING OPERATIONAL, FOR ANY ROLE INCLUDING ROOT ───────────────────────
 * L91276's last sentence and L91296 make reaching tenant operational content a
 * separate, audited, session-scoped act under one of three named access
 * classes, and that matrix row is `Allowed with conditions` in all four cells —
 * there is no cell granting it outright. The rule renders; the content does not.
 *
 * ── NO SINGLE ROLLBACK CONTROL, AND NO THIRD PAUSE SCOPE ───────────────────
 * The eight forms render as eight records with eight mechanisms and eight
 * source classifications (L87803). The site-scoped pause renders through
 * `LockedControl` — inoperable BY CONSTRUCTION, its props carrying no handler —
 * with its identifier and every reading, because drawing nothing tells an
 * operator the scope does not exist and drawing a working control invents a
 * capability at critical class.
 *
 * ── NO COUNT OF WHAT STOPS AND WHAT CONTINUES ──────────────────────────────
 * The enumeration renders and no number does. The source's own contested
 * sentence is quoted with its locator, which is disclosure; restating it as
 * this build's own claim would be picking a side.
 *
 * ── PROVENANCE, ONE CLASS ──────────────────────────────────────────────────
 * `PROV-4` everywhere on this screen. Every string is a transcribed
 * deterministic rule or an authority cell; nothing here was produced by an
 * agent and no path labels anything as live artificial intelligence.
 *
 * ── OPERATIONAL SEVERITY ONLY ──────────────────────────────────────────────
 * `AC-43-103` (L89975) forbids sharing a rendering component with the
 * manufacturing severity catalogue. The operational band arrives as a STRING on
 * the mode-to-failure join and is printed as text; no severity component from
 * slice 6 or 9 is reachable from here, and the covering test walks this
 * screen's whole import graph rather than one directory — a component reached
 * through the mounted authority panel or through a barrel was invisible to the
 * directory scan it replaces.
 */

/**
 * Every table on this screen transcribes a frozen-source register held as a
 * const tuple, so none of them can be empty. `Table` requires an empty state
 * anyway and it is right to: a shared one that says WHY the case is
 * unreachable is more useful than five hand-written variants of "no rows",
 * and if a future edit makes one of these lists computed, this text is what a
 * reader sees rather than a blank grid.
 */
const TRANSCRIBED_REGISTER_EMPTY_STATE = {
  title: 'This register is transcribed from the frozen source and cannot be empty',
  whatCreatesIt:
    'Each row is a line of the blueprint carried verbatim, so an empty table here would mean the ' +
    'transcription itself was lost rather than that there is nothing to show.',
} as const

/**
 * The open governing values that the unshippable authority rows themselves
 * name. BOTH SIDES DERIVED: the identifiers come off the rows
 * (`NOT_SHIPPABLE_CITED_DECISIONS`) and the membership test is the open
 * register, so a sixth unshippable row citing a fourth decision appears here
 * without anyone editing a list. Nothing states how many there are.
 *
 * `DEC-AIPAUSE-001` and `DEC-KILL-001` are cited by unshippable rows and are
 * correctly absent: they are open decisions about authority, not values in the
 * ten-row governing-value register, and the register is the membership test.
 */
const UNSET_VALUES_BEHIND_UNSHIPPABLE_ROWS = UNSET_GOVERNING_VALUES.filter((value) =>
  NOT_SHIPPABLE_CITED_DECISIONS.includes(value.id),
)

export interface AiIncidentConsoleScreenProps {
  /** The console role reading the screen. Defaults to the least-privileged. */
  readonly role?: RoleId
}

function Section({
  id,
  heading,
  children,
}: {
  readonly id: string
  readonly heading: string
  readonly children: React.ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="mt-10">
      <h2 id={`${id}-heading`} className="text-lg font-semibold text-[var(--color-ink)]">
        {heading}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}

function Locator({ refs }: { readonly refs: readonly string[] }) {
  return (
    <span className="ml-2 whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
      [{refs.join(', ')}]
    </span>
  )
}

export function AiIncidentConsoleScreen({ role = 'SUPPORT' }: AiIncidentConsoleScreenProps) {
  // The column this operator reads, resolved once from the matrix's own header
  // rather than keyed here. A role with no column on this matrix reads none,
  // which is the honest answer for a tenant role that cannot reach the console.
  const column = CONSOLE_AUTHORITY_COLUMNS.find((candidate) => candidate.role === role)
  const airto = localDecision('DEC-AIRTO-001')

  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">AVIIXA</p>
      <h1 className="mt-2 text-3xl font-semibold">{INCIDENT_ROUTE.title}</h1>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        {INCIDENT_ROUTE.storyboard.id} · {INCIDENT_ROUTE.storyboard.locator} ·{' '}
        <Link href="/super-admin/" className="text-[var(--color-primary)] underline">
          Super Admin Platform Console
        </Link>
      </p>
      <PrototypeDisclosure />

      <div className="mt-4">
        <ProvenanceMark
          classId={CONSOLE_AUTHORITY_PROVENANCE}
          statement="Every rule, cell and enumeration on this screen is transcribed from the frozen source. No agent produced any of it, and none of it is live artificial intelligence."
        />
      </div>

      {/* THE ROUTE'S OWN ATTRIBUTION, FIRST. A reader must not reach a control
          state before being told this route is a build decision. */}
      <section
        role="note"
        aria-label="Where this route comes from"
        data-testid="incident-route-attribution"
        className="mt-6 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
      >
        <p className="font-medium text-[var(--color-ink)]">
          The route <code>{INCIDENT_ROUTE.path}</code> is this build&rsquo;s, not the
          source&rsquo;s.
        </p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{INCIDENT_ROUTE.sourceStatus}</p>
        <p className="mt-2 text-[var(--color-ink-muted)]">{INCIDENT_ROUTE.whyItIsItsOwnRoute}</p>
        <p className="mt-2 text-[var(--color-ink)]">{APP_012_LABEL}</p>
        <p className="mt-3 font-medium text-[var(--color-ink)]">
          The screen identifiers the source does give this surface — four spellings across three
          chapters, with no cross-reference between them:
        </p>
        <ul className="mt-1 space-y-1 text-[var(--color-ink-muted)]">
          {INCIDENT_ROUTE.screenIdentifiers.map((screenId) => (
            <li key={screenId.id}>
              <span className="font-medium text-[var(--color-ink)]">{screenId.id}</span> —{' '}
              {screenId.what}
              <Locator refs={[screenId.locator]} />
            </li>
          ))}
        </ul>
      </section>

      {/* ── 1. THE DISAMBIGUATION ─────────────────────────────────────── */}
      <Section id="incident-disambiguation-section" heading="Which incident is this?">
        <div data-testid="incident-disambiguation" className="space-y-3">
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            The console must separate an internet outage from an artificial-intelligence outage,
            because the responses are opposite: a connectivity incident means the floor is working
            offline and the platform waits; an artificial-intelligence incident means connected
            devices are getting no coaching and the platform acts.
            <Locator refs={['L91227']} />
          </p>
          <ul className="space-y-2 text-sm">
            {DISAMBIGUATION_BANNERS.map((banner) => (
              <li
                key={banner.text}
                className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3"
              >
                <p className="font-medium text-[var(--color-ink)]">{banner.text}</p>
                <p className="mt-1 text-[var(--color-ink-muted)]">{banner.meaning}</p>
              </li>
            ))}
          </ul>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            <span className="font-medium text-[var(--color-ink)]">
              None of the three is asserted here.
            </span>{' '}
            No incident runs behind this screen, so picking a banner would claim a classification
            this build has nothing to classify. The rule that computes it, verbatim:
            &ldquo;{DISAMBIGUATION_RULE.quotation}&rdquo;
            <Locator refs={[DISAMBIGUATION_RULE.sourceRef]} /> {DISAMBIGUATION_RULE.whyItMatters}
          </p>
        </div>
      </Section>

      {/* ── 2. THE BLAST-RADIUS STRIP ─────────────────────────────────── */}
      <Section id="incident-blast-radius-strip-section" heading="Blast radius">
        <div data-testid="incident-blast-radius-strip" className="space-y-2">
          {BLAST_RADIUS_STRIP_FIELDS.map((field) => (
            <p key={field.label} className="text-sm">
              <span className="font-medium text-[var(--color-ink)]">{field.label}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">— {field.what}. {field.value}.</span>
            </p>
          ))}
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Every value states that it is unrecorded rather than showing a figure. A plausible
            figure is indistinguishable from a real one and would be quoted back as the
            source&rsquo;s, which is the same reasoning the occurrence-detail screen already ships.
          </p>
        </div>
      </Section>

      {/* ── 3. HEALTH AND QUEUE PANELS ────────────────────────────────── */}
      <Section id="incident-health-section" heading="Provider, model, tool and agent health">
        <div data-testid="incident-health-cards" className="space-y-2 text-sm">
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            Per router role and per agent: state, error rate, latency, evaluation pass rate and
            breaker position. Per atom: invocation failure rate against declared postconditions.
            <Locator refs={['L91224']} />
          </p>
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            No reading is recorded behind this screen, so no card carries a rate. The mode a failure
            puts each surface into IS recorded, because both halves come from transcribed registers:
          </p>
          <ul className="space-y-1">
            {pauseJoins().map((join_) => (
              <li key={join_.mode.id} className="text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">
                  {join_.mode.id} {join_.mode.name}
                </span>{' '}
                joined to {join_.failure.id} on the scope both name — {join_.scope}. Operational
                severity {join_.operationalSeverity}. Frontline chip reads &ldquo;
                {join_.frontlineChipText}&rdquo;.
                <Locator refs={[join_.mode.matrixLocator]} />
              </li>
            ))}
          </ul>
          <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
            {pauseJoins()[0]?.inference}
          </p>
          <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Operational severity is its own vocabulary — Critical, Major, Minor, Informational — and
            shares no rendering with the manufacturing severity catalogue. AC-43-103 forbids a shared
            component and this screen imports none.
            <Locator refs={['L89927', 'L89975']} />
          </p>
        </div>
      </Section>

      <Section id="incident-queue-section" heading="Queue health">
        <p
          data-testid="incident-queue-cards"
          className="max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          Depths and ages for agent runs, gate items, learned-change proposals and, where in scope,
          queued worker requests — all as counts and rates without content.
          <Locator refs={['L91225']} /> No depth is recorded behind this screen, and no queue row
          would carry content even if one were.
        </p>
      </Section>

      {/* ── 4. THE PAUSE SCREEN ───────────────────────────────────────── */}
      <Section id="incident-pause-section" heading="The emergency pause">
        <div data-testid="incident-pause-screen" className="space-y-3 text-sm">
          {/* THE MODULE IDENTIFIER IS READ FROM THE RECORD, NOT TYPED HERE, AND
             * THAT IS NOT COSMETIC.
             *
             * `scripts/build-registries.mjs` counts `MOD-*` mentions in the
             * files of a route directory and reads the winner as the route's
             * OWNER. This route is owned by no module — no `MOD-*` identifier
             * claims this screen anywhere in the frozen source — so a literal
             * mention here would hand the route to whichever module the prose
             * happened to name most, which is the identifier-by-proximity trap
             * the authority matrix's own attribution paragraph exists to warn
             * about. Typing it here first produced exactly that: a tie between
             * a module named in a FEATURE cross-reference and one named in a
             * sentence refusing to mint it.
             *
             * The reader still sees the identifier. It comes from
             * `PAUSE_FEATURE_ATTRIBUTION`, which is where the source-attributed
             * claim lives, with the line it is read from. */}
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            The pause is a source-attributed feature of {PAUSE_FEATURE_ATTRIBUTION.module}:{' '}
            {PAUSE_FEATURE_ATTRIBUTION.feature.id} &ldquo;{PAUSE_FEATURE_ATTRIBUTION.feature.name}
            &rdquo;, {PAUSE_FEATURE_ATTRIBUTION.subFeature.id} &ldquo;
            {PAUSE_FEATURE_ATTRIBUTION.subFeature.name}&rdquo;,{' '}
            {PAUSE_FEATURE_ATTRIBUTION.function.id} &ldquo;
            {PAUSE_FEATURE_ATTRIBUTION.function.name}&rdquo;, actor{' '}
            {PAUSE_FEATURE_ATTRIBUTION.actor}, fallback {PAUSE_FEATURE_ATTRIBUTION.fallback},
            classified {PAUSE_FEATURE_ATTRIBUTION.classification}.
            <Locator refs={[PAUSE_FEATURE_ATTRIBUTION.sourceRef]} />
          </p>
          <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
            {PAUSE_FEATURE_ATTRIBUTION.whatItDoesNotLicense}
          </p>

          <p className="font-medium text-[var(--color-ink)]">The three fixed semantics</p>
          <ol className="space-y-2">
            {PAUSE_SEMANTICS.map((semantic) => (
              <li key={semantic.id} className="text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">{semantic.heading}.</span>{' '}
                {semantic.quotation.replace(/^\*\*[^*]+\*\*\s*/, '').replaceAll('`', '')}
                <Locator refs={[semantic.sourceRef]} />
              </li>
            ))}
          </ol>

          <p className="font-medium text-[var(--color-ink)]">
            The panel fields, from the fuller field list
          </p>
          <ul className="space-y-2">
            {PAUSE_SCREEN_FIELDS.map((field) => (
              <li key={field.label} className="text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">{field.label}</span> —{' '}
                {field.note}
                <Locator refs={['L70933']} />
              </li>
            ))}
          </ul>

          <p className="max-w-prose text-[var(--color-ink-muted)]">
            The proposal and its approval are not drawn here.{' '}
            <Link
              href="/super-admin/platform-settings/"
              className="text-[var(--color-primary)] underline"
            >
              Platform Settings holds the emergency pause pair
            </Link>
            , and a second pair on a second route would be a second pause.
          </p>

          <p className="font-medium text-[var(--color-ink)]">
            Resume is its own act, and no clock reaches it
          </p>
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            {RESUME_IS_SEPARATE.criterion} — &ldquo;{RESUME_IS_SEPARATE.quotation}&rdquo; There is no
            automatic resume, no timer and no window anywhere in this build&rsquo;s pause code.
            {RESUME_IS_SEPARATE.whatIsForbidden}
            <Locator refs={RESUME_IS_SEPARATE.sourceRefs} />
          </p>

          {/* THE ABSTENTION, RENDERED. Both readings live in the canon as
              `DEC-AIDISCLOSE-001` and are pointed at rather than restated —
              `src/disclosure/decisions.ts` is not on this task's path list and
              a second home for one decision is the defect that pointer avoids. */}
          <div
            role="note"
            data-testid="incident-frontline-disclosure-abstention"
            className="space-y-2 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
          >
            <p className="font-medium text-[var(--color-ink)]">
              What the worker&rsquo;s own surface shows is an open decision, and this console does
              not settle it — {FRONTLINE_PAUSE_DISCLOSURE.decision}
            </p>
            <p className="text-[var(--color-ink-muted)]">{FRONTLINE_PAUSE_DISCLOSURE.conflict}</p>
            <p className="text-[var(--color-ink-muted)]">
              {FRONTLINE_PAUSE_DISCLOSURE.whatThisTaskOwns}
            </p>
            <p className="text-[var(--color-ink-muted)]">
              {FRONTLINE_PAUSE_DISCLOSURE.whatThisTaskDoesNotOwn}
            </p>
            <p className="text-[var(--color-ink)]">{FRONTLINE_PAUSE_DISCLOSURE.adopted}</p>
            <p className="text-xs text-[var(--color-ink-subtle)]">
              Every reading is held in {FRONTLINE_PAUSE_DISCLOSURE.canonHome} and pointed at from
              here rather than restated.
              <Locator refs={FRONTLINE_PAUSE_DISCLOSURE.locators} />
            </p>
          </div>

          <p className="font-medium text-[var(--color-ink)]">
            A third scope the source names and does not grant
          </p>
          {/* THREE CARDS DRAW THIS ONE CONTROL ON THIS ONE PAGE, DELIBERATELY,
              AND THEY NOW SAY THE SAME THING ABOUT IT.

              Each answers a different question a reader arrives with, which is
              why none is deleted:
                · HERE — §40.15's pause record. The reader is being told the
                  source names a third scope and does not grant it, and this is
                  the only place its READINGS are printed.
                · The response panel below — §43.3.5 filtered to the operator's
                  own role, one row of fifteen. Removing it would leave a
                  response panel that silently omits a control the matrix names.
                · `AiFailureAuthorityPanel` — the matrix itself, whole and
                  unfiltered, which is that component's own contract.

              What was NOT deliberate: two of the three said "No authority
              settled" and one said "Not available to anyone". One control, two
              locked values, on one page. The value now comes off the matrix row
              at the single input in every case, so the three cannot disagree. */}
          <LockedControl
            controlId="incident-site-scoped-pause"
            label={SITE_SCOPED_PAUSE.label}
            settingValue={
              consoleAuthorityRow('site-scoped-pause').notShippableLock?.settingValue ?? ''
            }
            reason={SITE_SCOPED_PAUSE.buildPosition}
            remains={`Open decision ${SITE_SCOPED_PAUSE.decision}, at ${SITE_SCOPED_PAUSE.locators.join(', ')}.`}
          />
          <ul className="space-y-1">
            {SITE_SCOPED_PAUSE.readings.map((reading) => (
              <li key={reading.locator} className="text-[var(--color-ink-muted)]">
                {reading.text}
                <Locator refs={[reading.locator]} />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── 5. THE TWO STOP MECHANISMS ────────────────────────────────── */}
      <Section id="incident-stop-section" heading="The stop mechanisms, and why they are never one control">
        <div data-testid="incident-stop-mechanisms" className="space-y-3 text-sm">
          <p className="max-w-prose text-[var(--color-ink-muted)]">{KILL_SWITCH.notConflated}</p>
          <Table
            emptyState={TRANSCRIBED_REGISTER_EMPTY_STATE}
            caption="Each stop mechanism, its settings category and its approval class"
            columns={[
              { key: 'mechanism', header: 'Mechanism' },
              { key: 'category', header: 'Settings category' },
              { key: 'class', header: 'Approval class' },
              { key: 'effect', header: 'Effect' },
              { key: 'refs', header: 'Source' },
            ]}
            rows={STOP_MECHANISMS.map((mechanism) => ({
              key: mechanism.id,
              mechanism: mechanism.label,
              category: mechanism.settingsCategory,
              class: mechanism.approvalClass,
              effect: mechanism.effect,
              refs: mechanism.sourceRefs.join(', '),
            }))}
          />
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            The kill switch is drawn and inoperable. Its {KILL_SWITCH.unstated.join(', ')} are each
            unstated in the source, so there is no behaviour to build.
            <Locator refs={[KILL_SWITCH.sourceRef, KILL_SWITCH.cardRef]} />
          </p>
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: `${KILL_SWITCH.whyItMatters} No control is drawn for it, and it is never drawn beside the pause as one control (${KILL_SWITCH.decision}).`,
            }}
          />
          <p className="font-medium text-[var(--color-ink)]">
            What each control does to the deterministic layer
          </p>
          <Table
            emptyState={TRANSCRIBED_REGISTER_EMPTY_STATE}
            caption="Control, scope, approval class and effect on the deterministic layer"
            columns={[
              { key: 'control', header: 'Control' },
              { key: 'scope', header: 'Scope' },
              { key: 'class', header: 'Approval class' },
              { key: 'effect', header: 'Effect on the deterministic layer' },
              { key: 'ref', header: 'Source' },
            ]}
            rows={PAUSE_CONTROL_TABLE.rows.map((row) => ({
              key: row.sourceRef,
              control: row.control,
              scope: row.scope,
              class: row.approvalClass.replaceAll('`', ''),
              effect: row.effectOnDeterministicLayer.replaceAll('`', ''),
              ref: row.sourceRef,
            }))}
          />
        </div>
      </Section>

      {/* ── 6. THE BLAST RADIUS, ENUMERATED ──────────────────────────── */}
      <Section id="incident-blast-radius-section" heading="What a pause reaches">
        <div data-testid="incident-blast-radius" className="space-y-3 text-sm">
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            The enumeration below is the whole of it, and no figure appears beside it.{' '}
            {BLAST_RADIUS_NO_COUNT.whyNoCount} The source&rsquo;s own sentence, quoted:{' '}
            {/* THE QUOTED SPAN IS MARKED, because the covering gate needs to
                tell a quotation from this build's own voice. Its count-phrase
                assertion used to exempt either half of the quoted sentence
                wherever it appeared on the page, so a screen printing one of
                those halves as its own claim passed. The gate now asserts the
                page's matches are exactly the ones inside this element — which
                is also why neither half is written out in this comment. */}
            <q data-testid="blast-radius-source-quotation">
              {BLAST_RADIUS_NO_COUNT.quotation}
            </q>
            <Locator refs={BLAST_RADIUS_NO_COUNT.sourceRefs} />
          </p>
          <Table
            emptyState={TRANSCRIBED_REGISTER_EMPTY_STATE}
            caption="Every behaviour the pause reaches, and which side of the diagram it sits on"
            columns={[
              { key: 'behaviour', header: 'Behaviour' },
              { key: 'side', header: 'Side' },
              { key: 'ref', header: 'Source' },
            ]}
            rows={BLAST_RADIUS_NODES.map((node) => ({
              key: node.key,
              behaviour: node.label,
              side:
                node.kind === 'stops'
                  ? 'Stopping side'
                  : node.kind === 'continues'
                    ? 'Continuing side'
                    : 'Honest rendering — a state to show, not a behaviour that carries on',
              ref: node.sourceRef,
            }))}
          />
          <p className="font-medium text-[var(--color-ink)]">What a pause does not do</p>
          <Table
            emptyState={TRANSCRIBED_REGISTER_EMPTY_STATE}
            caption="What a pause does not do, and the reason for each"
            columns={[
              { key: 'what', header: 'What a pause does not do' },
              { key: 'reason', header: 'Reason' },
              { key: 'ref', header: 'Source' },
            ]}
            rows={PAUSE_DOES_NOT_TABLE.rows.map((row) => ({
              key: row.sourceRef,
              what: row.whatItDoesNotDo,
              reason: row.reason.replaceAll('`', ''),
              ref: row.sourceRef,
            }))}
          />
        </div>
      </Section>

      {/* ── 7. THE ROLLBACK TAXONOMY ─────────────────────────────────── */}
      <Section id="incident-rollback-section" heading="Rollback, in the forms the source distinguishes">
        <div data-testid="incident-rollback-taxonomy" className="space-y-3 text-sm">
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            &ldquo;{ROLLBACK_NO_SINGLE_CONTROL.quotation}&rdquo;
            <Locator refs={[ROLLBACK_NO_SINGLE_CONTROL.sourceRef]} />{' '}
            {ROLLBACK_NO_SINGLE_CONTROL.whatThisBuildDoes}
          </p>
          <Table
            emptyState={TRANSCRIBED_REGISTER_EMPTY_STATE}
            caption="Each form of reversal, what it reverses, its mechanism and its source classification"
            columns={[
              { key: 'form', header: 'Form' },
              { key: 'reverses', header: 'What it reverses' },
              { key: 'mechanism', header: 'Mechanism' },
              { key: 'source', header: 'Source classification' },
              { key: 'ref', header: 'Line' },
            ]}
            rows={ROLLBACK_FORMS.map((form) => ({
              key: form.id,
              form: form.form,
              reverses: form.whatItReverses,
              mechanism: form.mechanism.replaceAll('`', '').replaceAll('**', ''),
              source: form.source.replaceAll('`', ''),
              ref: form.sourceRef,
            }))}
          />
          <p className="font-medium text-[var(--color-ink)]">What no form may ever do</p>
          <ul className="space-y-1">
            {ROLLBACK_MAY_NEVER.map((rule) => (
              <li key={rule.rule} className="text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">{rule.rule}</span> —{' '}
                {rule.quotation}
                <Locator refs={[rule.sourceRef]} />
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <ProvenanceMark
              classId={ROLLBACK_PROVENANCE}
              statement="Eight transcribed reversal records. Nothing here is produced by an agent and no form is exercisable from this screen."
            />
          </div>
        </div>
      </Section>

      {/* ── 8. THE RESPONSE PANEL ────────────────────────────────────── */}
      <Section
        id="incident-response-section"
        heading="Response controls, enabled or disabled one at a time"
      >
        <div data-testid="incident-response-panel" className="space-y-3 text-sm">
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            Each control below is answered for{' '}
            <span className="font-medium text-[var(--color-ink)]">{column?.header ?? role}</span>{' '}
            from that row&rsquo;s own cell and its own classification — never from a rule about the
            role, and never from a count of how many rows are open.
          </p>
          {column === undefined ? (
            <ProhibitionNotice
              rendering={{
                kind: 'absent',
                note: `This matrix has four columns and none of them is ${role}. A role with no column on it reads no authority here, which is the honest answer rather than a default.`,
              }}
            />
          ) : (
            <ul className="space-y-3">
              {CONSOLE_AUTHORITY_ROWS.map((row) => {
                const cell = row.renderedCells.find((candidate) => candidate.header === column.header)
                if (!row.shippable) {
                  return (
                    <li key={row.id}>
                      {/* All three text props come off the row. They used to
                          be spelled here AND in
                          `src/ui/sa/AiFailureAuthorityPanel.tsx` with two
                          different `settingValue`s for the same control. */}
                      <LockedControl
                        controlId={`incident-authority-${row.id}`}
                        label={row.operation}
                        settingValue={row.notShippableLock?.settingValue ?? ''}
                        reason={row.notShippableLock?.reason ?? ''}
                        remains={row.notShippableLock?.remains ?? null}
                      />
                    </li>
                  )
                }
                if (row.id === 'close-an-incident') {
                  return (
                    <li key={row.id}>
                      <LockedControl
                        controlId="incident-authority-close-an-incident"
                        label={row.operation}
                        settingValue={RECONCILIATION_CLOSE_CONTROL.settingValue}
                        reason={RECONCILIATION_CLOSE_CONTROL.reason}
                        remains={RECONCILIATION_CLOSE_CONTROL.remains}
                      />
                    </li>
                  )
                }
                return (
                  <li key={row.id} className="text-[var(--color-ink-muted)]">
                    <span className="font-medium text-[var(--color-ink)]">{row.operation}</span>{' '}
                    <StatusPill
                      tone={cell?.outcome === 'allowed' ? 'ok' : 'neutral'}
                      icon="•"
                      label={cell?.outcome ?? 'no cell'}
                    />{' '}
                    {cell?.verbatim}
                    <Locator refs={[row.sourceRef]} />
                  </li>
                )
              })}
            </ul>
          )}
          {/* NO COUNT, INCLUDING IN THE SENTENCE THAT CLAIMS THERE IS NONE.
              This paragraph read "Three governing values the unshippable rows
              name are themselves unset" over a hand-typed array of three
              identifiers and an `as` cast — a literal count inside the sentence
              denying one, and a list that would not notice a sixth unshippable
              row citing a fourth decision. Both halves are derived now:
              `NOT_SHIPPABLE_CITED_DECISIONS` comes off the rows, and the
              intersection with the open governing-value register is computed. */}
          <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Which rows cannot ship is derived from each row&rsquo;s own cells and classification at a
            single input, and no number of them is written anywhere. The governing values the
            unshippable rows name that are themselves unset:{' '}
            {UNSET_VALUES_BEHIND_UNSHIPPABLE_ROWS.map(
              (value) => `${value.id} — ${value.state}`,
            ).join('; ')}
            .
            <Locator refs={['L90038', 'L90039', 'L90040']} />
          </p>
        </div>
      </Section>

      {/* THE AUTHORITY MATRIX ITSELF, MOUNTED. Nothing under `app/` reached
          this panel before this route existed, and a component reachable from
          nothing is not shipped. */}
      <Section id="incident-authority-section" heading="The matrix these controls are read from">
        <AiFailureAuthorityPanel />
      </Section>

      {/* ── 9. COMMUNICATIONS ────────────────────────────────────────── */}
      <Section id="incident-communications-section" heading="Communications">
        <div data-testid="incident-communications" className="space-y-2 text-sm">
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            {COMMUNICATIONS_PANEL.what}
            <Locator refs={COMMUNICATIONS_PANEL.sourceRefs} />
          </p>
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            {COMMUNICATIONS_PANEL.whatItMayNotCarry}
          </p>
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            Nothing is drafted, scheduled or sent behind this screen, so the panel lists no
            communication rather than showing an empty inbox.
          </p>
        </div>
      </Section>

      {/* ── 10. RECONCILIATION ───────────────────────────────────────── */}
      <Section id="incident-reconciliation-section" heading="Reconciliation, and closure">
        <div data-testid="incident-reconciliation" className="space-y-3 text-sm">
          <ul className="space-y-2">
            {RECONCILIATION_ITEMS.map((item) => (
              <li key={item.item} className="text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">{item.item}</span> —{' '}
                {item.state}
                <Locator refs={[item.sourceRef]} />
              </li>
            ))}
          </ul>
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            Each obligation is outstanding until it is recorded, and none is recorded here.
          </p>
          <LockedControl
            controlId="incident-reconciliation-close"
            label={RECONCILIATION_CLOSE_CONTROL.label}
            settingValue={RECONCILIATION_CLOSE_CONTROL.settingValue}
            reason={RECONCILIATION_CLOSE_CONTROL.reason}
            remains={RECONCILIATION_CLOSE_CONTROL.remains}
          />
          <p className="text-xs text-[var(--color-ink-subtle)]">
            <Locator refs={RECONCILIATION_CLOSE_CONTROL.sourceRefs} />
          </p>
        </div>
      </Section>

      {/* ── 11. THE ACCESS-CLASS RULE ────────────────────────────────── */}
      <Section id="incident-access-class-section" heading="Why nothing operational appears here">
        <div
          data-testid="incident-access-class-rule"
          role="note"
          className="space-y-2 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
        >
          <p className="text-[var(--color-ink)]">&ldquo;{ACCESS_CLASS_RULE.quotation}&rdquo;</p>
          <p className="text-[var(--color-ink-muted)]">{ACCESS_CLASS_RULE.everyRole}</p>
          <p className="text-xs text-[var(--color-ink-subtle)]">
            <Locator refs={ACCESS_CLASS_RULE.sourceRefs} />
          </p>
        </div>
      </Section>

      {/* ── 12. THE AGENT REFUSAL ────────────────────────────────────── */}
      <Section id="incident-agent-refusal-section" heading="No agent initiates any of these">
        <div data-testid="incident-agent-refusal" className="space-y-2 text-sm">
          {/* WHAT THE RECORD CARRIES, NOT WHAT THIS BUILD DOES. This paragraph
              used to read "every refusal is written to the audit trail" in the
              present tense. Measured: `refuseAgentInitiation` is called by
              nothing but its own module constant and its tests, `auditRecord`
              is a string with no consumer, no audit sink is reachable from this
              console (the import closure of this route holds none), and there
              is no pause, resume, kill or rollback ACT in this build for a
              refusal to guard. THE BUILD DOES HAVE AUDIT SINKS — twenty-five
              files under `src/studio/` and `app/studio/` write one, and
              `src/studio/modules/stu-06/writes.ts` is headed "THE ONE AUDIT
              PATH" — so "there is no audit sink in this build" would be a
              second false claim in place of the first. The claim is scoped to
              this cluster and this route, which is what the gate now measures
              tree-wide. `TEST-AI-015-7` (L87904)
              requires "refusal and audit", so the obligation is real and
              unmet — and the standing limit is that no production capability
              may be claimed that is only simulated. The obligation is stated,
              the record's contents are stated, and the gap is stated. */}
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            AC-AI-015-7 — &ldquo;No agent can initiate a pause, a resume, a kill, or any
            rollback.&rdquo; All four acts — {STOP_ACTS.join(', ')} — route through one refusal, and
            each refusal record carries the identity, the act and the criterion, because a refusal
            nobody records cannot be told from an attempt that never happened.
            <Locator refs={['L87892', 'L87904']} />
          </p>
          <p
            data-testid="incident-agent-refusal-limit"
            className="max-w-prose text-[var(--color-ink)]"
          >
            What this storyboard does and does not do: it composes the refusal record for every act
            against every agent identity and renders it. This cluster writes no audit trail, and no
            audit sink is reachable from this console — the Studio surfaces carry audit ports of
            their own, and nothing on this route imports one — and there is no pause, resume, kill
            or rollback act here for the refusal to guard. TEST-AI-015-7 asks for refusal{' '}
            <em>and</em> audit; the audit half is owed and is not claimed as built.
            <Locator refs={['L87904']} />
          </p>
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            The identities it is enforced against are the whole agent roster:{' '}
            {AGENT_IDENTITY_COLUMNS.map((identity) => identity.header).join(', ')}. Each is a
            non-human identity answered from its own declared authority, never from whoever is
            looking at this screen.
            <Locator refs={['L99197']} />
          </p>
        </div>
      </Section>

      {/* ── 13. THE WORKFLOW ────────────────────────────────────────── */}
      <Section id="incident-workflow-section" heading="A pause and its resume, step by step">
        <ol className="space-y-2 text-sm">
          {PAUSE_RESUME_WORKFLOW.map((step) => (
            <li key={step.sourceRef} className="text-[var(--color-ink-muted)]">
              {step.text.replaceAll('`', '')}
              <Locator refs={[step.sourceRef]} />
            </li>
          ))}
        </ol>
      </Section>

      {/* ── 14. THE RECOVERY OBJECTIVE, UNSET ───────────────────────── */}
      <Section id="incident-recovery-section" heading="Expected recovery">
        <div
          data-testid="incident-recovery-objective"
          className="space-y-2 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4 text-sm"
        >
          <p className="text-[var(--color-ink)]">
            Not yet set — client decision <span className="font-medium">{airto.id}</span>
          </p>
          <p className="text-[var(--color-ink-muted)]">{airto.buildPosition}</p>
        </div>
      </Section>

      {/* ── 15. THE DECISIONS THIS CONSOLE MAY NOT REGISTER ─────────── */}
      <Section id="incident-decisions-section" heading="Open decisions, disclosed here">
        <div className="space-y-4 text-sm">
          <p className="max-w-prose text-[var(--color-ink-muted)]">
            None of the four below is a member of the decision canon&rsquo;s exported identifier
            union, so none can be handed to the shared disclosure component. They are disclosed here
            instead, with every reading and every locator: a second home for one decision is the
            defect that component exists to prevent, and registering one mid-wave is how the second
            home gets created.
          </p>
          {LOCAL_OPEN_DECISIONS.map((decision) => (
            <article
              key={decision.id}
              data-local-decision={decision.id}
              className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
            >
              <h3 className="font-medium text-[var(--color-ink)]">
                {decision.id} — {decision.question}
              </h3>
              <ul className="mt-2 space-y-1">
                {decision.readings.map((reading) => (
                  <li key={reading.locator + reading.text.slice(0, 24)} className="text-[var(--color-ink-muted)]">
                    {reading.text}
                    <Locator refs={[reading.locator]} />
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[var(--color-ink)]">{decision.buildPosition}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                {decision.whyLocal} {APP_012_LABEL}
              </p>
            </article>
          ))}
        </div>
      </Section>
    </main>
  )
}

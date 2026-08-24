/**
 * THE INCIDENT CONSOLE'S OWN DATA — AND THE ROUTE THAT IS A BUILD DECISION.
 *
 * ── THE ROUTE IS NOT IN THE SOURCE, AND THAT IS MEASURED ───────────────────
 * `grep -n '/super-admin/'` over the frozen source returns ZERO hits, and the
 * string `ai-incidents` occurs nowhere in it. The blueprint carries no URL
 * notation for this surface at all. So `/super-admin/ai-incidents/` is a build
 * decision, rendered as a client-delegated choice under `APP-012` exactly as
 * the six-module scope is. Both greps are re-run by
 * `tests/component/ai-incidents-console.test.tsx` rather than trusted.
 *
 * The SCREEN IDENTIFIERS it carries are source-real, and they are four
 * different spellings across three chapters with no cross-reference between
 * them. All four render with their own locators; none is presented as the
 * canonical one, because the source picks none.
 *
 * ── NO OCCURRENCE RUNS BEHIND THIS SCREEN ─────────────────────────────────
 * There is no incident, so every count renders as unrecorded rather than as a
 * number. This follows `SCR-SA-SCHED-02`'s precedent in
 * `src/surfaces/sa/scheduler/OccurrenceDetailScreen.tsx`: an invented count is
 * indistinguishable from a real one and would be quoted back as the source's.
 * The blast-radius strip therefore names its three fields and states that each
 * is unrecorded.
 *
 * ── AND NO BANNER IS ASSERTED ─────────────────────────────────────────────
 * `SB-43-351` gives the disambiguation banner three possible strings. Picking
 * one would claim an incident classification this build has no incident to
 * classify, so the three render as the vocabulary they are, beside the rule
 * L91227 states for computing them — "A failure showing artificial-intelligence
 * errors on devices that are syncing normally is unambiguously an
 * artificial-intelligence incident" — which is computed rather than judged.
 */

export const INCIDENT_ROUTE = {
  path: '/super-admin/ai-incidents/',
  title: 'Artificial-intelligence incident console',
  sourceStatus:
    'A build decision, not a source fact. The frozen source carries no URL notation for this ' +
    'surface: `/super-admin/` occurs nowhere in it and `ai-incidents` occurs nowhere in it. ' +
    'Rendered as a client-delegated choice under APP-012, exactly as the slice\'s module scope is.',
  whyItIsItsOwnRoute:
    'The storyboard describes ONE screen holding the disambiguation, the blast radius, the health ' +
    'and queue panels, the response controls, the communications panel and the reconciliation ' +
    'checklist. Folding it into a module route would file it under a module identifier the source ' +
    'never assigns it, and no `MOD-SA-*` identifier is minted for it here.',
  storyboard: { id: 'SB-43-351', locator: 'L91276' },
  /**
   * The screen identifiers the source does give this surface. Four spellings,
   * three chapters, no cross-reference — carried together with their locators
   * rather than reduced to one.
   */
  screenIdentifiers: [
    {
      id: 'SCR-SA-PAUSE',
      what: 'Emergency pause, with the fuller field list',
      locator: 'L70933',
    },
    {
      id: 'SCR-SA-PAUSE-01',
      what: 'The pause submission, its critical-class approval, and the paused-tenant list',
      locator: 'L94292',
    },
    {
      id: 'SCR-SA-INCIDENT',
      what: 'The incident view — a record with evidence, communication and closure panels',
      locator: 'L107949',
    },
    {
      id: 'SCR-SA-INCIDENT-01',
      what: 'Platform overview and health, the incident record, and the broadcast composition',
      locator: 'L94374',
    },
  ],
} as const

/**
 * The three banner strings, verbatim from `SB-43-351`. A vocabulary, not a
 * state: none is asserted, because no incident exists to classify.
 */
export const DISAMBIGUATION_BANNERS = [
  {
    text: 'Artificial-intelligence incident — devices are syncing',
    meaning:
      'Connected devices are getting no coaching and the platform acts. The signal comes from ' +
      'provider and agent health.',
  },
  {
    text: 'Connectivity incident — providers are healthy',
    meaning:
      'The floor is working offline and the platform waits. The signal comes from the ' +
      'connectivity-loss protocol at thirty, sixty and one hundred twenty minutes.',
  },
  {
    text: 'Compound incident',
    meaning: 'Both signals are present at once, and both responses are owed.',
  },
] as const

export const DISAMBIGUATION_RULE = {
  sourceRef: 'L91227',
  quotation:
    'A failure showing artificial-intelligence errors on devices that are syncing normally is ' +
    'unambiguously an artificial-intelligence incident.',
  whyItMatters:
    'The two problems have opposite responses, so the console must separate them explicitly. The ' +
    'rule is computed from two signals that already exist independently and is never a judgement ' +
    'the operator makes for the platform.',
} as const

/**
 * The blast-radius strip's three fields. Each states its value as unrecorded:
 * no incident runs behind this prototype and a plausible count is
 * indistinguishable from a real one.
 */
export const BLAST_RADIUS_STRIP_FIELDS = [
  {
    label: 'Tenant',
    what: 'Which tenants the failure reaches',
    value: 'Not recorded — no incident is running behind this screen',
  },
  {
    label: 'Site',
    what: 'Which sites within those tenants',
    value: 'Not recorded — no incident is running behind this screen',
  },
  {
    label: 'Device',
    what: 'How many enrolled devices are affected, drawn from fleet telemetry',
    value: 'Not recorded — no incident is running behind this screen',
  },
] as const

/** The fields `SCR-SA-PAUSE`'s fuller field list names, in its own order. */
export const PAUSE_SCREEN_FIELDS = [
  {
    label: 'Scope selector',
    quotation: 'the scope selector of platform-wide or per tenant',
    note:
      'Two scopes and no third. A site-scoped pause is drawn below, inoperable, under ' +
      'DEC-AIPAUSE-001.',
  },
  {
    label: 'Reason',
    quotation: 'the reason',
    note: 'Mandatory. The confirmation names exactly what will stop and what will continue.',
  },
  {
    label: 'The two authorisations',
    quotation: 'the two authorisations',
    note:
      'A proposal and an approval, never one act. Both live on the platform-settings screen, which ' +
      'already holds them; this console names them rather than building a second pair.',
  },
  {
    label: 'In-flight agent runs that will checkpoint',
    quotation: 'the count of in-flight agent runs that will checkpoint',
    note: 'Not recorded — no agent run is in flight behind this screen.',
  },
  {
    label: 'Raised gate items that remain human-decidable',
    quotation: 'the raised gate items that will remain human-decidable',
    note:
      'They stay decidable throughout. A Quality Manager may still approve, adjust or decline them ' +
      '(L87823).',
  },
  {
    label: 'The on-device deterministic layer is unaffected',
    quotation:
      'an explicit statement that the on-device deterministic layer is unaffected',
    note:
      'Stated explicitly rather than implied. The pause cannot suppress that layer even if someone ' +
      'wanted it to, because it executes inside the version-pinned work package on the device ' +
      '(L87793).',
  },
  {
    label: 'A separate resume control',
    quotation: 'a separate resume control that is its own approved action',
    note: 'Its own approval and its own audit record. No automatic resume exists (AC-AI-015-5).',
  },
] as const

/**
 * The reconciliation close control, and why it is inert for every role
 * including the root.
 *
 * `SB-43-351` gives the checklist "a disabled close control" outright, and
 * `SB-43-101` (L89965) says the page cannot be closed while any reconciliation
 * item is outstanding. The matrix's own close row (L91298) grants the act to
 * the root and the Admin and gives the Platform Engineer "only when
 * reconciliation is complete" — so the gate is the checklist's state, not the
 * operator's role, and with nothing reconciled it is closed to everyone.
 */
export const RECONCILIATION_CLOSE_CONTROL = {
  label: 'Close the incident',
  settingValue: 'Not available',
  reason:
    'The storyboard draws this control disabled, and the incident record cannot be closed while ' +
    'any reconciliation item is outstanding. No reconciliation has been recorded behind this ' +
    'screen, so nothing is outstanding-and-cleared: the control is inert for every role, the root ' +
    'included, because the gate is the checklist rather than the operator.',
  remains:
    'The matrix grants closure to the Root Super Admin and the Admin, and to the Platform Engineer ' +
    'only when reconciliation is complete. That grant is rendered in the response panel; what is ' +
    'withheld here is the act, not the authority.',
  sourceRefs: ['L91276', 'L89965', 'L91298'],
} as const

/**
 * The reconciliation obligations the source names for a pause. Every one is
 * `Not recorded`, and the checklist says so rather than showing an empty list —
 * an empty checklist reads as "nothing to do".
 */
export const RECONCILIATION_ITEMS = [
  {
    item: 'Every parked run is accounted for as resumed, replayed, or explicitly abandoned with a record',
    state: 'Not recorded — no run is parked behind this screen',
    sourceRef: 'L87878',
  },
  {
    item: 'Parked runs are listed; none resume automatically',
    state: 'Not recorded — no run is parked behind this screen',
    sourceRef: 'L90543',
  },
  {
    item: 'Agent activation count during the pause, which must be zero',
    state: 'Not recorded — no pause is in force behind this screen',
    sourceRef: 'L87878',
  },
] as const

/** What the communications panel is for, and what it may not carry. */
export const COMMUNICATIONS_PANEL = {
  what:
    'Drafted, scheduled and sent tenant communications about the incident, with their approval ' +
    'state. An all-tenant broadcast is critical class and the root approves it (L91295).',
  whatItMayNotCarry:
    'No operational content. A communication naming a lot, a measurement or a worker would put ' +
    'tenant operational data on this console, which L91276 and L91296 both forbid.',
  sourceRefs: ['L91276', 'L91295', 'L107949'],
} as const

/** The access-class rule, which is what makes the absence above deliberate. */
export const ACCESS_CLASS_RULE = {
  quotation:
    'No operational content appears anywhere, and reaching any is a separate, audited, ' +
    'session-scoped act under one of the three named access classes.',
  everyRole:
    'Conditional for EVERY role, the Root Super Admin included: the matrix row reads `Allowed ' +
    'with conditions — only under a named access class` in all four cells, and Support\'s adds ' +
    'read-only and time-boxed. There is no cell on that row that grants it outright.',
  sourceRefs: ['L91276', 'L91296', 'L91220'],
} as const

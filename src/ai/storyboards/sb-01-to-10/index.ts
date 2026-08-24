import type { Storyboard } from '@/ai/storyboards/contract'
import { affected, noEffect } from '@/ui/shared/journey'

/**
 * STORYBOARDS 44A.1 TO 44A.10, AS DATA. TEN CARDS, NOTHING ELSE.
 *
 * Task 15A owns the shape, the compound fallback key, the nine render-time
 * invariants and the chapter-level criteria. This module supplies content for
 * ten of the thirty and declares no type of its own beyond the exported array.
 * The section's own head says why the shape is not redeclared here, at L92648:
 * a rule stated once is a rule interpreted differently by every reader, and
 * three tasks reading six prose prohibitions produce three interpretations.
 *
 * ── HOW EACH CARD WAS READ, SO A REVIEWER CAN READ IT THE SAME WAY ──────────
 * Every card header sits exactly two lines above its own `Identifier` row, and
 * that row is where the source writes `SB-AI-NN`. So each card below is
 * anchored on the identifier row rather than on the header — an off-by-one on a
 * header lands on a blank line or the separator and still looks right. The
 * nineteen body rows run from the identifier row to sixteen lines below it, and
 * the five-surface table's five body rows sit two to six lines below its own
 * header. Counted from the header down, one card at a time, for all ten:
 * nineteen and five every time, with the same field tuple and the same surface
 * tuple. Zero deviations in twenty tables.
 *
 * ── THE FIELD TEXT IS TRANSCRIBED, NOT SUMMARISED ──────────────────────────
 * Each of the nineteen strings is the source's own cell. That is why the
 * decision identifiers appear inside the prose: the source puts them there, and
 * `DEC-AIRTO-001` IS the whole content of four of these cards' recovery
 * objective rows. `./decisions.ts` discloses all eleven identifiers these ten
 * name, seven of them locally because they are not members of the exported
 * `DecisionId` union.
 *
 * ── FIVE-SURFACE CELLS: WHEN AN ARM IS ABSENT ──────────────────────────────
 * A cell is recorded as `noDirectEffect` only where the cell's WHOLE claim is
 * that the surface does nothing in this storyboard, with the rest of the cell
 * as the reason — five of the fifty cells read that way. A cell describing a
 * deferred act ("no change until reconnection; then files the signal") is an
 * effect that has not happened yet, not an absence, so it is recorded as
 * `affected` with the cell verbatim. Recording those as absences would have
 * produced a card claiming the Hub never files the help-request signal.
 *
 * ── WHERE A FIELD RECORDS A DISJUNCTION AND `facts` CANNOT ─────────────────
 * Several cards state a final official state as a disjunction — "the step is
 * complete with valid proof, or parked" — while `StoryboardRenderFacts` wants
 * one value per fact. Where that happens the branch taken is the card's own
 * SAFE STOP, because the safe stop is the terminal state where nothing further
 * is attempted, and the prose row keeps the disjunction verbatim. Each such
 * choice is commented at its card with the line it was read from.
 *
 * ── NO FIXED WORKER MESSAGE IS DECLARED, AND THAT IS A MEASUREMENT ─────────
 * `facts.fixedMessages` is empty on all ten. The invariant it feeds is keyed on
 * `PINNED_WORKER_MESSAGES`, which pins one screen — `SCR-FL-LOCK-01`, whose
 * wording the source fixes and whose paraphrase it prohibits at L94876, in
 * storyboard 25 and not in these ten. These ten quote worker-facing wording
 * verbatim in their `Worker-visible experience` rows, and the source writes no
 * paraphrase prohibition and no Spanish string for any of it. Declaring one of
 * those quotations as a `StoryboardFixedMessage` would report a fixed message
 * against no pinned wording, which is a violation this task would be inventing.
 * The gap is real and it is `TEST-44A-004`'s (L92757) subject: the Spanish half
 * of every worker-facing message set in these ten is a client-supplied input.
 *
 *
 * ── THE RENDERED TEXT CARRIES NO MARKUP, AND THE NAME IS THE CELL ──────────
 * Three decisions taken in the slice-11 audit round, enforced for all thirty
 * cards by `tests/unit/ai-storyboard-contract-invariants.test.ts`:
 *
 * 1. `finalOfficialState.name` is a TRANSCRIPTION of the card's own
 *    `content.finalOfficialState` cell, not a restatement of it. Seven of the
 *    thirty had drifted — three dropped a `[SoW Fact — §N]` attribution, three
 *    rewrote a sentence break, and storyboard 23 turned the source's standing
 *    guarantee "reaches the platform intact" (L94677) into the past-tense claim
 *    "reached". All seven are restored verbatim rather than relabelled derived,
 *    because a field presented as the source's words has to be the source's
 *    words; the gate now asserts byte equality on all thirty.
 * 2. NO MARKDOWN IN ANY RENDERED STRING. `src/ui/shared/StoryboardCard.tsx`
 *    prints text — no renderer, no `dangerouslySetInnerHTML` — so `**not**`
 *    reached the reader as four asterisks and a backtick reached it as a grave
 *    accent. Backticks and `**` are stripped from every rendered field,
 *    including the two that transcribe the source's own emphasis: asterisks on
 *    screen tell a reader this build failed to render markdown, which is a
 *    worse loss than the emphasis. Same rule the contract already applies to
 *    `STORYBOARD_CARD_CLASSIFICATION` at L92766.
 * 3. AN AUDIT `sourceRef` MUST CARRY THE WHOLE STATEMENT. Where one line did
 *    not, the event is re-pointed to the line that does, or split into two
 *    events with one exact line each. Every such change is commented at its
 *    own event with what the old line did and did not say.
 * This module is data. It computes nothing and decides nothing.
 */

/* ====================================================================
 * 44A.1 — WORKER ASKS ARTIFICIAL INTELLIGENCE WHILE OFFLINE.
 * Section L92772-L92853. Card rows L92793-L92811. Surfaces L92817-L92821.
 * Acceptance `AC-44A-01-1`..`-5` at L92849; tests `TEST-44A-01-1`..`-4` at
 * L92851 — five and four, counted from the prose lines themselves.
 * ==================================================================== */

const SB_AI_01: Storyboard = {
  number: 1,
  identifier: 'SB-AI-01',
  fallback: { chapter: '44A.1', identifier: 'FB-AI-01' },
  cardHeaderRef: 'L92791',
  surfaceTableRef: 'L92815',
  content: {
    identifier: 'SB-AI-01; fallback contract FB-AI-01; extends FB-AGT-PREV-01',
    preconditions:
      'TAB-014 offline in the far bay; RUN-2026-08-14-A in progress on pinned v2.1.0; the '
      + 'question channel exists under DEC-ASK-001',
    trigger: 'The worker invokes the help control while the device is offline',
    actorsAndRoles:
      'Maya, Worker (ROLE-TEN-WKR); no other actor participates at the time',
    workerVisibleExperience:
      'Work Instructions expand; status line reads "Offline. Step instructions are shown. Your '
      + 'request for help has been saved and will be sent when this tablet reconnects."',
    automaticFallback:
      "Render the step's authored Work Instructions at the profile difficulty level; queue the "
      + 'request as an operational event',
    manualFallback:
      'The worker consults the printed or in-package instruction detail, or raises a step-away '
      + 'flag and finds the Supervisor physically',
    fallbackOfFallback:
      'Where the profile difficulty level is absent from the package, render the standard level '
      + 'and record a package-completeness defect [DEC-WIDIFF-001]',
    safeStop:
      'The step remains incomplete with its gate unpassed; the worker moves to another assigned '
      + 'run rather than advancing without proof',
    localData: 'One queued help-request event; no answer record; no partial answer',
    centralData: 'Nothing until reconnection; the platform has no knowledge of the request',
    notifications:
      'None at the time. A single request is not a pattern and does not alert the Supervisor '
      + '[SoW Fact — §7.12]',
    reconnection:
      'The request uploads and is recorded against its step execution with both timestamps',
    conflictResolution: 'None arises; a request is additive and conflicts with nothing',
    finalOfficialState:
      'Step execution proceeds or parks on its authored terms; one recorded help-request signal '
      + 'attached to it',
    audit: 'Help request created offline; upload; reconciliation. Three audit events',
    recoveryObjectives: 'TBD — Client Decision Required — DEC-AIRTO-001',
    residualRisk:
      'A worker who asked and got only static text may stop asking, so the signal decays exactly '
      + 'where guidance is weakest',
    sourceStatus:
      'User-Mandated Product Extension — DEC-ASK-001; the fallback target is SoW Fact — '
      + '§7.12',
  },
  surfaces: {
    DOH: affected(
      'No change until reconnection; then files the help-request signal against the step '
        + 'execution as part of the official record',
      'L92817',
    ),
    STU: affected(
      'No change; after reconnection the signal contributes to instruction-review candidates for '
        + "the screen's author",
      'L92818',
    ),
    CC: affected(
      'No change at the time; the device shows in the sync-state module under its last-contact '
        + 'freshness class',
      'L92819',
    ),
    FL: affected(
      'Work Instructions expand; honest offline status line; request queued durably',
      'L92820',
    ),
    SA: noEffect('the request never reached the platform', 'L92821'),
  },
  // The audit row names three events and says so: "Three audit events".
  audit: [
    {
      id: 'help-request-created-offline',
      statement:
        'Help request created offline, carrying the step-definition reference, the run and job '
        + 'identifiers, the device identity, the worker identity and the device timestamp.',
      sourceRef: 'L92786',
    },
    {
      id: 'upload',
      statement:
        'The request uploads at reconnection as a signal, not converted into a live answer.',
      sourceRef: 'L92788',
    },
    {
      id: 'reconciliation',
      statement:
        'The request is recorded against its step execution with both the device timestamp and '
        + 'the server-receipt timestamp.',
      sourceRef: 'L92805',
    },
  ],
  finalOfficialState: {
    name:
      'Step execution proceeds or parks on its authored terms; one recorded help-request signal '
      + 'attached to it',
    // Creation establishes the signal exists and where; the upload establishes
    // it was never answered; reconciliation establishes what it is attached to.
    // Those three and nothing else identify the state.
    derivedFrom: ['help-request-created-offline', 'upload', 'reconciliation'],
  },
  absentCapability: {
    statement:
      'This storyboard presumes a worker-initiated question channel, which the Statement of Work '
      + 'does not describe. Under DEC-ASK-001 option (a) there is no button and this storyboard '
      + "reduces to section 44.1's coaching-unavailable behaviour.",
    sourceRef: 'L92778',
  },
  facts: {
    // No command is issued to any device in this storyboard.
    deviceAcknowledgement: 'noDeviceCommand',
    surfacesShowingApplied: [],
    contentOrigin: 'authored',
    inference: 'noInference',
    // Safe stop: the gate is unpassed and the step parks.
    gateOutcome: 'unpassed',
    stateNamesShown: ['offline', 'queued', 'recorded'],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    connectivity: 'knownOffline',
    // L92843 rules out both against a known-offline state.
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: {
      specificationGate: 'unchanged',
      evaluationGate: 'unchanged',
      qualificationGate: 'unchanged',
      severityOneHold: 'unchanged',
    },
    aiActs: [],
  },
}

/* ====================================================================
 * 44A.2 — WORKER ONLINE BUT CLOUD ARTIFICIAL INTELLIGENCE IS DOWN.
 * Section L92855-L92938. Card rows L92876-L92894. Surfaces L92900-L92904.
 * Acceptance five at L92934; tests four at L92936.
 * ==================================================================== */

const SB_AI_02: Storyboard = {
  number: 2,
  identifier: 'SB-AI-02',
  fallback: { chapter: '44A.2', identifier: 'FB-AI-02' },
  cardHeaderRef: 'L92874',
  surfaceTableRef: 'L92898',
  content: {
    identifier:
      'SB-AI-02; fallback contract FB-AI-02; extends FB-AGT-PREV-01 and FB-AGT-DEV-01',
    preconditions:
      'TAB-014 online with healthy sync; the reasoning layer unavailable or paused',
    trigger:
      'A coaching opportunity, a deviation brief request, or a scheduled handoff assembly fails '
      + 'against a healthy network',
    actorsAndRoles:
      'Maya, Worker; Sam, Supervisor; Daniel, Platform Engineer, on the diagnosis side',
    workerVisibleExperience:
      '"Coaching help is unavailable. Step instructions are shown." The offline indicator is '
      + 'not shown, because the tablet is not offline',
    automaticFallback:
      'Curated default asset, then authored Work Instructions; circuit breaker opens after the '
      + 'configured consecutive failures',
    manualFallback:
      "The worker requests help from the Supervisor through the run player's help path; the "
      + 'Supervisor works from the deterministic record in the Command Center',
    fallbackOfFallback:
      "Where the Supervisor is also unreachable, the escalation record's nobody-on-shift default "
      + 'applies [DEC-NOSHIFT-001]',
    safeStop:
      'Work continues under authored instructions with every gate intact; no step advances '
      + 'without its proof',
    localData:
      'Coaching-opportunity events, fallback-used events, and failure counters, all queued or '
      + 'uploaded normally',
    centralData:
      'Agent failure events; per-agent health metrics; platform incident record where more than '
      + 'one tenant is affected [SoW Fact — §8.1.3]',
    notifications:
      'No worker notification beyond the status line; the Command Center panel state; platform '
      + 'operations notified [SoW Fact — §6.9.3]',
    reconnection:
      'Not applicable — the device never lost connectivity; recovery is the reasoning layer '
      + 'returning, detected by the breaker probe',
    conflictResolution: 'None arises; no competing state is created',
    finalOfficialState:
      'The run proceeds and completes on deterministic behaviour, with recorded evidence that '
      + 'agent assistance was unavailable for a stated window',
    audit: 'Degradation entry, each fallback render, breaker open and close, degradation exit',
    recoveryObjectives: 'TBD — Client Decision Required — DEC-AIRTO-001',
    residualRisk:
      'Sustained degradation with healthy connectivity erodes worker trust in every platform '
      + 'message, not only the coaching one',
    sourceStatus:
      'Honest degradation display is SoW Fact — §6.9.3, §8.7.5; the circuit breaker is '
      + 'Recommendation — R&D under DEC-AIRETRY-001',
  },
  surfaces: {
    DOH: affected(
      'Records agent-unavailability events on the tenant audit log; every operational record '
        + 'continues normally',
      'L92900',
    ),
    STU: affected(
      'Authoring and publication unaffected; the agent on or off state is displayed accurately, '
        + 'distinguishing configured-off from unavailable',
      'L92901',
    ),
    CC: affected(
      'Agent activity panel shows the honest degradation or platform-pause state; deviation '
        + 'workspaces render deterministic records without briefs',
      'L92902',
    ),
    FL: affected(
      'Curated default or Work Instructions render; the coaching-unavailable line appears; the '
        + 'offline indicator does not',
      'L92903',
    ),
    SA: affected(
      'Per-agent health flags; multi-tenant incident form where applicable; owns diagnosis and '
        + 'any emergency pause or resume',
      'L92904',
    ),
  },
  audit: [
    {
      id: 'degradation-entry',
      statement: 'The degradation is entered and recorded with its start time.',
      sourceRef: 'L92891',
    },
    {
      id: 'fallback-render',
      statement:
        'Each fallback render is recorded — the curated default asset, or the authored Work '
        + 'Instructions where no curated default exists for the screen and locale.',
      sourceRef: 'L92868',
    },
    {
      id: 'breaker-open',
      statement:
        'The circuit breaker opens after the configured consecutive failures and the device stops '
        + 'calling the reasoning layer.',
      // C-40. This cited L92891, the card's own Audit row, which names
      // "breaker open and close" and states NEITHER the threshold nor that the
      // device stops calling. L92861 is the only line in the section that
      // carries both clauses: "after the configured number of consecutive
      // failures the device stops calling and shows the unavailable state
      // immediately". L92881 (Automatic fallback) restates the threshold alone
      // — "circuit breaker opens after the configured consecutive failures" —
      // so it would leave the second clause uncited.
      sourceRef: 'L92861',
    },
    {
      id: 'breaker-close',
      statement:
        'A single probe after the cooling interval succeeds and the breaker closes; the next '
        + 'coaching opportunity uses the primary path.',
      sourceRef: 'L92872',
    },
    {
      id: 'degradation-exit',
      statement: 'The degradation is exited and recorded, closing the stated window.',
      sourceRef: 'L92891',
    },
  ],
  finalOfficialState: {
    name:
      'The run proceeds and completes on deterministic behaviour, with recorded evidence that '
      + 'agent assistance was unavailable for a stated window',
    // Entry and exit bound the stated window; the fallback renders are the
    // recorded evidence of what the worker received in it.
    derivedFrom: ['degradation-entry', 'fallback-render', 'degradation-exit'],
  },
  absentCapability: {
    statement:
      'The circuit breaker\'s consecutive-failure count and cooling period are both not '
      + 'specified in the Statement of Work and are carried under DEC-AIRETRY-001. The '
      + 'breaker itself is a Recommendation — R&D, and no value for either is seeded here.',
    sourceRef: 'L92861',
  },
  facts: {
    deviceAcknowledgement: 'noDeviceCommand',
    surfacesShowingApplied: [],
    // The curated default asset travels inside the pinned work package.
    contentOrigin: 'packaged',
    // The reasoning layer returned an explicit unavailable response. Nothing
    // was inferred about the work, and no gate outcome depends on the agent.
    inference: 'noInference',
    gateOutcome: 'passed',
    stateNamesShown: [
      'coaching help is unavailable',
      'honest degradation',
      'agents paused by the platform',
      'breaker open',
    ],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    // The distinguishing fact of this storyboard: connectivity is healthy.
    connectivity: 'online',
    // L92928 rules out all three: no retry control, no spinner, no countdown.
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: {
      specificationGate: 'unchanged',
      evaluationGate: 'unchanged',
      qualificationGate: 'unchanged',
      severityOneHold: 'unchanged',
    },
    aiActs: [],
  },
}

/* ====================================================================
 * 44A.3 — LOCAL ARTIFICIAL INTELLIGENCE UNAVAILABLE BUT CACHED GUIDANCE
 * EXISTS. Section L92940-L93018. Card rows L92960-L92978. Surfaces
 * L92984-L92988. Acceptance five at L93014; tests four at L93016.
 * ==================================================================== */

const SB_AI_03: Storyboard = {
  number: 3,
  identifier: 'SB-AI-03',
  fallback: { chapter: '44A.3', identifier: 'FB-AI-03' },
  cardHeaderRef: 'L92958',
  surfaceTableRef: 'L92982',
  content: {
    identifier: 'SB-AI-03; fallback contract FB-AI-03; conditional on DEC-LOCALAI-001',
    preconditions:
      'TAB-014 offline or the reasoning layer unreachable; the pinned v2.1.0 package carries '
      + "the screen's curated default for es-MX",
    trigger:
      'A local capability fails its check, or no local capability exists and the server is '
      + 'unreachable',
    actorsAndRoles: 'Maya, Worker; Daniel, Platform Engineer, for fleet-level integrity failures',
    workerVisibleExperience:
      'The curated default asset renders with the "Standard guidance for this step" label. No '
      + "error dialog appears; a failed helper is not the worker's problem to solve",
    automaticFallback:
      "Curated default asset from the pinned package for the worker's exact locale",
    manualFallback:
      'Authored Work Instructions, reachable by the worker at any time from the step',
    fallbackOfFallback:
      "Where the curated default is absent for the worker's locale, the authored Work "
      + 'Instructions render and a locale-completeness defect is recorded against the package, '
      + 'because publication should have blocked on an incomplete locale [SoW Fact — §1.7, §5.17]',
    safeStop: 'Work continues under approved guidance with all gates intact',
    localData: 'Curated asset identity; package version; failure reason; render event',
    centralData: 'Nothing until sync; then the failure record and the fallback-used event',
    notifications:
      "None to the worker beyond the label; a fleet flag to the client's platform team on an "
      + 'integrity failure',
    reconnection:
      'Records upload; repeated failures across devices aggregate into a fleet signal',
    conflictResolution:
      'None arises; the curated default is authoritative for its own screen and locale by '
      + 'construction',
    finalOfficialState:
      'Step completed or parked on its authored terms; the record shows which guidance the worker '
      + 'actually saw',
    audit: 'Local-capability failure; fallback selection with asset identity; fleet flag where raised',
    recoveryObjectives: 'TBD — Client Decision Required — DEC-AIRTO-001',
    residualRisk:
      'A curated default is generic by design; a floor running on curated defaults for weeks is '
      + 'receiving materially less prevention than the design intends, and only the fallback-rate '
      + 'metric will show it',
    sourceStatus:
      'Curated default is SoW Fact — §5.2.1; local capability is User-Mandated Product '
      + 'Extension — DEC-LOCALAI-001',
  },
  surfaces: {
    DOH: affected(
      'Records the fallback-used event and the rendered asset identity against the step execution',
      'L92984',
    ),
    STU: affected(
      "The curated default's author can see how often it is being used as a fallback, which is a "
        + 'direct input to whether it is good enough',
      'L92985',
    ),
    CC: affected(
      'The agent activity panel shows reduced activation counts; a per-device flag where the '
        + 'failure is an integrity failure',
      'L92986',
    ),
    FL: affected(
      'Curated default renders under its provenance label; no error dialog; no retry control',
      'L92987',
    ),
    SA: affected(
      "Fleet view flags affected devices; the client's platform team owns diagnosis and any "
        + 'artifact redistribution',
      'L92988',
    ),
  },
  audit: [
    {
      id: 'local-capability-failure',
      statement:
        'The local capability failed an integrity, version or execution check, and the failure '
        + 'reason is recorded.',
      sourceRef: 'L92951',
    },
    {
      id: 'fallback-selection',
      statement:
        "The curated default for this screen and the worker's exact locale was selected and "
        + 'rendered, with its asset identity and the pinned package version recorded.',
      sourceRef: 'L92954',
    },
    {
      id: 'fleet-flag',
      statement:
        'Where the failure is an integrity failure, the device flags itself in the fleet view for '
        + 'attention rather than retrying, because an integrity failure is not transient.',
      sourceRef: 'L92955',
    },
  ],
  finalOfficialState: {
    name:
      'Step completed or parked on its authored terms; the record shows which guidance the worker '
      + 'actually saw',
    // The failure record says why the fallback ran; the selection record is
    // what "which guidance the worker actually saw" resolves to.
    derivedFrom: ['local-capability-failure', 'fallback-selection'],
  },
  absentCapability: {
    statement:
      'Not specified in the Statement of Work. The Statement of Work places the reasoning '
      + 'layer server-side and online-only [SoW Fact — §7.9.1, layer (c)]; there is no local '
      + 'artificial intelligence at V1. This storyboard is therefore conditional on '
      + 'DEC-LOCALAI-001, and its behaviour is written so that it is correct under option (a) '
      + '— no local model — with the local-capability language marked conditional.',
    sourceRef: 'L92946',
  },
  facts: {
    deviceAcknowledgement: 'noDeviceCommand',
    surfacesShowingApplied: [],
    contentOrigin: 'packaged',
    // The local capability failed a check on ITSELF. Nothing was inferred
    // about the work and no gate outcome depends on the capability.
    inference: 'noInference',
    // Safe stop: work continues under approved guidance with all gates intact.
    // The final official state's "completed or parked" disjunction is kept
    // verbatim in the prose row above.
    gateOutcome: 'passed',
    stateNamesShown: ['standard guidance for this step', 'integrity failure'],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    // The precondition offers two readings — the device offline, or the
    // reasoning layer unreachable. `knownOffline` is the stricter of the two
    // and the theatre check binds under it; the card renders neither a spinner
    // nor a retry control either way.
    connectivity: 'knownOffline',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: {
      specificationGate: 'unchanged',
      evaluationGate: 'unchanged',
      qualificationGate: 'unchanged',
      severityOneHold: 'unchanged',
    },
    aiActs: [],
  },
}

/* ====================================================================
 * 44A.4 — NO ARTIFICIAL INTELLIGENCE AND NO CACHED GUIDANCE.
 * Section L93020-L93103. Card rows L93041-L93059. Surfaces L93065-L93069.
 * Acceptance five at L93099; tests four at L93101.
 * ==================================================================== */

const SB_AI_04: Storyboard = {
  number: 4,
  identifier: 'SB-AI-04',
  fallback: { chapter: '44A.4', identifier: 'FB-AI-04' },
  cardHeaderRef: 'L93039',
  surfaceTableRef: 'L93063',
  content: {
    identifier: 'SB-AI-04; fallback contract FB-AI-04',
    preconditions:
      'No agent reachable; no curated default for this screen and locale; RUN-2026-08-14-A on '
      + 'pinned v2.1.0',
    trigger: 'A coaching opportunity or help request with no guidance source available',
    actorsAndRoles:
      'Maya, Worker; Sam, Supervisor, as the manual escalation target; the screen\'s Studio '
      + 'author as the eventual owner of the gap',
    workerVisibleExperience:
      'Work Instructions at full height, or where absent, the step\'s criteria and proof '
      + 'requirements with "Ask your supervisor for help with this step."',
    automaticFallback:
      'Authored Work Instructions at the profile level, then the standard level',
    manualFallback:
      'The worker raises a step-away flag and asks the Supervisor; the Supervisor is on the floor '
      + 'or reachable through the escalation record',
    fallbackOfFallback:
      "Where the Supervisor is unreachable, the nobody-on-shift default routes to the tenant's "
      + 'Quality Manager role, marked as a fallback delivery [DEC-NOSHIFT-001]',
    safeStop:
      'The step parks; the worker continues other assigned runs; nothing advances without the '
      + 'authored proof',
    localData: 'Content-gap event; step-away flag where raised; the parked step state',
    centralData: 'Content-gap event against the screen and workflow version after sync',
    notifications:
      'The step-away escalation reaches the Supervisor per the escalation record; the content gap '
      + 'reaches the author as an authoring signal, not an alert',
    reconnection:
      "Events upload; the content gap joins the Studio's instruction-review candidates",
    conflictResolution: 'None arises; absence conflicts with nothing',
    finalOfficialState:
      'The step is complete with valid proof, or parked. It is never complete without proof',
    audit: 'Content-gap event; step-away flag; escalation; any parking and resumption',
    recoveryObjectives:
      'Not applicable — this is an authoring gap, not a service outage. The remedy is a '
      + 'republished workflow version, which follows the Studio approval chain',
    residualRisk:
      "A step with no authored instruction in a worker's language is a publication defect that "
      + 'reached production; the locale-completeness check exists to prevent it and its coverage '
      + 'must be verified',
    sourceStatus:
      'The guarantee is SoW Fact — §7.12; the empty-content path is Derived Clarification',
  },
  surfaces: {
    DOH: affected(
      'Records the content-gap event and any parked state; the run record remains accurate about '
        + 'what was and was not completed',
      'L93065',
    ),
    STU: affected(
      "The gap surfaces to the screen's author as an instruction-review candidate; the fix is a "
        + 'republish through Author, Reviewer, Release Authority [SoW Fact — §5.11.1]',
      'L93066',
    ),
    CC: affected(
      'The step-away escalation appears on the alert feed; the parked run appears on the live '
        + 'shift board with its honest state',
      'L93067',
    ),
    FL: affected(
      'Instructions or criteria render; the help direction to the Supervisor appears; the gate is '
        + 'unchanged',
      'L93068',
    ),
    SA: noEffect(
      'this is a tenant authoring gap, not a platform fault, and the console does not intervene '
        + 'in tenant content',
      'L93069',
    ),
  },
  audit: [
    {
      id: 'content-gap',
      statement:
        'The absence is recorded as a content-gap event against the screen and the workflow '
        + 'version, which is an authoring defect rather than a runtime one.',
      sourceRef: 'L93036',
    },
    {
      id: 'step-away-flag',
      statement: 'The step-away flag is raised where the worker raises one.',
      sourceRef: 'L93050',
    },
    {
      // C-40, SPLIT. One event asserted both routes and cited L93048, the
      // Fallback-of-fallback row, which states only the second. The primary
      // route is a different row, L93052, so a reader opening the citation
      // found no Supervisor in it. Two events, one line each.
      id: 'escalation',
      statement:
        'The step-away escalation reaches the Supervisor per the escalation record.',
      sourceRef: 'L93052',
    },
    {
      id: 'escalation-fallback-route',
      statement:
        'Where the Supervisor is unreachable, the nobody-on-shift default routes to the '
        + "tenant's Quality Manager role, marked as a fallback delivery.",
      sourceRef: 'L93048',
    },
    {
      id: 'parking-and-resumption',
      statement:
        'The step parks and any resumption is recorded; the worker continues other assigned runs '
        + 'in the meantime.',
      sourceRef: 'L93049',
    },
  ],
  finalOfficialState: {
    name: 'The step is complete with valid proof, or parked. It is never complete without proof',
    // The parking event names the terminal the safe stop reaches; the
    // content-gap event is why it was reached. Together they identify the
    // state without reading the card.
    derivedFrom: ['content-gap', 'parking-and-resumption'],
  },
  absentCapability: {
    statement:
      'The trigger of this storyboard includes a help request the worker makes under '
      + 'DEC-ASK-001, a worker-initiated question channel the Statement of Work does not '
      + "describe. §44A's own head names storyboards 1, 3, 4 and 21 as the four the admission "
      + 'governs.',
    sourceRef: 'L93030',
  },
  facts: {
    deviceAcknowledgement: 'noDeviceCommand',
    surfacesShowingApplied: [],
    // Not `statedAbsence`: what renders is authored — the step's own
    // specification limits, proof requirements and inspection criteria, which
    // are always present because the gate cannot function without them.
    contentOrigin: 'authored',
    inference: 'noInference',
    // The safe stop: the step parks and nothing advances without the authored
    // proof. The prose row keeps the "complete with valid proof, or parked"
    // disjunction verbatim.
    gateOutcome: 'unpassed',
    stateNamesShown: ['parked', 'content gap', 'step-away flag raised'],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    // The precondition says no agent is reachable and does not say the device
    // is offline, so connectivity is not established either way.
    connectivity: 'unknown',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: {
      specificationGate: 'unchanged',
      evaluationGate: 'unchanged',
      qualificationGate: 'unchanged',
      severityOneHold: 'unchanged',
    },
    aiActs: [],
  },
}

/* ====================================================================
 * 44A.5 — SEVERITY 1 DEVIATION WHILE ARTIFICIAL INTELLIGENCE IS UNAVAILABLE.
 * Section L93105-L93195. Card rows L93129-L93147. Surfaces L93153-L93157.
 * Acceptance SIX at L93191 — `AC-44A-05-1` to `-6`, counted from the prose
 * line; tests FIVE at L93193. Neither is the chapter's four-and-five default.
 * ==================================================================== */

const SB_AI_05: Storyboard = {
  number: 5,
  identifier: 'SB-AI-05',
  fallback: { chapter: '44A.5', identifier: 'FB-AI-05' },
  cardHeaderRef: 'L93127',
  surfaceTableRef: 'L93151',
  content: {
    identifier: 'SB-AI-05; fallback contract FB-AI-05; extends FB-AGT-DEV-01',
    preconditions:
      'TAB-014 offline; reasoning layer paused; RUN-2026-08-14-A on pinned v2.1.0; '
      + "LOT-WB-2291 in use by TAB-014 and by Ahmed's device",
    trigger: 'A capture classifying into Severity 1 on-device',
    actorsAndRoles:
      'Maya, Worker; Sam, Supervisor; Elena, Quality Manager — the only person who can release',
    workerVisibleExperience:
      'The deterministic verdict panel, then the non-dismissible hold band naming LOT-WB-2291, '
      + 'then the containment checklist. A status line reads "This deviation is recorded on this '
      + 'tablet. It will reach your supervisor when this tablet reconnects."',
    automaticFallback:
      'Not applicable to the safety path — there is no fallback because there is no dependency. '
      + 'The agent brief has the fallback of the deterministic record render',
    manualFallback:
      'The Supervisor works from the deterministic record; prior cases are reachable manually '
      + 'through the anomaly register',
    fallbackOfFallback:
      'Where the Command Center is itself unavailable, the Delivery Operations Hub record remains '
      + 'authoritative and readable',
    safeStop:
      'The lot stays held; the run is blocked pending Quality Manager disposition; the worker '
      + 'continues other assigned runs where permitted',
    localData:
      'Capture; deviation record; hold; checklist completions; evidence; queued escalation — all '
      + 'committed locally before any network attempt',
    centralData:
      'Nothing until sync; then the mirrored classification, the deviation record, the '
      + 'propagating hold, and the escalation',
    notifications:
      'None until sync. The hold does not depend on any notification, which is exactly why the '
      + 'design is safe',
    reconnection:
      'Captures walk their full state chain; the escalation delivers; propagation begins and is '
      + 'displayed per device',
    conflictResolution:
      "If the server's mirror computation differs from the device's classification, the device "
      + 'wins and a divergence flag is raised; the server never re-triggers [SoW Fact — §3.3, '
      + '§7.9.2]',
    finalOfficialState:
      'Severity 1 deviation officially recorded; Critical anomaly auto-entered in the Anomaly '
      + 'Register with its containment record [SoW Fact — §3.3]; hold in force; released only by '
      + 'the Quality Manager after disposition',
    audit:
      'Capture, classification, hold placement, each checklist item, escalation queue and '
      + 'delivery, mirror, propagation confirmations, disposition, release',
    recoveryObjectives:
      'Not applicable to the hold, which has no recovery objective because it never fails. For '
      + 'brief assembly, TBD — Client Decision Required — DEC-AIRTO-001',
    residualRisk:
      'Sibling devices working the same lot continue until their next sync; this is disclosed '
      + 'rather than hidden, and propagation lag is metered',
    sourceStatus:
      'SoW Fact throughout the safety path — §3.3, §3.4, §7.9.2, §7.9.3, §8.3.3',
  },
  surfaces: {
    DOH: affected(
      'On sync, files the deviation as the official record; auto-enters the Critical anomaly with '
        + 'its containment record; records the hold and every propagation confirmation',
      'L93153',
    ),
    STU: noEffect(
      'the authored limits, banding, and checklist that produced this outcome are exactly as '
        + 'published in v2.1.0',
      'L93154',
    ),
    CC: affected(
      'Deviation workspace renders the deterministic record with the honest no-brief banner; hold '
        + 'shown as issued, then propagating with a named per-device list, then in force; release '
        + 'control present only for the Quality Manager',
      'L93155',
    ),
    FL: affected(
      'Verdict, hold band, containment checklist, evidence capture, honest queue-state line — '
        + 'all offline',
      'L93156',
    ),
    SA: affected(
      'Hold-propagation lag recorded as telemetry; agent health flag for the absent brief',
      'L93157',
    ),
  },
  // The audit row names ten classes of event. Escalation queue and escalation
  // delivery are recorded separately because `AC-44A-05-4` (L93191) requires
  // the delivery time to be recorded separately from the origin time.
  audit: [
    {
      id: 'capture',
      statement:
        'The capture of 38.0 Newton metres on RB-0011 commits to the device\'s durable store '
        + 'before evaluation.',
      sourceRef: 'L93115',
    },
    {
      // C-40, SPLIT. One event carried the measured departure AND the
      // classification and cited L93117, which is the classification step
      // alone: a reader opening it found no 13.6 per cent anywhere. The number
      // is the source's own, at L93116, the step before.
      id: 'limits-evaluation',
      statement:
        'The device evaluates against the pinned limits: out of specification, 13.6 per cent '
        + 'below the lower limit.',
      sourceRef: 'L93116',
    },
    {
      id: 'classification',
      statement: 'The device classifies into Severity 1 under the authored banding.',
      sourceRef: 'L93117',
    },
    {
      id: 'hold-placement',
      statement: 'The device places the hold on LOT-WB-2291 immediately and locally.',
      sourceRef: 'L93118',
    },
    {
      id: 'checklist-item',
      statement:
        'Each item of the configured Severity 1 containment checklist is completed on the tablet '
        + 'with its required evidence, all offline.',
      sourceRef: 'L93121',
    },
    {
      id: 'escalation-queued',
      statement: 'The escalation is composed and queued; delivery waits for connectivity.',
      sourceRef: 'L93122',
    },
    {
      id: 'escalation-delivered',
      statement:
        'At reconnection the escalation delivers, and its delivery time is recorded separately '
        + 'from its origin time.',
      sourceRef: 'L93191',
    },
    {
      id: 'mirror',
      statement:
        "The server mirrors the device's classification and never re-triggers it; a divergence "
        + 'flag is raised where the mirror computation differs.',
      sourceRef: 'L93142',
    },
    {
      id: 'propagation-confirmation',
      statement:
        'Each device working the lot confirms the hold, and propagation is displayed per device '
        + 'and never summarised past its least-advanced device.',
      sourceRef: 'L93191',
    },
    {
      id: 'disposition',
      statement: 'Elena, as Quality Manager, dispositions the lot.',
      sourceRef: 'L93125',
    },
    {
      id: 'release',
      statement:
        'Elena releases the hold. Release is refused for every other identity, with an audit '
        + 'entry per refusal.',
      sourceRef: 'L93191',
    },
  ],
  finalOfficialState: {
    name:
      'Severity 1 deviation officially recorded; Critical anomaly auto-entered in the Anomaly '
      + 'Register with its containment record [SoW Fact — §3.3]; hold in force; released only by '
      + 'the Quality Manager after disposition',
    // Capture and classification give "Severity 1 deviation officially
    // recorded"; hold placement gives "hold in force"; the checklist items are
    // the containment record the Critical anomaly is entered with; disposition
    // and release give "released only by the Quality Manager after
    // disposition", with the releasing identity on the release event.
    derivedFrom: [
      'capture',
      'classification',
      'hold-placement',
      'checklist-item',
      'disposition',
      'release',
    ],
  },
  // Nothing here presumes a capability absent from the Statement of Work: the
  // glance table's own decision column for this storyboard reads
  // "None — fully specified by §3.3, §3.4, §7.9" at L92697, and the card's
  // source-status row reads `SoW Fact` throughout the safety path.
  absentCapability: null,
  facts: {
    // The hold propagates to a sibling device that has not synced, so at the
    // final official state one device has not acknowledged. No surface shows
    // the hold as in force there: the Command Center names the unconfirmed
    // device instead.
    deviceAcknowledgement: 'notAcknowledged',
    surfacesShowingApplied: [],
    contentOrigin: 'authored',
    // The safety path contains no artificial intelligence at any point, so
    // there is no inference to treat as anything.
    inference: 'noInference',
    gateOutcome: 'held',
    stateNamesShown: ['issued', 'propagating', 'in force', 'queued'],
    // `AC-44A-05-6` (L93191): propagation is displayed per device and never
    // summarised past its least-advanced device. That IS the partial labelling.
    outcomeIsPartial: true,
    partialLabelledPartial: true,
    connectivity: 'knownOffline',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    // `AC-44A-05-3` (L93191): no agent state, availability or output affects
    // the classification, the hold, the checklist or the release rule.
    deterministicStandings: {
      specificationGate: 'unchanged',
      evaluationGate: 'unchanged',
      qualificationGate: 'unchanged',
      severityOneHold: 'unchanged',
    },
    aiActs: [],
  },
}

/* ====================================================================
 * 44A.6 — SUPERVISOR UNAVAILABLE.
 * Section L93197-L93281. Card rows L93221-L93239. Surfaces L93245-L93249.
 * Acceptance SIX at L93277; tests FIVE at L93279.
 * ==================================================================== */

const SB_AI_06: Storyboard = {
  number: 6,
  identifier: 'SB-AI-06',
  fallback: { chapter: '44A.6', identifier: 'FB-AI-06' },
  cardHeaderRef: 'L93219',
  surfaceTableRef: 'L93243',
  content: {
    identifier: 'SB-AI-06; fallback contract FB-AI-06',
    preconditions:
      "Maya's run parked at a qualification gate; Sam not acknowledging; the tenant's escalation "
      + 'routing authored per severity level',
    trigger: 'An acknowledgement timer expires, or role resolution finds nobody on shift',
    actorsAndRoles:
      'Maya, Worker; Sam, Supervisor — the unavailable party; Elena, Quality Manager — the '
      + 'fallback target; the plant-manager view as a further tier where authored',
    workerVisibleExperience:
      '"Waiting for supervisor approval. Your run is parked. You can continue your other '
      + 'assigned runs." No countdown implying a deadline the worker controls',
    automaticFallback:
      'Next authored fallback tier, then the nobody-on-shift default to the Quality Manager role, '
      + 'each marked as a fallback delivery',
    manualFallback:
      'The worker or another person on the floor reaches an authorised person physically; that '
      + 'person acts through their own surface with their own identity',
    fallbackOfFallback:
      'Where no authorised person exists at all, see storyboard 27. The work stays in its safe '
      + 'state and the notification re-notifies on the Critical schedule',
    safeStop:
      'The parked run, the held lot, or the blocked step persists. Nothing is approved, released, '
      + 'or advanced by timeout',
    localData:
      "The parked run state; the queued request; the worker's other runs remain available",
    centralData:
      'The escalation record with every delivery attempt, tier, acknowledgement state, and '
      + 'fallback marking',
    notifications:
      "In-app and email only, the platform's two channels; fallback deliveries visibly marked; "
      + 'de-duplication applied',
    reconnection:
      'Where the device was offline, the clearance or decision rides the command channel and '
      + "applies at the device's next sync",
    conflictResolution:
      'Where two authorised people act on the same item, the first recorded decision stands and '
      + 'the second is presented as a duplicate rather than an override; both identities are '
      + 'retained',
    finalOfficialState:
      'The item is decided by a named human, or it remains open and visibly aging. It is never '
      + 'closed by time',
    audit:
      'Every delivery, every tier transition, every fallback marking, every acknowledgement, and '
      + 'the eventual decision with its identity',
    recoveryObjectives:
      'Not applicable — this is a human-availability condition, not a service failure. The '
      + 're-notification schedule of 4 hours, or 1 hour in Regulated-Industry mode, is the '
      + 'governing published value',
    residualRisk:
      'Depending on one role in one shift is a real operational risk; the nobody-on-shift default '
      + 'reduces it but does not remove it, and it is unconfirmed [DEC-NOSHIFT-001]',
    sourceStatus:
      'SoW Fact — §3.6, §3.9, §1.7; the ordering implied by "Supervisor+" is DEC-PLUS-001',
  },
  surfaces: {
    DOH: affected(
      'Owns the escalation record and the role-to-person resolution; records every tier and every '
        + 'fallback marking; records the eventual decision',
      'L93245',
    ),
    STU: affected(
      'Authored the routing rules, the tiers, and the timers per severity level; no runtime role',
      'L93246',
    ),
    CC: affected(
      'Alert and escalation feed shows the item, its age, its tier, and its fallback marking; '
        + 'acknowledgement is action 1, Supervisor and above',
      'L93247',
    ),
    FL: affected(
      "Shows the parked state honestly; the worker's other assigned runs remain available and "
        + 'workable',
      'L93248',
    ),
    SA: affected(
      'No tenant-level intervention; platform notification machinery health only',
      'L93249',
    ),
  },
  audit: [
    {
      id: 'delivery',
      statement:
        'Every delivery attempt is recorded — the notification created, becoming eligible, '
        + 'queued, and sent on in-app and email.',
      sourceRef: 'L93211',
    },
    {
      id: 'tier-transition',
      statement:
        'Every tier transition is recorded: on timeout the next fallback tier in the authored '
        + 'routing is notified.',
      sourceRef: 'L93213',
    },
    {
      id: 'fallback-marking',
      statement:
        'Every fallback marking is recorded, including the nobody-on-shift default routing to the '
        + "tenant's Quality Manager role irrespective of shift.",
      sourceRef: 'L93214',
    },
    {
      id: 'acknowledgement',
      statement:
        'Every acknowledgement is recorded as one state written by any channel, distinct from '
        + 'resolution.',
      // C-40. This cited L93212, which states the timer and "Acknowledgement is
      // one state; any channel writes it" but NOT the distinction from
      // resolution. `AC-44A-06-3` at L93277 carries the whole sentence:
      // "acknowledgement is one state written by any channel and is distinct
      // from resolution".
      sourceRef: 'L93277',
    },
    {
      // C-40, SPLIT. One event asserted the named identity, the no-auto-approval
      // rule and the never-closed-by-time rule, and cited L93217, which carries
      // only the second. The first and third are the card's Final official
      // state row, L93235.
      id: 'decision',
      statement:
        'The eventual decision is recorded with the identity that made it, and the item is never '
        + 'closed by time.',
      sourceRef: 'L93235',
    },
    {
      id: 'no-auto-approval',
      statement:
        'Where nobody acknowledges at any tier the work stays parked, held or blocked '
        + 'indefinitely. Nothing auto-approves.',
      sourceRef: 'L93217',
    },
  ],
  finalOfficialState: {
    name:
      'The item is decided by a named human, or it remains open and visibly aging. It is never '
      + 'closed by time',
    // The decision event carries the identity, which is what "decided by a
    // named human" resolves to; its absence in the log is what "remains open"
    // resolves to. The acknowledgement event is what keeps the two apart —
    // `AC-44A-06-3` (L93277) makes acknowledgement distinct from resolution.
    derivedFrom: ['acknowledgement', 'decision'],
  },
  // `DEC-NOSHIFT-001` and `DEC-PLUS-001` are both open here, and neither is a
  // capability presumed absent from the Statement of Work: the first is an
  // unconfirmed default for a fallback the source does specify, and the second
  // is an undefined ordering across roles the source does define. Both are
  // disclosed in `./decisions.ts`. There is no on-call calendar at V1 and this
  // storyboard presumes none (L93203).
  absentCapability: null,
  facts: {
    // The clearance is a command-channel act and the card's own sequence ends
    // with the device applying it and the parked run resuming, so at the final
    // official state the device has acknowledged. `AC-44A-06-1` (L93277) is
    // what keeps that honest: nothing is granted by timeout.
    deviceAcknowledgement: 'acknowledged',
    surfacesShowingApplied: ['FL'],
    contentOrigin: 'humanDecided',
    inference: 'noInference',
    gateOutcome: 'unpassed',
    stateNamesShown: [
      'waiting for supervisor approval',
      'parked',
      'fallback delivery',
      'acknowledged',
      'open and visibly aging',
    ],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    // The card offers the offline device only conditionally, at its
    // reconnection row; connectivity is not established for the storyboard.
    connectivity: 'unknown',
    showsSpinner: false,
    // The worker sees no countdown implying a deadline they control, and no
    // control that would let them advance the escalation.
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: {
      specificationGate: 'unchanged',
      evaluationGate: 'unchanged',
      qualificationGate: 'unchanged',
      severityOneHold: 'unchanged',
    },
    aiActs: [],
  },
}

/* ====================================================================
 * 44A.7 — QUALITY MANAGER RELEASES A HOLD AFTER RECONNECTION.
 * Section L93283-L93368. Card rows L93305-L93323. Surfaces L93329-L93333.
 * Acceptance five at L93364; tests FIVE at L93366.
 * ==================================================================== */

const SB_AI_07: Storyboard = {
  number: 7,
  identifier: 'SB-AI-07',
  fallback: { chapter: '44A.7', identifier: 'FB-AI-07' },
  cardHeaderRef: 'L93303',
  surfaceTableRef: 'L93327',
  content: {
    identifier: 'SB-AI-07; fallback contract FB-AI-07',
    preconditions:
      'LOT-WB-2291 held from an offline Severity 1 classification at 10:02; TAB-014 '
      + "reconnected; Ahmed's device still offline",
    trigger: 'Elena, as Quality Manager, releases the hold after disposition',
    actorsAndRoles:
      'Elena, Quality Manager — the only release authority; Sam, Supervisor — may request with a '
      + 'note but not release; Maya and Ahmed, Workers',
    workerVisibleExperience:
      "Maya's tablet continues to show the hold until it downloads, validates, applies, and "
      + 'acknowledges the release command. Only then does the hold band clear',
    automaticFallback:
      'Where a device does not acknowledge, the command remains queued and the propagation panel '
      + 'keeps naming it',
    manualFallback:
      'Where a device cannot be reached at all, the Supervisor physically retrieves it, or the '
      + 'affected work stays held pending device contact',
    fallbackOfFallback:
      "Where a device is lost or wiped, the hold on that device's scope is reconciled centrally "
      + "and the device's outstanding commands are recorded as undeliverable rather than as "
      + 'applied [DEC-WIPE-001]',
    safeStop:
      'The lot stays held on every device that has not acknowledged the release. A partial '
      + 'release is displayed as partial, never as complete',
    localData: "The device's local hold state and the applied release command with its identifier",
    centralData:
      "Deviation record, hold lifecycle, disposition, release decision with Elena's identity, and "
      + 'per-device command states',
    notifications:
      'Release notified to the Supervisor and, where configured, the Quality Manager; '
      + 'notification is not the mechanism — the command channel is',
    reconnection:
      'Ordering under the adopted DEC-SYNC-001 position: a lot release is an enabling-class '
      + "command, so Ahmed's captures upload in phase 2 and the hold clears in phase 3 "
      + 'immediately afterwards. The superseded commands-first reading, under which the hold '
      + 'would have cleared before the upload, stays recorded in the decision card; the panels '
      + 'display honestly whatever state each moment holds',
    conflictResolution:
      'A capture created on a device while the hold was in force remains valid and is not '
      + 'discarded by the later release; its device timestamp preserves the true order',
    finalOfficialState:
      'Hold released; deviation dispositioned; Critical anomaly moves toward Resolved with a '
      + 'closure note [SoW Fact — §3.3]',
    audit:
      'Disposition, release with identity and time, each command state transition, each device '
      + 'acknowledgement, reconciliation',
    recoveryObjectives:
      'Not applicable — release is a human decision, not a service. Command delivery latency is '
      + 'device-sync-bound and is metered as telemetry',
    residualRisk:
      'A supervisor reading "released" may assume the floor is clear; the per-device panel is the '
      + 'only control against that assumption, so it must never be summarised optimistically',
    sourceStatus:
      'SoW Fact — §1.3, §3.4, §3.5, §6.5.3, §7.2.2, §7.9.3; ordering is the adopted '
      + 'DEC-SYNC-001 position, Derived Clarification — adopted working position',
  },
  surfaces: {
    DOH: affected(
      'Records the disposition, the release, and every command state; the Anomaly Register entry '
        + 'moves to Resolved with a closure note',
      'L93329',
    ),
    STU: noEffect('the release is an operational act, not an authoring one', 'L93330'),
    CC: affected(
      'The release control is present only for the Quality Manager; the propagation panel tracks '
        + 'each device from queued to acknowledged',
      'L93331',
    ),
    FL: affected(
      'The hold band clears only after the device applies and acknowledges the command; no earlier',
      'L93332',
    ),
    SA: affected('Propagation lag telemetry; no involvement in the tenant decision', 'L93333'),
  },
  audit: [
    {
      id: 'disposition',
      statement:
        'Elena reviews the deviation workspace, the evidence and the containment completion, then '
        + 'dispositions the lot.',
      sourceRef: 'L93296',
    },
    {
      id: 'release',
      statement:
        'Elena releases the hold, with her identity and the time recorded. Release is action 4, '
        + 'Quality Manager only.',
      sourceRef: 'L93297',
    },
    {
      id: 'command-state-transition',
      statement:
        'Each command state transition is separately recorded: the lot-release command created, '
        + 'authorized, queued, then available for delivery.',
      sourceRef: 'L93298',
    },
    {
      id: 'device-acknowledgement',
      statement:
        'Each device working the lot downloads the command at its next sync, validates it, '
        + 'applies it and acknowledges, and each acknowledgement is recorded.',
      sourceRef: 'L93299',
    },
    {
      id: 'reconciliation',
      statement:
        "Reconciliation confirms that each device's local hold state matches the record of truth, "
        + "and the hold's full lifecycle is retained.",
      sourceRef: 'L93301',
    },
  ],
  finalOfficialState: {
    name:
      'Hold released; deviation dispositioned; Critical anomaly moves toward Resolved with a '
      + 'closure note [SoW Fact — §3.3]',
    // Disposition and release give "dispositioned" and "released"; the
    // per-device acknowledgements and reconciliation are what make "released"
    // mean released everywhere rather than released centrally.
    derivedFrom: ['disposition', 'release', 'device-acknowledgement', 'reconciliation'],
  },
  absentCapability: null,
  facts: {
    // At the final official state every relevant device has acknowledged —
    // which is the only condition under which any surface may show the hold as
    // released (`AC-44A-07-1`, L93364). While one had not, the propagation
    // panel named it, which is the partial labelling below.
    deviceAcknowledgement: 'acknowledged',
    surfacesShowingApplied: ['DOH', 'CC', 'FL'],
    contentOrigin: 'humanDecided',
    inference: 'noInference',
    gateOutcome: 'noGate',
    stateNamesShown: [
      'issued',
      'propagating',
      'released everywhere',
      'queued',
      'acknowledged',
      'partial',
    ],
    // L93313: a partial release is displayed as partial, never as complete,
    // and `AC-44A-07-5` (L93364) names the unreachable device on the panel
    // with its last-contact time, indefinitely.
    outcomeIsPartial: true,
    partialLabelledPartial: true,
    // One device is known offline throughout, which is the stricter reading of
    // the two the preconditions offer.
    connectivity: 'knownOffline',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: {
      specificationGate: 'unchanged',
      evaluationGate: 'unchanged',
      qualificationGate: 'unchanged',
      severityOneHold: 'unchanged',
    },
    // The release is a human act. Artificial intelligence never releases a
    // hold, and this storyboard has it perform no reserved act at all.
    aiActs: [],
  },
}

/* ====================================================================
 * 44A.8 — STUDIO PUBLISHES WHILE THE TABLET IS OFFLINE.
 * Section L93370-L93451. Card rows L93393-L93411. Surfaces L93417-L93421.
 * Acceptance five at L93447; tests FIVE at L93449.
 * ==================================================================== */

const SB_AI_08: Storyboard = {
  number: 8,
  identifier: 'SB-AI-08',
  fallback: { chapter: '44A.8', identifier: 'FB-AI-08' },
  cardHeaderRef: 'L93391',
  surfaceTableRef: 'L93415',
  content: {
    identifier: 'SB-AI-08; fallback contract FB-AI-08',
    preconditions:
      'RUN-2026-08-14-A in flight on pinned v2.1.0; TAB-014 offline; v2.2.0 published '
      + 'centrally',
    trigger: 'A Studio publication or a Lane B auto-publish while a device is offline',
    actorsAndRoles:
      'Elena, Quality Manager — Release Authority by tenant default; the Job Owner for notified '
      + 'classes; Maya, Worker; Priya, Tenant Admin, who set the adoption timing',
    workerVisibleExperience:
      'Nothing changes mid-run. At the first screen of the next execution, the republish '
      + 'description appears as a change notice',
    automaticFallback:
      'Version pinning — the in-flight run continues on its own version with no degradation at '
      + 'all',
    manualFallback:
      'Not applicable — no human action is needed; pinning is the designed behaviour rather than '
      + 'a failure response',
    fallbackOfFallback:
      'Where package distribution fails at reconnection, the device continues on its current '
      + 'package and the distribution is retried; the device is flagged as behind in the fleet '
      + 'view',
    safeStop:
      'Not applicable — no unsafe condition arises. The run completes on approved, '
      + 'version-stamped content',
    localData:
      'The pinned package; the newly downloaded package held for the next adoption boundary',
    centralData: 'The publication record; the version history; per-device package version telemetry',
    notifications:
      'Notified classes reach the Job Owner; patch classes are tracked rather than notified; the '
      + 'worker sees the republish description at the next execution, not a notification',
    reconnection: 'The new package downloads; adoption waits for the configured boundary',
    conflictResolution:
      'None between versions — the pinned version is authoritative for its run by definition. '
      + 'The pointer-versus-pinned question is DEC-LIB-001',
    finalOfficialState:
      "The run's record carries the version it executed on, which is the audit receipt stating "
      + 'which limits were in force [SoW Fact — §3.8]',
    audit: "Publication, distribution, per-device adoption, and the run's version stamp",
    recoveryObjectives:
      'Not applicable — no service failure occurs. Distribution latency is device-sync-bound',
    residualRisk:
      "A long-offline device can run several versions behind; the fleet view's package-version "
      + 'column is the control, and it must be watched',
    sourceStatus:
      'SoW Fact — §2.4, §3.8, §5.12, §6.7.4; interactions are DEC-LIB-001 and '
      + 'DEC-LANEB-001',
  },
  surfaces: {
    DOH: affected(
      "Records the run's executing version; the Job Owner's adoption decision for notified "
        + 'classes; the audit trail of publication',
      'L93417',
    ),
    STU: affected(
      'Shows the new version as published and its change log entry, attributed as a human edit or '
        + 'as "approved by [user] on agent proposal" for Lane B [SoW Fact — §6.7.4]',
      'L93418',
    ),
    CC: affected(
      'Shows nothing dramatic; the learned-change queue records the decision where Lane B was the '
        + 'origin',
      'L93419',
    ),
    FL: affected(
      'Continues on the pinned version; stores the new package; renders the republish description '
        + "at the next execution's first screen",
      'L93420',
    ),
    SA: affected(
      "Owns the auto-publish pipeline's own audit class [SoW Fact — §6.7.4]; fleet view shows "
        + 'per-device package versions',
      'L93421',
    ),
  },
  audit: [
    {
      id: 'publication',
      statement:
        'The publication is recorded: a patch version auto-publishes under the package test; a '
        + 'minor or major version is notified to the Job Owner for an adoption decision.',
      sourceRef: 'L93383',
    },
    {
      // C-40, SPLIT. One event fused walkthrough steps 3 and 5 and cited
      // L93384, which is step 3 alone. The reconnection half is step 5, L93386,
      // and it carries the clause that matters most here — the device stores
      // the package and does NOT apply it to the in-flight run.
      id: 'distribution',
      statement:
        'The new package is queued for distribution while the device is offline and reaches '
        + 'nothing.',
      sourceRef: 'L93384',
    },
    {
      id: 'distribution-at-reconnection',
      statement:
        'At reconnection the device downloads the new package and stores it. It does not apply '
        + 'it to the in-flight run.',
      sourceRef: 'L93386',
    },
    {
      id: 'per-device-adoption',
      statement:
        "Adoption is recorded per device at the tenant's configured timing — at next sync, or at "
        + 'the next run boundary, which is the platform default.',
      sourceRef: 'L93387',
    },
    {
      id: 'run-version-stamp',
      statement:
        "The run's record carries the version it executed on, which is the audit receipt stating "
        + 'which limits were in force.',
      sourceRef: 'L93407',
    },
  ],
  finalOfficialState: {
    name:
      "The run's record carries the version it executed on, which is the audit receipt stating "
      + 'which limits were in force [SoW Fact — §3.8]',
    // The publication event establishes that a newer version existed; the
    // adoption event establishes when it took effect; the version stamp is the
    // receipt itself. Together they identify which limits were in force
    // without reading the run.
    derivedFrom: ['publication', 'per-device-adoption', 'run-version-stamp'],
  },
  // `DEC-LIB-001` and `DEC-LANEB-001` are each a contradiction between two
  // statements the Statement of Work does make, not a capability it omits, so
  // neither is an `AC-44A-005` declaration. Both are canon-backed and their
  // records live in `src/disclosure/decisions.ts`.
  absentCapability: null,
  facts: {
    // The characteristic condition of this storyboard: the new package reaches
    // the offline device and nothing implies otherwise (L93432). The fleet view
    // reports the device's package VERSION, which is not the same claim as an
    // application.
    deviceAcknowledgement: 'notAcknowledged',
    surfacesShowingApplied: [],
    contentOrigin: 'authored',
    inference: 'noInference',
    // No unsafe condition arises; the run completes on approved,
    // version-stamped content with the pinned version's gate rules unchanged.
    gateOutcome: 'passed',
    stateNamesShown: [
      'published',
      'queued for distribution',
      'downloaded',
      'held until the configured adoption boundary',
      'behind',
    ],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    connectivity: 'knownOffline',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: {
      specificationGate: 'unchanged',
      evaluationGate: 'unchanged',
      qualificationGate: 'unchanged',
      severityOneHold: 'unchanged',
    },
    // The Lane B auto-publish is a HUMAN approval of an agent proposal — the
    // change log reads "approved by [user] on agent proposal" (L93418) — so
    // artificial intelligence self-approves nothing here. Whether the
    // auto-publish bypasses the three-stage sign-off is `DEC-LANEB-001`, a
    // contradiction the source records and does not resolve; declaring a
    // reserved act with an authority reference would assert the source grants
    // an authority it does not, and declaring one with none would assert a
    // violation the source does not describe.
    aiActs: [],
  },
}

/* ====================================================================
 * 44A.9 — COMMAND CENTER ISSUES AN ACTION TO AN OFFLINE DEVICE.
 * Section L93453-L93541. Card rows L93474-L93492. Surfaces L93498-L93502.
 * Acceptance five at L93537; tests FIVE at L93539.
 *
 * A STATED COUNT CONTRADICTING ITS OWN ENUMERATION. The prose at L93529 reads
 * "Fifteen distinct states" and `AC-44A-09-2` (L93537) says "the fifteen
 * command states". The state diagram at L93506-L93526 declares FOURTEEN
 * distinct states, counted by name: Created, Authorized, Queued,
 * AvailableForDelivery, Delivered, Downloaded, Validated, Applied, Rejected,
 * Acknowledged, Superseded, Cancelled, Expired, Reconciled. The prose walk at
 * L93465-L93469 names twelve of the same fourteen and adds none. Fourteen is
 * the enumeration and fifteen is the caption; nothing here asserts either
 * count, and `stateNamesShown` below carries the names rather than a number.
 * ==================================================================== */

const SB_AI_09: Storyboard = {
  number: 9,
  identifier: 'SB-AI-09',
  fallback: { chapter: '44A.9', identifier: 'FB-AI-09' },
  cardHeaderRef: 'L93472',
  surfaceTableRef: 'L93496',
  content: {
    identifier: 'SB-AI-09; fallback contract FB-AI-09',
    preconditions: "Ahmed's device offline; a run assigned to Maya that Sam wishes to reassign",
    trigger: 'Any of the five command-channel classes issued to an offline device',
    actorsAndRoles:
      "Sam, Supervisor — reassignment, clearance, agent re-check; Elena, Quality Manager — lot "
      + "release; Priya or the client's platform team — suspension; the Job Owner — version "
      + 'change',
    workerVisibleExperience:
      'Nothing, until the device syncs. The worker continues on the arrangement in force on their '
      + 'device, which is the true arrangement',
    automaticFallback:
      'The command waits in the queue in an honest state; no substitute action is invented',
    manualFallback:
      'Physical communication — the Supervisor walks to the worker. Any physical instruction '
      + 'still has to be recorded through a surface to become official',
    fallbackOfFallback:
      'Where the device never returns, the command is recorded as undeliverable and the intended '
      + 'change is achieved through a different route with its own record [DEC-WIPE-001 for the '
      + 'wipe case]',
    safeStop:
      'The pre-command arrangement remains in force and is displayed as in force; nothing is '
      + 'presented as changed',
    localData:
      'Nothing until delivery. On delivery: the applied command with its identifier and the '
      + 'resulting local state',
    centralData:
      "The command record with every state transition and timestamp; the device's last-contact "
      + 'time',
    notifications:
      'The issuing user sees the command state, not a success confirmation. Affected people are '
      + 'notified when the command is applied, not when it is created',
    reconnection:
      'The device downloads pending commands in order; ordering relative to capture upload '
      + 'follows the adopted DEC-SYNC-001 three phases — stop-class commands, then the full '
      + 'capture upload, then the enabling classes',
    conflictResolution:
      'Where two commands of the same class target the same object, the later supersedes the '
      + 'earlier and both are retained; where a command conflicts with work already done on the '
      + 'device, the command is rejected with a reason rather than overwriting the work',
    finalOfficialState:
      'The command is applied and acknowledged, rejected with a reason, superseded, cancelled, or '
      + 'recorded as expired. It is never "assumed applied"',
    audit: 'Every state transition with its actor, time, and reason where applicable',
    recoveryObjectives:
      'Not applicable — delivery is device-sync-bound by design, not by failure. Latency is '
      + 'metered as telemetry',
    residualRisk:
      'An issuer who does not read the state will believe the action took effect; the interface '
      + 'must therefore make the state impossible to miss, which is a design obligation rather '
      + 'than a training one',
    sourceStatus:
      'SoW Fact — §1.3, §1.4, §7.2.2, §1.7; ordering is the adopted DEC-SYNC-001 position, '
      + 'Derived Clarification — adopted working position',
  },
  surfaces: {
    DOH: affected(
      'Owns the command record and every state transition; records the eventual application or '
        + 'rejection as the official change',
      'L93498',
    ),
    STU: noEffect(
      'it has no role in commands; version-change commands originate from publication and '
        + 'adoption decisions rather than from the Studio directly',
      'L93499',
    ),
    CC: affected(
      "Displays the command state by its true name with the device's last-contact time; never "
        + 'shows a completion tick on creation',
      'L93500',
    ),
    FL: affected(
      'Applies commands in order at sync; shows the resulting change with the device time of '
        + 'application',
      'L93501',
    ),
    SA: affected(
      'Fleet view shows device last-contact and pending command counts; suspension-class commands '
        + 'originate here for platform-initiated cases',
      'L93502',
    ),
  },
  // Every state transition is one audit event with its actor, time and reason.
  // The four recorded here are the four this storyboard reaches: the command
  // is created, authorized, queued and available for delivery, and then the
  // target device is offline and no further state occurs (L93466).
  audit: [
    {
      id: 'created',
      statement:
        'The command is created by a Command Center operational action — reassignment, action 8, '
        + 'Supervisor and above — with its actor and time.',
      sourceRef: 'L93463',
    },
    {
      id: 'authorized',
      statement:
        "The command is authorized, executed through the shared Delivery Operations Hub service "
        + "with the same rules as the Hub's own screens.",
      sourceRef: 'L93464',
    },
    {
      id: 'queued',
      statement: 'The command is queued, written to the command channel.',
      // C-40. This cited L93465, the four-state sequence, which never names the
      // command channel. L93509 — the state diagram's own transition — carries
      // the whole statement: "Authorized --> Queued : written to the command
      // channel".
      sourceRef: 'L93509',
    },
    {
      id: 'available-for-delivery',
      statement:
        'The command becomes available for delivery. The target device is offline, so no further '
        + "state occurs, and the Command Center displays this state with the device's last "
        + 'contact time.',
      sourceRef: 'L93466',
    },
  ],
  finalOfficialState: {
    name:
      'The command is applied and acknowledged, rejected with a reason, superseded, cancelled, or '
      + 'recorded as expired. It is never "assumed applied"',
    // This is precisely what `AC-44A-004` asks for: the last recorded
    // transition IS the state, so the audit log alone decides which of the
    // five outcomes the command reached — and while the log ends at "available
    // for delivery", it has not reached any of them, which is why no surface
    // may show it applied.
    derivedFrom: ['created', 'authorized', 'queued', 'available-for-delivery'],
  },
  absentCapability: null,
  facts: {
    // The honesty rule this storyboard enforces is called the strictest in the
    // blueprint (L93459), and this is the fact it is checked against.
    deviceAcknowledgement: 'notAcknowledged',
    surfacesShowingApplied: [],
    contentOrigin: 'humanDecided',
    inference: 'noInference',
    gateOutcome: 'noGate',
    stateNamesShown: [
      'created',
      'authorized',
      'queued',
      'available for delivery',
      'delivered',
      'downloaded',
      'validated',
      'applied',
      'rejected',
      'acknowledged',
      'superseded',
      'cancelled',
      'expired',
      'reconciled',
    ],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    connectivity: 'knownOffline',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: {
      specificationGate: 'unchanged',
      evaluationGate: 'unchanged',
      qualificationGate: 'unchanged',
      severityOneHold: 'unchanged',
    },
    aiActs: [],
  },
}

/* ====================================================================
 * 44A.10 — ARTIFICIAL INTELLIGENCE USES AN OUTDATED WORK INSTRUCTION.
 * Section L93543-L93623. Card rows L93566-L93584. Surfaces L93590-L93594.
 * Acceptance five at L93619; tests FIVE at L93621.
 * ==================================================================== */

const SB_AI_10: Storyboard = {
  number: 10,
  identifier: 'SB-AI-10',
  fallback: { chapter: '44A.10', identifier: 'FB-AI-10' },
  cardHeaderRef: 'L93564',
  surfaceTableRef: 'L93588',
  content: {
    identifier: 'SB-AI-10; fallback contract FB-AI-10; extends FB-AGT-PREV-02',
    preconditions:
      'RUN-2026-08-14-A pinned to v2.1.0; v2.2.0 published centrally with a changed torque '
      + 'instruction',
    trigger:
      "An agent response whose content derives from a workflow version other than the run's "
      + 'pinned version',
    actorsAndRoles:
      "Maya, Worker; Elena, Quality Manager, in the learning read view; the screen's Studio "
      + 'author as the eventual owner',
    workerVisibleExperience:
      'The curated default or the authored Work Instructions render. The worker is never shown '
      + 'two conflicting instructions and never asked to choose between them',
    automaticFallback:
      'Suppress the mismatched asset; render pinned content; record the divergence',
    manualFallback:
      'The worker follows the pinned Work Instructions, which are always present and always '
      + 'authoritative for the run',
    fallbackOfFallback:
      "Where the pinned package's guidance is itself absent, storyboard 4 applies",
    safeStop: 'Work continues on pinned, approved content with every gate intact',
    localData:
      "The version-divergence event with both version identities and the suppressed asset's "
      + 'identity',
    centralData:
      'The divergence event; aggregate divergence counts per screen and per workflow version',
    notifications:
      'None to the worker; a learning read view entry for the Quality Manager; an '
      + 'instruction-review candidate for the author on recurrence',
    reconnection: 'The event uploads with the rest of the queue; nothing about the run changes',
    conflictResolution:
      'The pinned package wins, always, without exception, and the losing content is recorded '
      + 'rather than discarded',
    finalOfficialState:
      'The run executed on its pinned content; the divergence is recorded against the screen and '
      + 'both versions',
    audit: 'Divergence event; suppression; any resulting authoring candidate',
    recoveryObjectives:
      'Not applicable — no service failure. The remedy is corpus and workflow alignment through '
      + 'authoring',
    residualRisk:
      'Suppression means the worker receives less help; a corpus that has drifted badly will '
      + 'produce many suppressions and few cards, which is why the suppression rate must be '
      + 'monitored as a quality metric rather than treated as a safety success',
    sourceStatus:
      'Version pinning is SoW Fact — §2.4, §5.14; pointer propagation is SoW Fact — §5.7; '
      + 'their interaction is DEC-LIB-001',
  },
  surfaces: {
    DOH: affected(
      "Records the divergence event against the step execution and the run's version",
      'L93590',
    ),
    STU: affected(
      'Receives recurring divergences as instruction-review candidates; the author sees which '
        + 'corpus assets are out of step with which workflow versions',
      'L93591',
    ),
    CC: affected(
      'Learning read view shows the divergence; the agent activity panel shows the suppression '
        + 'count',
      'L93592',
    ),
    FL: affected('Renders pinned content only; no mismatched card is ever displayed', 'L93593'),
    SA: affected(
      'Aggregate divergence telemetry as an agent-health and memory-provenance signal',
      'L93594',
    ),
  },
  audit: [
    {
      // C-40, both of these. The two citations were crossed. L93560 states
      // that the mismatched card is not rendered and what renders instead but
      // says nothing about "both version identities"; L93575 — the Local data
      // row — is the only line that states the divergence event carries both
      // version identities and the suppressed asset's identity. Each event now
      // cites the line carrying its own leading clause. The naming of the two
      // versions is the card's Trigger row, L93568.
      id: 'divergence',
      statement:
        'The version-divergence event is recorded with both version identities — the run\'s '
        + "pinned version and the version the agent's content derives from.",
      sourceRef: 'L93575',
    },
    {
      id: 'suppression',
      statement:
        "The mismatched card is not rendered, and the suppressed asset's identity is recorded "
        + 'alongside the pinned content that rendered instead.',
      sourceRef: 'L93560',
    },
    {
      id: 'authoring-candidate',
      statement:
        'Where divergence recurs on one screen it becomes an instruction-review candidate for the '
        + 'Studio author, because it usually means the corpus was not updated when the workflow '
        + 'was.',
      sourceRef: 'L93562',
    },
  ],
  finalOfficialState: {
    name:
      'The run executed on its pinned content; the divergence is recorded against the screen and '
      + 'both versions',
    // The divergence event carries both versions, which is the whole of "the
    // divergence is recorded against the screen and both versions"; the
    // suppression event is what establishes that the pinned content, and not
    // the agent's, is what executed.
    derivedFrom: ['divergence', 'suppression'],
  },
  // Version-stamped agent responses and suppression on mismatch are a
  // `Recommendation — R&D`, and the card's own source classification says no
  // client decision is required because it sits inside the existing pinning
  // rule (L93623). Nothing here presumes a capability the Statement of Work
  // omits.
  absentCapability: null,
  facts: {
    deviceAcknowledgement: 'noDeviceCommand',
    surfacesShowingApplied: [],
    contentOrigin: 'packaged',
    // The agent selected a coaching asset; it made no inference about the work
    // and no gate outcome depends on it. The version check is a gate on
    // RENDERING, not on the step (L93611), so a suppressed card is not a
    // failed inference treated as a pass.
    inference: 'noInference',
    gateOutcome: 'passed',
    stateNamesShown: [
      'suppressed',
      'standard guidance for this step',
      'version divergence recorded',
    ],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    // The agent responded, so the device reached it.
    connectivity: 'online',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: {
      specificationGate: 'unchanged',
      evaluationGate: 'unchanged',
      qualificationGate: 'unchanged',
      severityOneHold: 'unchanged',
    },
    // The agent produced a response and the platform suppressed it. It
    // performed none of the five acts L92653 reserves.
    aiActs: [],
  },
}

/**
 * The ten, in storyboard order.
 *
 * A LITERAL LIST rather than a generated one, and in the same order as the
 * source's own glance table at L92693-L92722, so a card dropped from it is a
 * red test rather than a shorter array nobody notices.
 */
export const STORYBOARDS_01_TO_10 = [
  SB_AI_01,
  SB_AI_02,
  SB_AI_03,
  SB_AI_04,
  SB_AI_05,
  SB_AI_06,
  SB_AI_07,
  SB_AI_08,
  SB_AI_09,
  SB_AI_10,
] as const satisfies readonly Storyboard[]

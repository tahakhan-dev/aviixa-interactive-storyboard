import type { Storyboard } from '@/ai/storyboards/contract'
import { affected, noEffect } from '@/ui/shared/journey'

/**
 * §44A.11 TO §44A.20 — TEN STORYBOARDS, AS DATA.
 *
 * The card shape, the surface record, the compound fallback key and the nine
 * render-time invariants are task 15A's, in `@/ai/storyboards/contract` and
 * `@/ai/storyboards/invariants`. Nothing is re-declared here and nothing is
 * added to either module. This file is ten objects.
 *
 * ── WHAT WAS MEASURED, RATHER THAN INFERRED FROM A SPAN ────────────────────
 * Every card was opened and its rows counted from its own header downwards.
 * All ten are nineteen rows; all ten surface tables are five rows in the one
 * surface tuple. Acceptance criteria and tests are NOT uniform across the ten
 * and were counted from each section's two prose lines:
 *
 *   44A.11 5 AC / 4 tests · 44A.12 6/5 · 44A.13 5/4 · 44A.14 5/5
 *   44A.15 5/5           · 44A.16 6/5 · 44A.17 5/4 · 44A.18 5/5
 *   44A.19 5/5           · 44A.20 6/6
 *
 * Fifty-three acceptance criteria and forty-eight tests across the ten.
 * §44A.20 is one of only two sections in the chapter carrying six of each —
 * counted at its own acceptance line and its own test line, not deduced.
 *
 * ── THE FALLBACK KEY IS COMPOUND, AND THE CHAPTER HALF IS THE SECTION ──────
 * Six of these ten literals name two contracts. `FB-AI-15` is "Pause, kill and
 * rollback failure" in chapter 40's register and storyboard 15 here. The key is
 * the pair, and the chapter half is the SECTION number the registry registers
 * — `44A.15`, not a bare `44A`. `ownerAt('44A.15', 'FB-AI-15')` and
 * `ownerAt('40.15', 'FB-AI-15')` return two different contracts, which is the
 * whole point of the pair.
 *
 * ── WHERE THE `DEC-*` IDENTIFIERS TRAVEL, AND WHY THERE IS NO FIELD FOR THEM
 * Seventeen `DEC-*` identifiers are named across these ten sections and
 * sixteen of them are not members of the exported `DecisionId` union — among
 * them `DEC-AIRTO-001`, which is the entire content of five of these ten
 * `Recovery Time Objective and Recovery Point Objective` rows. The union lives
 * in `src/disclosure/decisions.ts`, which is wave 5's and read-only here, so
 * the identifiers travel inside the transcribed field text, which is exactly
 * where the source puts them. Widening the union or standing up a second
 * disclosure home would be a change to a file this task does not own.
 *
 * ── THE ONE FIELD THAT IS NOT A TRANSCRIPTION ──────────────────────────────
 * `audit` is a list of identified events rather than the card's one Audit
 * sentence, and `finalOfficialState.derivedFrom` names the events the state is
 * rebuilt from. `AC-44A-004` requires the final official state to be derivable
 * from the audit log ALONE, and a prose sentence cannot be reconstructed from.
 * Each event's `statement` is the source's own clause from its Audit row, and
 * its `sourceRef` is the line that clause is on.
 *
 * This module is data. It computes nothing and renders nothing.
 */

/** Nothing in these ten relaxes a deterministic control. Measured per card. */
const DETERMINISTIC_UNCHANGED = {
  specificationGate: 'unchanged',
  evaluationGate: 'unchanged',
  qualificationGate: 'unchanged',
  severityOneHold: 'unchanged',
} as const

/* ====================================================================
 * 44A.11 — LOCAL AND CLOUD ARTIFICIAL INTELLIGENCE DISAGREE.
 * Card L93643, rows L93645-L93663. Surfaces L93667, rows L93669-L93673.
 * Acceptance L93701 (five). Tests L93703 (four).
 * ==================================================================== */

const STORYBOARD_11: Storyboard = {
  number: 11,
  identifier: 'SB-AI-11',
  fallback: { chapter: '44A.11', identifier: 'FB-AI-11' },
  cardHeaderRef: 'L93643',
  surfaceTableRef: 'L93667',
  content: {
    identifier: 'SB-AI-11; fallback contract FB-AI-11; conditional on DEC-LOCALAI-001',
    preconditions:
      'A device-resident capability exists under DEC-LOCALAI-001; the device is online, so both '
      + 'paths are available',
    trigger: 'Two differing responses for one request',
    actorsAndRoles:
      'Maya, Worker — sees one answer only; Daniel, Platform Engineer — owns the evaluation '
      + 'regression; Elena, Quality Manager — sees the divergence in the learning read view',
    workerVisibleExperience:
      'One card, or one fallback. No indication that a disagreement occurred, because the '
      + 'disagreement is not the worker’s problem and mentioning it would undermine the '
      + 'guidance',
    automaticFallback:
      'Deterministic precedence, then the configured primary for the connectivity state',
    manualFallback: 'Authored Work Instructions, always available',
    fallbackOfFallback:
      'Where both responses fail the pinned-version check, both are suppressed and storyboard '
      + '4’s cascade applies',
    safeStop: 'Work continues on pinned, approved content',
    localData: 'The rendered asset identity; the divergence event with both responses',
    centralData: 'Divergence event; aggregate divergence rate per capability version pair',
    notifications: 'None to the worker or the supervisor; an engineering signal only',
    reconnection:
      'Not applicable — a disagreement requires both paths, which requires connectivity',
    conflictResolution:
      'Deterministic content governs; the configured primary decides which surviving response '
      + 'renders; both are retained',
    finalOfficialState: 'One rendered asset, one divergence record, unchanged operational outcome',
    audit: 'Divergence event with both responses and both capability versions',
    recoveryObjectives: 'Not applicable — no outage occurs',
    residualRisk:
      'A high divergence rate means one of the two capabilities is materially worse, and without '
      + 'the evaluation harness closing that loop the divergence data accumulates without effect',
    sourceStatus:
      'User-Mandated Product Extension — DEC-LOCALAI-001; the precedence rule is SoW Fact — '
      + '§3.2, §7.9.2',
  },
  surfaces: {
    DOH: affected(
      'Records the rendered asset and the divergence event against the step execution',
      'L93669',
    ),
    STU: noEffect(
      'the corpus and the workflow are unaffected by which capability selected from them',
      'L93670',
    ),
    CC: affected(
      'Learning read view shows divergence counts; no alert is raised, because no operational '
      + 'condition exists',
      'L93671',
    ),
    FL: affected(
      'Renders exactly one guidance item; never surfaces the disagreement',
      'L93672',
    ),
    SA: affected(
      'Divergence rate per capability version pair as an evaluation-harness input',
      'L93673',
    ),
  },
  audit: [
    {
      id: 'renderedAssetRecorded',
      statement: 'The rendered asset recorded against the step execution',
      sourceRef: 'L93669',
    },
    {
      id: 'divergenceEvent',
      statement: 'Divergence event with both responses and both capability versions',
      sourceRef: 'L93660',
    },
  ],
  finalOfficialState: {
    name: 'One rendered asset, one divergence record, unchanged operational outcome',
    derivedFrom: ['renderedAssetRecorded', 'divergenceEvent'],
  },
  facts: {
    // No command is issued to a device in this storyboard; the device renders
    // locally after the pinned-version check.
    deviceAcknowledgement: 'noDeviceCommand',
    surfacesShowingApplied: [],
    // The surviving response is pinned, approved content. Nothing is generated.
    contentOrigin: 'authored',
    inference: 'noInference',
    gateOutcome: 'noGate',
    stateNamesShown: ['one rendered asset', 'divergence recorded'],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    // The card's own precondition: the device is online, so both paths exist.
    connectivity: 'online',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: DETERMINISTIC_UNCHANGED,
    // AC-44A-11-4 (L93701): no divergence changes any operational outcome,
    // gate, classification, or hold. No agent performs a reserved act.
    aiActs: [],
  },
  absentCapability: {
    statement:
      'Not specified in the Statement of Work. There is no local artificial intelligence at V1; '
      + 'the reasoning layer is server-side and online-only [SoW Fact — §7.9.1, layer (c)]. This '
      + 'storyboard is conditional on DEC-LOCALAI-001.',
    sourceRef: 'L93631',
  },
}

/* ====================================================================
 * 44A.12 — WORKER FLAGS AN UNSAFE RESPONSE.
 * Card L93728, rows L93730-L93748. Surfaces L93752, rows L93754-L93758.
 * Acceptance L93786 (SIX). Tests L93788 (five).
 *
 * The worker confirmation quoted at L93734 is NOT declared as a
 * `fixedMessages` entry. `PINNED_WORKER_MESSAGES` in the invariants module
 * pins one screen, `SCR-FL-LOCK-01`, and a fixed message naming a screen the
 * list does not cover is a violation by design — the invariant says so in its
 * own words. The source quotes this confirmation but does not rule its wording
 * unparaphrasable the way L94876 rules `SCR-FL-LOCK-01`'s. Declaring it would
 * either turn the card red or require editing a module this task does not own,
 * so the wording travels in the Worker-visible experience row where the source
 * writes it, and the pinning question is left for whoever owns that list.
 * ==================================================================== */

const STORYBOARD_12: Storyboard = {
  number: 12,
  identifier: 'SB-AI-12',
  fallback: { chapter: '44A.12', identifier: 'FB-AI-12' },
  cardHeaderRef: 'L93728',
  surfaceTableRef: 'L93752',
  content: {
    identifier: 'SB-AI-12; fallback contract FB-AI-12',
    preconditions:
      'A coaching card rendered from the approved corpus; the flag control exists under '
      + 'DEC-SAFETY-001',
    trigger: 'The worker raises a safety flag on a rendered asset',
    actorsAndRoles:
      'Maya, Worker — the reporter; Sam, Supervisor — notified; Elena, Quality Manager — '
      + 'decides; the Studio author — acts on retirement',
    workerVisibleExperience:
      'The card disappears immediately with a plain confirmation: “Thank you. This help card '
      + 'has been reported and will not be shown on this tablet again until it is checked.” '
      + 'Then the fallback guidance renders',
    automaticFallback: 'Local suppression plus the ordinary guidance cascade of section 44.1',
    manualFallback:
      'The worker tells the Supervisor directly; the Supervisor records it through the Command '
      + 'Center so the report becomes official',
    fallbackOfFallback:
      'Where the flag cannot be delivered, it remains queued and the local suppression persists, '
      + 'so the worker’s protection does not depend on delivery',
    safeStop:
      'The flagged asset is not shown on the reporting device; the worker proceeds on authored '
      + 'Work Instructions',
    localData:
      'The flag with its reason, the suppressed asset identity, and the suppression state, all '
      + 'durable',
    centralData: 'The flag record; the quarantine state where applied; the review decision',
    notifications:
      'Supervisor and Quality Manager notified in-app and by email per the escalation record; '
      + 'the worker receives a plain confirmation only',
    reconnection: 'The flag uploads with high priority relative to ordinary learning signals',
    conflictResolution:
      'Where multiple workers flag the same asset, the flags aggregate into one review item '
      + 'retaining every reporter identity',
    finalOfficialState:
      'The asset is cleared with a recorded reason, or retired or replaced through the Studio '
      + 'approval chain',
    audit:
      'Flag creation, local suppression, delivery, quarantine entry and exit, the review decision '
      + 'with its identity and reason',
    recoveryObjectives:
      'TBD — Client Decision Required — the review response time for a safety flag is a genuine '
      + 'service commitment and is part of DEC-SAFETY-001',
    residualRisk:
      'Quarantining tenant-wide on one report can be abused or mistaken, removing good guidance; '
      + 'not quarantining leaves a hazardous clip in circulation. This trade-off is the decision, '
      + 'and it cannot be avoided by design',
    sourceStatus:
      'User-Mandated Product Extension — DEC-SAFETY-001; dismissal as a distinct, existing '
      + 'mechanism is SoW Fact — §5.2.1, §7.12',
  },
  surfaces: {
    DOH: affected(
      'Records the flag, the review item, and the decision on the tenant’s immutable audit '
      + 'log',
      'L93754',
    ),
    STU: affected(
      'Shows the asset’s quarantine state to its author; retirement or replacement runs the '
      + 'normal approval chain',
      'L93755',
    ),
    CC: affected(
      'A distinct safety-flag item, visually separate from learning signals and from gate items, '
      + 'with the reporter, the asset, and the context',
      'L93756',
    ),
    FL: affected(
      'Immediate local suppression; plain confirmation; fallback guidance renders',
      'L93757',
    ),
    SA: affected(
      'Cross-tenant flag rates per asset class as an anonymised aggregate only [SoW Fact — '
      + '§8.1.2]',
      'L93758',
    ),
  },
  audit: [
    { id: 'flagCreation', statement: 'Flag creation', sourceRef: 'L93745' },
    { id: 'localSuppression', statement: 'Local suppression', sourceRef: 'L93745' },
    { id: 'delivery', statement: 'Delivery', sourceRef: 'L93745' },
    {
      id: 'quarantineEntryAndExit',
      statement: 'Quarantine entry and exit',
      sourceRef: 'L93745',
    },
    {
      id: 'reviewDecision',
      statement: 'The review decision with its identity and reason',
      sourceRef: 'L93745',
    },
  ],
  finalOfficialState: {
    name:
      'The asset is cleared with a recorded reason, or retired or replaced through the Studio '
      + 'approval chain',
    derivedFrom: ['flagCreation', 'reviewDecision'],
  },
  facts: {
    deviceAcknowledgement: 'noDeviceCommand',
    surfacesShowingApplied: [],
    // The fallback that renders after suppression is the authored corpus.
    contentOrigin: 'authored',
    inference: 'noInference',
    gateOutcome: 'noGate',
    stateNamesShown: [
      'flagged',
      'suppressed on this device',
      'quarantined',
      'cleared with a recorded reason',
      'retired or replaced',
    ],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    // The flag is committed before any network attempt, so the storyboard
    // covers both connected and disconnected devices. Neither is stated.
    connectivity: 'unknown',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: DETERMINISTIC_UNCHANGED,
    // L93726: retirement is an authoring act, never an automatic one.
    aiActs: [],
  },
  absentCapability: {
    statement:
      'Not specified in the Statement of Work. The Statement of Work provides dismissal, recorded '
      + 'as a learning signal and a supervisor-visibility signal [SoW Fact — §5.2.1, §7.12], and '
      + 'it provides feedback loops on the Command Center side — gate decisions, relevance marks, '
      + 'annotations [SoW Fact — §6.8.1]. It does not provide a worker-side safety flag, and the '
      + 'two are not the same: dismissal is deliberately low-cost and low-signal, which is exactly '
      + 'what a safety report must not be.',
    sourceRef: 'L93713',
  },
}

/* ====================================================================
 * 44A.13 — AN AGENT ACTION PARTIALLY SUCCEEDS.
 * Card L93814, rows L93816-L93834. Surfaces L93838, rows L93840-L93844.
 * Acceptance L93873 (five). Tests L93875 (four).
 * ==================================================================== */

const STORYBOARD_13: Storyboard = {
  number: 13,
  identifier: 'SB-AI-13',
  fallback: { chapter: '44A.13', identifier: 'FB-AI-13' },
  cardHeaderRef: 'L93814',
  surfaceTableRef: 'L93838',
  content: {
    identifier: 'SB-AI-13; fallback contract FB-AI-13',
    preconditions:
      'An approved gate item with a multi-target effect; two of four target devices offline',
    trigger: 'Application succeeds on some targets and not others',
    actorsAndRoles:
      'Elena, Quality Manager — the decider; Sam, Supervisor — sees the partial state; Maya and '
      + 'Ahmed, Workers on affected stations',
    workerVisibleExperience:
      'Each worker sees only their own device’s state. A worker on an unaffected station sees '
      + 'nothing, which is correct — the effect genuinely has not reached them',
    automaticFallback:
      'Per-target commands persist in their honest states; no aggregate success is displayed',
    manualFallback:
      'The Supervisor physically reaches the unaffected stations and stops work there; that '
      + 'instruction is then recorded through a surface',
    fallbackOfFallback:
      'Where a target cannot be reached at all, the affected scope is held centrally and the run '
      + 'at that station is blocked at its next server-mediated checkpoint; where none exists, '
      + 'physical control is the only remedy and the record says so',
    safeStop:
      'The effect stands where applied; the unaffected targets continue under their existing '
      + 'constraints, which are displayed as unchanged',
    localData: 'Per-device applied command state and resulting local effect',
    centralData: 'The decision record; per-target command records; the aggregate partial state',
    notifications:
      'The decider is notified of partial application and of each subsequent target '
      + 'acknowledgement; no notification says “complete” until it is',
    reconnection:
      'Offline targets apply on their next sync in order; the aggregate state advances only then',
    conflictResolution:
      'Where a target has already been affected by a later decision, the earlier command is '
      + 'rejected as superseded rather than applied, and both are retained',
    finalOfficialState:
      'Every target is in a named state: applied, rejected with reason, superseded, cancelled, or '
      + 'expired. No target is in an unknown state',
    audit:
      'The decision, each per-target state transition, the aggregate state at each point, and any '
      + 'compensating action',
    recoveryObjectives:
      'TBD — Client Decision Required — DEC-AIRTO-001; per-target delivery is device-sync-bound',
    residualRisk:
      'An operator reading “partially applied” may not act on the gap; the interface must '
      + 'name the unaffected targets rather than only counting them',
    sourceStatus:
      'The propagation idiom is SoW Fact — §6.5.3; its generalisation is Derived Clarification',
  },
  surfaces: {
    DOH: affected(
      'Records the decision, every per-target command, and the compensating action where one '
      + 'occurs',
      'L93840',
    ),
    STU: noEffect(
      'the containment policy that was extended was authored there and is unchanged',
      'L93841',
    ),
    CC: affected(
      'Shows the gate decision as complete and the effect as partial, with every target named and '
      + 'stated',
      'L93842',
    ),
    FL: affected(
      'Each device shows only what it actually applied, at the device time of application',
      'L93843',
    ),
    SA: affected(
      'Per-tenant propagation-lag telemetry; no involvement in the tenant decision',
      'L93844',
    ),
  },
  audit: [
    { id: 'decision', statement: 'The decision', sourceRef: 'L93831' },
    {
      id: 'perTargetStateTransitions',
      statement: 'Each per-target state transition',
      sourceRef: 'L93831',
    },
    {
      id: 'aggregateStateAtEachPoint',
      statement: 'The aggregate state at each point',
      sourceRef: 'L93831',
    },
    {
      id: 'compensatingAction',
      statement: 'Any compensating action',
      sourceRef: 'L93831',
    },
  ],
  finalOfficialState: {
    name:
      'Every target is in a named state: applied, rejected with reason, superseded, cancelled, or '
      + 'expired. No target is in an unknown state',
    derivedFrom: ['perTargetStateTransitions', 'aggregateStateAtEachPoint'],
  },
  facts: {
    // Two of four targets are offline at the final official state, so the
    // storyboard terminates with commands unacknowledged.
    deviceAcknowledgement: 'notAcknowledged',
    // AC-44A-13-1 (L93873): no aggregate success state until every target has
    // acknowledged. Each device shows only what IT applied (L93843), which is
    // not the surface showing the multi-target act as applied.
    surfacesShowingApplied: [],
    // Elena decided. Nothing here is generated and nothing is missing.
    contentOrigin: 'humanDecided',
    inference: 'noInference',
    gateOutcome: 'passed',
    stateNamesShown: [
      'partially applied',
      'applied',
      'rejected with reason',
      'superseded',
      'cancelled',
      'expired',
    ],
    outcomeIsPartial: true,
    partialLabelledPartial: true,
    // Two targets are known offline. L93867: the control offered is decide
    // again, not retry — which is what makes this legal under L92843.
    connectivity: 'knownOffline',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: DETERMINISTIC_UNCHANGED,
    // L93800: a partial effect is a partial application of something a human
    // already authorised, never of something the agent decided alone.
    aiActs: [],
  },
  absentCapability: null,
}

/* ====================================================================
 * 44A.14 — AN APPROVED ARTIFICIAL-INTELLIGENCE ACTION EXPIRES.
 * Card L93899, rows L93901-L93919. Surfaces L93923, rows L93925-L93929.
 * Acceptance L93961 (five). Tests L93963 (five).
 * ==================================================================== */

const STORYBOARD_14: Storyboard = {
  number: 14,
  identifier: 'SB-AI-14',
  fallback: { chapter: '44A.14', identifier: 'FB-AI-14' },
  cardHeaderRef: 'L93899',
  surfaceTableRef: 'L93923',
  content: {
    identifier: 'SB-AI-14; fallback contract FB-AI-14',
    preconditions:
      'An approved gate item whose command has not been delivered; a validity window defined '
      + 'under DEC-AIEXPIRE-001',
    trigger: 'The validity window elapses before delivery',
    actorsAndRoles:
      'Elena, Quality Manager — the original decider; the current Supervisor on shift; the device '
      + 'that never synced',
    workerVisibleExperience:
      'Nothing. The worker never receives an expired command, and no worker-facing surface '
      + 'mentions an approval that did not land',
    automaticFallback: 'Transition to expired; notify; re-evaluate the underlying condition',
    manualFallback: 'A fresh gate item with fresh context, decided by a person now',
    fallbackOfFallback:
      'Where the underlying condition is a safety condition still in force — a held lot, an open '
      + 'deviation — that condition persists independently of the expired command, because holds '
      + 'do not expire',
    safeStop: 'The pre-approval state remains in force; nothing partial is applied',
    localData: 'Nothing; the command never reached the device',
    centralData:
      'The expired command with its full state history; the expiry notification; any fresh gate '
      + 'item',
    notifications:
      'Expiry notified to the original decider and to the current shift’s Supervisor; worded '
      + 'as an expiry, with the original decision time and the elapsed duration',
    reconnection:
      'A device syncing after expiry receives nothing for that command; it is not delivered late',
    conflictResolution:
      'Where a device syncs at the moment of expiry, the expiry wins and the command is not '
      + 'delivered; a fencing token on the command makes the ordering unambiguous',
    finalOfficialState:
      'Expired, recorded, and either re-raised as a fresh item or abandoned with the underlying '
      + 'condition unchanged',
    audit:
      'Approval, authorization, queueing, expiry, notification, and any fresh item, with the '
      + 'causal link between the original and the fresh item retained',
    recoveryObjectives:
      'Not applicable — expiry is a designed behaviour, not a failure. The validity window itself '
      + 'is DEC-AIEXPIRE-001',
    residualRisk:
      'Too short a window produces re-decision churn; too long a window permits stale '
      + 'application. There is no value that avoids both, which is why it is a client decision',
    sourceStatus:
      'Gate-item timeouts are SoW Fact — §6.6.5, §1.7; approved-action expiry is Client Decision '
      + 'Required — DEC-AIEXPIRE-001',
  },
  surfaces: {
    DOH: affected(
      'Records the expiry and retains the full command history; any fresh item links back to the '
      + 'expired one',
      'L93925',
    ),
    STU: noEffect(
      'the policy that produced the proposal is unchanged by an undelivered instance',
      'L93926',
    ),
    CC: affected(
      'The gate queue shows the item as approved-then-expired, distinct from declined and from '
      + 'unactioned; a fresh item appears where the condition persists',
      'L93927',
    ),
    // The chapter's strictest rule, in the source's own words for this card.
    FL: noEffect('it receives nothing; no surface implies otherwise', 'L93928'),
    SA: affected(
      'Expiry rates as a delivery-health signal, since a high expiry rate means devices are not '
      + 'syncing',
      'L93929',
    ),
  },
  audit: [
    { id: 'approval', statement: 'Approval', sourceRef: 'L93916' },
    { id: 'authorization', statement: 'Authorization', sourceRef: 'L93916' },
    { id: 'queueing', statement: 'Queueing', sourceRef: 'L93916' },
    { id: 'expiry', statement: 'Expiry', sourceRef: 'L93916' },
    { id: 'notification', statement: 'Notification', sourceRef: 'L93916' },
    {
      id: 'freshItem',
      statement:
        'Any fresh item, with the causal link between the original and the fresh item retained',
      sourceRef: 'L93916',
    },
  ],
  finalOfficialState: {
    name:
      'Expired, recorded, and either re-raised as a fresh item or abandoned with the underlying '
      + 'condition unchanged',
    derivedFrom: ['approval', 'expiry', 'freshItem'],
  },
  facts: {
    // A command existed and the device never synced, so it was never
    // acknowledged. L93910: nothing local; the command never reached it.
    deviceAcknowledgement: 'notAcknowledged',
    surfacesShowingApplied: [],
    contentOrigin: 'humanDecided',
    inference: 'noInference',
    gateOutcome: 'passed',
    stateNamesShown: [
      'expired',
      'approved-then-expired',
      'declined',
      'unactioned',
      're-raised',
    ],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    // The target device does not sync, and the platform knows it: the expiry
    // rate is a delivery-health signal precisely because it knows (L93929).
    connectivity: 'knownOffline',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: DETERMINISTIC_UNCHANGED,
    // L93896: nothing is applied on the strength of the expired approval. The
    // storyboard exists to keep a stale queued action from executing, so no
    // reserved act is performed.
    aiActs: [],
  },
  absentCapability: {
    statement:
      'Not specified in the Statement of Work. The Statement of Work fixes the timeout on the '
      + 'waiting side — a gate item unactioned for 10 minutes at Severity 1 or 30 minutes '
      + 'otherwise re-routes to the next person, never executes on its own, and never silently '
      + 'expires [SoW Fact — §6.6.5, §1.7] — but it says nothing about how long an approved action '
      + 'may remain undelivered before it is no longer safe to apply. The honesty rules forbid an '
      + 'agent executing a stale queued action, so an expiry concept is required, and its value is '
      + 'DEC-AIEXPIRE-001.',
    sourceRef: 'L93885',
  },
}

/* ====================================================================
 * 44A.15 — A RETRY RISKS A DUPLICATE ACTION.
 * Card L93990, rows L93992-L94010. Surfaces L94014, rows L94016-L94020.
 * Acceptance L94044 (five). Tests L94046 (five).
 * ==================================================================== */

const STORYBOARD_15: Storyboard = {
  number: 15,
  identifier: 'SB-AI-15',
  fallback: { chapter: '44A.15', identifier: 'FB-AI-15' },
  cardHeaderRef: 'L93990',
  surfaceTableRef: 'L94014',
  content: {
    identifier:
      'SB-AI-15; fallback contract FB-AI-15; shares DEC-AIDUP-001 with FB-AGT-PREV-03',
    preconditions: 'A state-changing message in flight; connectivity unstable',
    trigger: 'A send attempt whose outcome is unknown to the sender',
    actorsAndRoles:
      'Maya, Worker — originator of captures; Elena, Quality Manager — originator of decisions; '
      + 'the platform as receiver',
    workerVisibleExperience:
      'The capture’s honest state: committed locally, queued, uploading, upload interrupted, '
      + 'then uploaded. Never a duplicate, never a silent loss, never a spinner that lies',
    automaticFallback: 'Retry with the same key, bounded per DEC-AIRETRY-001, with backoff',
    manualFallback:
      'Where retries are exhausted, the item is parked in a dead-letter state with a named owner '
      + 'and is visible on the device’s sync state and in the Command Center’s '
      + 'sync-state module',
    fallbackOfFallback:
      'Where a parked item cannot be resolved, it is escalated as a data-integrity item; it is '
      + 'never discarded and never auto-resolved',
    safeStop:
      'The item remains in a named, visible state on both sides; work continues; nothing is '
      + 'duplicated and nothing is lost',
    localData: 'The item, its key, its attempt count, and its current state, all durable',
    centralData:
      'One record per key; every attempt logged; the deduplication decisions themselves recorded',
    notifications:
      'None for ordinary retries; a sync-health signal where a device’s parked-item count is '
      + 'non-zero',
    reconnection: 'Retries resume automatically with the same keys and in queue order',
    conflictResolution:
      'Deduplication by key; where two genuinely different actions collide on a key, that is a '
      + 'key-generation defect and the platform rejects the second with a diagnostic rather than '
      + 'merging them',
    finalOfficialState: 'Exactly one record per logical action, with a complete attempt history',
    audit: 'Every attempt, every deduplication, every parking, every resolution',
    recoveryObjectives:
      'Recovery Point Objective is effectively zero for locally committed items, because nothing '
      + 'is discarded from the durable queue. TBD — Client Decision Required for the service-side '
      + 'pair under DEC-AIRTO-001',
    residualRisk:
      'A key-generation defect produces either duplicates or wrongly merged records; the key '
      + 'composition is therefore a Functional Specification item requiring explicit test coverage',
    sourceStatus:
      'Derived Clarification mandated by the honesty rules and by the capture-state chain; key '
      + 'composition is DEC-AIDUP-001',
  },
  surfaces: {
    DOH: affected(
      'Holds exactly one record per key; records attempts and deduplications',
      'L94016',
    ),
    STU: noEffect(
      'authoring actions are synchronous web interactions and do not traverse the device queue',
      'L94017',
    ),
    CC: affected(
      'Sync state and connectivity module shows per-device queue depth, parked items, and last '
      + 'successful sync',
      'L94018',
    ),
    FL: affected(
      'Shows each item’s true capture state; retries silently and bounded; parks visibly',
      'L94019',
    ),
    SA: affected(
      'Fleet-level queue and parked-item telemetry as a delivery-health signal',
      'L94020',
    ),
  },
  audit: [
    { id: 'everyAttempt', statement: 'Every attempt', sourceRef: 'L94007' },
    { id: 'everyDeduplication', statement: 'Every deduplication', sourceRef: 'L94007' },
    { id: 'everyParking', statement: 'Every parking', sourceRef: 'L94007' },
    { id: 'everyResolution', statement: 'Every resolution', sourceRef: 'L94007' },
  ],
  finalOfficialState: {
    name: 'Exactly one record per logical action, with a complete attempt history',
    derivedFrom: ['everyAttempt', 'everyDeduplication'],
  },
  facts: {
    // The traced path is a capture upload: the device originates and the server
    // receives. No server-created command is involved.
    deviceAcknowledgement: 'noDeviceCommand',
    surfacesShowingApplied: [],
    contentOrigin: 'authored',
    inference: 'noInference',
    gateOutcome: 'noGate',
    // The capture-state chain, verbatim from L93996 and L93982-L93986. None of
    // these normalises to "synced", "sent" or "done" — that is the point.
    stateNamesShown: [
      'committed locally',
      'queued',
      'uploading',
      'upload interrupted',
      'uploaded',
      'server received',
      'validated',
      'accepted',
      'parked',
    ],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    // "The device does not know whether the server received it" (L93983). That
    // is genuinely unknown, not known-offline, and the rule is not widened.
    connectivity: 'unknown',
    // L93996: never a spinner that lies. L94038 Panel 2: no worker-facing retry
    // control, because a worker cannot fix a server-side rejection.
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: DETERMINISTIC_UNCHANGED,
    aiActs: [],
  },
  absentCapability: {
    statement:
      'The Statement of Work does not specify keys or retry semantics, and payload and ordering '
      + 'semantics are explicitly deferred to the Functional Specification [SoW Fact — §7.10.3, '
      + 'referenced through DEC-SYNC-001]. What this storyboard fixes is the requirement rather '
      + 'than the encoding.',
    sourceRef: 'L93975',
  },
}

/* ====================================================================
 * 44A.16 — A BAD MODEL IS ROLLED BACK.
 * Card L94071, rows L94073-L94091. Surfaces L94095, rows L94097-L94101.
 * Acceptance L94128 (SIX). Tests L94130 (five).
 * ==================================================================== */

const STORYBOARD_16: Storyboard = {
  number: 16,
  identifier: 'SB-AI-16',
  fallback: { chapter: '44A.16', identifier: 'FB-AI-16' },
  cardHeaderRef: 'L94071',
  surfaceTableRef: 'L94095',
  content: {
    identifier: 'SB-AI-16; fallback contract FB-AI-16; extends FB-AGT-VIS-02',
    preconditions:
      'A deployed agent or model version showing degraded health; a previous verified version '
      + 'available',
    trigger: 'A rollback decision under the maker-checker discipline',
    actorsAndRoles:
      'Daniel, Platform Engineer — maker; Noah, Admin — approver; Aisha, Root Super Admin — for '
      + 'critical-class elements; tenants as affected parties',
    workerVisibleExperience:
      'Coaching and briefs become unavailable during the transition; the honest unavailable state '
      + 'renders; every gate and hold is unaffected',
    automaticFallback:
      'Checkpoint and park in-flight agent runs; restore the previous verified version',
    manualFallback:
      'Disable the agent for the affected scope, reverting every dependent behaviour to its '
      + 'deterministic path',
    fallbackOfFallback: 'Platform-wide or per-tenant emergency pause [SoW Fact — §8.7.5]',
    safeStop:
      'Agents unavailable, deterministic layer untouched, every raised gate still decidable by a '
      + 'human',
    localData:
      'Devices are unaffected unless the withdrawn artifact was device-resident, which is '
      + 'storyboard 17',
    centralData:
      'Version history, rollback decision with maker and approver, withdrawal markers on every '
      + 'affected output',
    notifications:
      'Tenant Command Centers show the honest state; platform notifications to affected tenants '
      + 'follow the platform communications mechanism [SoW Fact — §8.14]',
    reconnection:
      'Not applicable — this is a server-side change; devices experience it as agent '
      + 'unavailability',
    conflictResolution:
      'Where the withdrawn version and the restored version disagree about a past output, neither '
      + 'is retro-applied; the divergence is recorded',
    finalOfficialState:
      'Previous version in force; withdrawn version’s outputs retained and marked; affected '
      + 'decisions listed for optional human review',
    audit:
      'Deployment, health degradation, rollback submission and approval, checkpointing, '
      + 'restoration, resume, and every withdrawal marker',
    recoveryObjectives: 'TBD — Client Decision Required — DEC-AIRTO-001 and DEC-ROLLOUT-001',
    residualRisk:
      'A rollback restores a version that was itself imperfect; without the evaluation scenarios '
      + 'that caught the regression being added permanently, the same regression can return',
    sourceStatus:
      'Migration management and approval cycling are SoW Fact — §8.3.5, §8.8.3; rollout and '
      + 'rollback scope is DEC-ROLLOUT-001',
  },
  surfaces: {
    DOH: affected(
      'Retains every agent output with its version attribution and any withdrawal marker',
      'L94097',
    ),
    STU: affected(
      'Composed-agent status mirrors back from the platform review [SoW Fact — §8.3.4]; authoring '
      + 'is unaffected',
      'L94098',
    ),
    CC: affected(
      'Agent activity panel shows the honest unavailability and then the restored state; the '
      + 'health flag persists until resolved',
      'L94099',
    ),
    FL: affected(
      'Coaching falls back per section 44.1; every gate, limit, and hold is untouched',
      'L94100',
    ),
    SA: affected(
      'Owns the whole sequence: health metrics, submission, approval, checkpointing, restoration, '
      + 'and the audit',
      'L94101',
    ),
  },
  audit: [
    { id: 'deployment', statement: 'Deployment', sourceRef: 'L94088' },
    { id: 'healthDegradation', statement: 'Health degradation', sourceRef: 'L94088' },
    {
      id: 'rollbackSubmissionAndApproval',
      statement: 'Rollback submission and approval',
      sourceRef: 'L94088',
    },
    { id: 'checkpointing', statement: 'Checkpointing', sourceRef: 'L94088' },
    { id: 'restoration', statement: 'Restoration', sourceRef: 'L94088' },
    { id: 'resume', statement: 'Resume', sourceRef: 'L94088' },
    {
      id: 'withdrawalMarkers',
      statement: 'Every withdrawal marker',
      sourceRef: 'L94088',
    },
  ],
  finalOfficialState: {
    name:
      'Previous version in force; withdrawn version’s outputs retained and marked; affected '
      + 'decisions listed for optional human review',
    derivedFrom: ['restoration', 'withdrawalMarkers'],
  },
  facts: {
    // L94085: a server-side change. Devices experience it as agent
    // unavailability; no command is issued to any device.
    deviceAcknowledgement: 'noDeviceCommand',
    surfacesShowingApplied: [],
    // Coaching falls back to authored content per section 44.1 (L94100).
    contentOrigin: 'authored',
    inference: 'noInference',
    gateOutcome: 'noGate',
    stateNamesShown: [
      'unavailable',
      'parked',
      'previous version in force',
      'withdrawn',
    ],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    connectivity: 'online',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    // AC-44A-16-6 (L94128): the deterministic layer is unaffected in every
    // respect. TEST-44A-16-4 asserts no gate outcome changes across the
    // rollback.
    deterministicStandings: DETERMINISTIC_UNCHANGED,
    // L94069: nothing is reversed automatically; reviewing affected decisions
    // is a human choice.
    aiActs: [],
  },
  absentCapability: null,
}

/* ====================================================================
 * 44A.17 — ONE DEVICE HAS A CORRUPT MODEL.
 * Card L94155, rows L94157-L94175. Surfaces L94179, rows L94181-L94185.
 * Acceptance L94211 (five). Tests L94213 (four).
 *
 * `DEC-SCAN-001` is named at L94142 in this section's narrative. It is in
 * NEITHER §44A.31's twenty-row decision register (L95377-L95396) nor its
 * eighteen-item canon list (L95398) — both counted here — so `TEST-44A-31-2`
 * fails as written. It is registered elsewhere in the blueprint-wide canon
 * (L34739, L105483, L113478 among others). Reported to wave 5; not added to a
 * register here and not given an invented home.
 *
 * The Frontline wordings quoted at L94205 are not declared as `fixedMessages`
 * for the same reason as 44A.12's confirmation: `PINNED_WORKER_MESSAGES` pins
 * `SCR-FL-LOCK-01` only, and the source rules no paraphrase prohibition over
 * these two the way L94876 does over that one.
 * ==================================================================== */

const STORYBOARD_17: Storyboard = {
  number: 17,
  identifier: 'SB-AI-17',
  fallback: { chapter: '44A.17', identifier: 'FB-AI-17' },
  cardHeaderRef: 'L94155',
  surfaceTableRef: 'L94179',
  content: {
    identifier:
      'SB-AI-17; fallback contract FB-AI-17; extends FB-AGT-VIS-03; conditional on '
      + 'DEC-LOCALAI-001 and DEC-VISION-004',
    preconditions:
      'A device-resident artifact exists; TAB-014 holds a corrupt copy; the rest of the fleet is '
      + 'healthy',
    trigger: 'An integrity or version check fails on one device',
    actorsAndRoles:
      'Maya, Worker on TAB-014; Daniel, Platform Engineer — fleet health; Priya, Tenant Admin — '
      + 'sees the device flag in the tenant view',
    workerVisibleExperience:
      'The dependent help is absent and the authored path renders. The worker sees a plain '
      + 'statement where the feature is visible at all, and no technical detail',
    automaticFallback:
      'Local feature disablement and reversion to the authored or deterministic path',
    manualFallback:
      'The Supervisor swaps the tablet for a healthy one; the worker’s runs are reassigned '
      + 'through action 8',
    fallbackOfFallback:
      'Where no spare device exists, the worker continues on the authored path indefinitely; every '
      + 'safety guarantee is intact because none of them depends on the artifact',
    safeStop:
      'One device without an optional capability. No run stops, no gate relaxes, no hold changes',
    localData:
      'The failure record with artifact identity and observed versus expected values; the '
      + 'disabled-feature state',
    centralData: 'The device’s health record; the queued replacement artifact; the fleet flag',
    notifications:
      'No worker notification; a fleet-health signal to the client’s platform team; a device '
      + 'flag visible to the Tenant Admin in the tenant view of platform administration',
    reconnection:
      'The failure uploads; the replacement artifact downloads and is verified before use',
    conflictResolution:
      'None arises; one device’s artifact state is independent of every other device’s',
    finalOfficialState:
      'Either the device holds a verified artifact and the feature is restored, or the feature '
      + 'stays disabled on that device and the device is flagged',
    audit:
      'Verification failure, feature disablement, replacement dispatch, re-verification, '
      + 'restoration or continued flagging',
    recoveryObjectives:
      'TBD — Client Decision Required — DEC-AIRTO-001; replacement delivery is device-sync-bound',
    residualRisk:
      'A silent partial corruption that passes a weak checksum would be worse than an obvious one, '
      + 'so verification strength is a real engineering choice rather than a formality',
    sourceStatus:
      'User-Mandated Product Extension conditional on DEC-LOCALAI-001 and DEC-VISION-004; the '
      + 'containment principle is Derived Clarification',
  },
  surfaces: {
    DOH: affected(
      'Records the device health event; the tenant view of platform administration shows the '
      + 'device flag',
      'L94181',
    ),
    STU: noEffect('authored content is unaffected by an artifact failure', 'L94182'),
    CC: affected(
      'Sync state and connectivity module shows the device with its flag; the agent activity panel '
      + 'shows reduced activity for that device only',
      'L94183',
    ),
    FL: affected(
      'Disables the feature locally; renders the authored path; records and uploads the failure',
      'L94184',
    ),
    SA: affected(
      'Devices and fleet section owns the flag, the replacement dispatch, and the escalation to '
      + 'physical attention',
      'L94185',
    ),
  },
  audit: [
    { id: 'verificationFailure', statement: 'Verification failure', sourceRef: 'L94172' },
    { id: 'featureDisablement', statement: 'Feature disablement', sourceRef: 'L94172' },
    { id: 'replacementDispatch', statement: 'Replacement dispatch', sourceRef: 'L94172' },
    { id: 'reVerification', statement: 'Re-verification', sourceRef: 'L94172' },
    {
      id: 'restorationOrContinuedFlagging',
      statement: 'Restoration or continued flagging',
      sourceRef: 'L94172',
    },
  ],
  finalOfficialState: {
    name:
      'Either the device holds a verified artifact and the feature is restored, or the feature '
      + 'stays disabled on that device and the device is flagged',
    derivedFrom: ['reVerification', 'restorationOrContinuedFlagging'],
  },
  facts: {
    // A replacement artifact is queued as a command-channel version-change
    // action and applies at the device's NEXT sync (L94152). Until then it is
    // not acknowledged, and the console shows a command state, not an applied
    // one (L94207).
    deviceAcknowledgement: 'notAcknowledged',
    surfacesShowingApplied: [],
    // L94149: the dependent behaviour reverts to its deterministic or authored
    // path — human inspection for vision, the curated default from the pinned
    // package for local selection.
    contentOrigin: 'authored',
    // The feature is DISABLED rather than run and failed: L94148, the device
    // does not retry against a failed integrity check and never degrades
    // gracefully into guessing (L94140).
    inference: 'noInference',
    gateOutcome: 'noGate',
    stateNamesShown: [
      'verification failed',
      'feature disabled on this device',
      'flagged for physical attention',
      'restored',
    ],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    // The failure uploads at the next sync, so connectivity at render time is
    // not stated either way.
    connectivity: 'unknown',
    showsSpinner: false,
    // L94205 Panel 3: no technical error, no checksum, no retry control.
    showsRetryControl: false,
    fixedMessages: [],
    // AC-44A-17-5 (L94211): no safety behaviour on the affected device changes
    // in any way.
    deterministicStandings: DETERMINISTIC_UNCHANGED,
    aiActs: [],
  },
  absentCapability: {
    statement:
      'Not specified in the Statement of Work for V1, because no model is device-resident: the '
      + 'reasoning layer is server-side and online-only [SoW Fact — §7.9.1, layer (c)]. This '
      + 'storyboard is conditional on DEC-LOCALAI-001 or on DEC-VISION-004 placing vision '
      + 'inference on the device. Note also that the standardised device profile is owed by the '
      + 'client [DEC-DEVICE-001], as is the scanner hardware list [DEC-SCAN-001]. A per-device '
      + 'artifact strategy on an unknown fleet is an open risk, not a design detail.',
    sourceRef: 'L94140',
  },
}

/* ====================================================================
 * 44A.18 — ARTIFICIAL INTELLIGENCE IS DISABLED FOR ONE TENANT.
 * Card L94238, rows L94240-L94258. Surfaces L94262, rows L94264-L94268.
 * Acceptance L94296 (five). Tests L94298 (five).
 * ==================================================================== */

const STORYBOARD_18: Storyboard = {
  number: 18,
  identifier: 'SB-AI-18',
  fallback: { chapter: '44A.18', identifier: 'FB-AI-18' },
  cardHeaderRef: 'L94238',
  surfaceTableRef: 'L94262',
  content: {
    identifier: 'SB-AI-18; fallback contract FB-AI-18',
    preconditions:
      'TEN-BRIGHTBIKES operating normally; a cause for a per-tenant pause or disablement',
    trigger:
      'A per-tenant emergency pause, a tier entitlement boundary, or a tenant feature override',
    actorsAndRoles:
      'Daniel, Platform Engineer — maker; Noah, Admin — approver; Aisha, Root Super Admin — '
      + 'critical-class approval; Priya, Tenant Admin — sees the tenant-side statement; Sam and '
      + 'Elena — work through the degraded state',
    workerVisibleExperience:
      'Authored Work Instructions instead of coaching cards; no other change. Workers are not told '
      + 'about tenant-level platform decisions, which are not their concern',
    automaticFallback:
      'Every agent-dependent behaviour falls to its deterministic or authored path per sections '
      + '44.1 to 44.4',
    manualFallback:
      'Supervisors and Quality Managers work from deterministic records; the deterministic handoff '
      + 'pack applies where DEC-HANDOFF-001 is decided in favour',
    fallbackOfFallback:
      'Where a tenant’s operations cannot proceed acceptably without agents, that is a '
      + 'commercial and operational conversation, not a technical fallback; the platform does not '
      + 'degrade safety to compensate',
    safeStop:
      'Full deterministic operation, honest unavailability, parked agent runs, decidable gates',
    localData:
      'Unchanged; devices carry their pinned packages and full deterministic capability',
    centralData:
      'The pause or disablement record with maker, approver, scope, and time; parked agent-run '
      + 'checkpoints',
    notifications:
      'Tenant Command Centers show the state; platform communications to the tenant follow §8.14; '
      + 'in-app notifications cannot be muted [SoW Fact — §4.9.1]',
    reconnection:
      'Not applicable — this is a tenant-scope platform state, not a connectivity condition',
    conflictResolution:
      'Precedence among global disable, tenant override, and tier entitlement is unresolved — '
      + 'DEC-FEAT-003, DEC-FEAT-004. Both readings preserved',
    finalOfficialState:
      'The tenant operates deterministically with agents unavailable, until a separately approved '
      + 'resume',
    audit:
      'Submission, approval, scope, entry, each parked run, resume, and exit — all critical-class '
      + 'audited',
    recoveryObjectives:
      'Not applicable to a deliberate pause; TBD — Client Decision Required where the cause is a '
      + 'fault — DEC-AIRTO-001',
    residualRisk:
      'A long pause silently changes what the tenant is paying for; the usage and entitlement '
      + 'conversation must follow the technical one',
    sourceStatus:
      'SoW Fact — §8.7.5, §8.8.3, §8.11; precedence questions are DEC-FEAT-003, DEC-FEAT-004, '
      + 'DEC-FEAT-005',
  },
  surfaces: {
    DOH: affected(
      'Records the state; every operational record continues to be filed normally',
      'L94264',
    ),
    STU: affected(
      'Agent configuration is visible but the agents are unavailable; the distinction between '
      + 'configured-off and platform-paused is displayed',
      'L94265',
    ),
    CC: affected(
      '“Agents paused by the platform”; gate queue retains decidable items; deviation '
      + 'workspaces render deterministically',
      'L94266',
    ),
    FL: affected(
      'Authored Work Instructions; every gate, limit, classification, and hold unchanged',
      'L94267',
    ),
    SA: affected(
      'Owns the pause, its approval, its scope, and its resume; shows which tenants are paused and '
      + 'why',
      'L94268',
    ),
  },
  audit: [
    { id: 'submission', statement: 'Submission', sourceRef: 'L94255' },
    { id: 'approval', statement: 'Approval', sourceRef: 'L94255' },
    { id: 'scope', statement: 'Scope', sourceRef: 'L94255' },
    { id: 'entry', statement: 'Entry', sourceRef: 'L94255' },
    { id: 'parkedRuns', statement: 'Each parked run', sourceRef: 'L94255' },
    { id: 'resume', statement: 'Resume', sourceRef: 'L94255' },
    { id: 'exit', statement: 'Exit — all critical-class audited', sourceRef: 'L94255' },
  ],
  finalOfficialState: {
    name:
      'The tenant operates deterministically with agents unavailable, until a separately approved '
      + 'resume',
    derivedFrom: ['scope', 'entry', 'resume'],
  },
  facts: {
    // L94252: a tenant-scope platform state, not a connectivity condition.
    // Devices are unchanged and no command is issued to one.
    deviceAcknowledgement: 'noDeviceCommand',
    surfacesShowingApplied: [],
    contentOrigin: 'authored',
    inference: 'noInference',
    gateOutcome: 'noGate',
    stateNamesShown: [
      'agents paused by the platform',
      'parked',
      'configured-off',
      'platform-paused',
      'unavailable',
    ],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    connectivity: 'online',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    // AC-44A-18-5 (L94296): the on-device deterministic layer is unaffected,
    // verifiably, with the device offline.
    deterministicStandings: DETERMINISTIC_UNCHANGED,
    // L94235: parked runs do not resume by timer, and resume is a separately
    // approved human act. No reserved act is performed.
    aiActs: [],
  },
  absentCapability: null,
}

/* ====================================================================
 * 44A.19 — PLATFORM-WIDE ARTIFICIAL-INTELLIGENCE OUTAGE.
 * Card L94323, rows L94325-L94343. Surfaces L94347, rows L94349-L94353.
 * Acceptance L94378 (five). Tests L94380 (five).
 * ==================================================================== */

const STORYBOARD_19: Storyboard = {
  number: 19,
  identifier: 'SB-AI-19',
  fallback: { chapter: '44A.19', identifier: 'FB-AI-19' },
  cardHeaderRef: 'L94323',
  surfaceTableRef: 'L94347',
  content: {
    identifier: 'SB-AI-19; fallback contract FB-AI-19',
    preconditions:
      'Multiple tenants operating normally; a shared dependency of the reasoning layer degrades',
    trigger: 'Health degradation visible across more than one tenant',
    actorsAndRoles:
      'The client’s platform operations team; Daniel, Noah and Aisha for pause and broadcast '
      + 'approvals; every tenant’s Supervisors and Quality Managers as affected parties',
    workerVisibleExperience:
      'Authored Work Instructions instead of coaching cards. Nothing else. A worker should be able '
      + 'to complete a full shift without noticing a platform incident, and that is the design '
      + 'intent',
    automaticFallback:
      'Every agent-dependent behaviour falls to its deterministic or authored path',
    manualFallback:
      'Supervisors and Quality Managers work from deterministic records across every tenant',
    fallbackOfFallback:
      'The platform-wide emergency pause as a deliberate containment action, with its fixed '
      + 'semantics',
    safeStop:
      'Full deterministic operation platform-wide, honest unavailability everywhere, parked agent '
      + 'runs, decidable gates',
    localData:
      'Unchanged everywhere; every device holds its pinned package and its full deterministic '
      + 'capability',
    centralData:
      'The platform incident record; per-tenant flags; parked checkpoints; the broadcast record '
      + 'where one is issued',
    notifications:
      'Per-tenant honest flags; optional all-tenant broadcast as a critical-class action; in-app '
      + 'notifications cannot be muted',
    reconnection:
      'Not applicable at the device level; devices are unaffected by a server-side reasoning '
      + 'outage except for the absence of agent output',
    conflictResolution:
      'None arises between tenants; isolation is an ENFORCED invariant [SoW Fact — §8.7.4]',
    finalOfficialState:
      'Every tenant’s operational records are complete and correct for the outage window, '
      + 'with agent outputs absent and their absence recorded',
    audit:
      'Incident declaration, per-tenant flags, any pause and its approvals, the broadcast, staged '
      + 'recovery, and resume',
    recoveryObjectives:
      'TBD — Client Decision Required — DEC-AIRTO-001. This is the scenario where the absence of '
      + 'a stated objective is most commercially visible',
    residualRisk:
      'Prolonged platform-wide agent absence degrades prevention and situational awareness across '
      + 'every tenant simultaneously, which is a concentration risk inherent to a single shared '
      + 'reasoning layer',
    sourceStatus: 'SoW Fact — §6.9.3, §8.1.3, §8.7.5, §8.8.3',
  },
  surfaces: {
    DOH: affected(
      'Every tenant’s records continue to be filed; agent-output absence is recorded per '
      + 'record',
      'L94349',
    ),
    STU: affected(
      'Authoring and publication continue for every tenant; agents show as unavailable rather than '
      + 'off',
      'L94350',
    ),
    CC: affected(
      'Each tenant sees its own honest flag; no tenant is shown another tenant’s state',
      'L94351',
    ),
    FL: affected(
      'Authored Work Instructions; every deterministic guarantee intact, including offline',
      'L94352',
    ),
    SA: affected(
      'Owns the incident, the diagnosis, the pause, the broadcast, the staged recovery, and the '
      + 'audit',
      'L94353',
    ),
  },
  audit: [
    { id: 'incidentDeclaration', statement: 'Incident declaration', sourceRef: 'L94340' },
    { id: 'perTenantFlags', statement: 'Per-tenant flags', sourceRef: 'L94340' },
    {
      id: 'pauseAndApprovals',
      statement: 'Any pause and its approvals',
      sourceRef: 'L94340',
    },
    { id: 'broadcast', statement: 'The broadcast', sourceRef: 'L94340' },
    { id: 'stagedRecovery', statement: 'Staged recovery', sourceRef: 'L94340' },
    { id: 'resume', statement: 'Resume', sourceRef: 'L94340' },
  ],
  finalOfficialState: {
    name:
      'Every tenant’s operational records are complete and correct for the outage window, '
      + 'with agent outputs absent and their absence recorded',
    derivedFrom: ['incidentDeclaration', 'perTenantFlags', 'stagedRecovery'],
  },
  facts: {
    deviceAcknowledgement: 'noDeviceCommand',
    surfacesShowingApplied: [],
    contentOrigin: 'authored',
    inference: 'noInference',
    gateOutcome: 'noGate',
    stateNamesShown: [
      'platform incident declared',
      'unavailable',
      'parked',
      'restored',
    ],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    // AC-44A-19-1 (L94378) asserts the guarantee on every device INCLUDING
    // offline ones, so the storyboard spans both and states neither.
    connectivity: 'unknown',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    // L94310: every quality guarantee continues to hold, because every one of
    // them is deterministic and on-device.
    deterministicStandings: DETERMINISTIC_UNCHANGED,
    aiActs: [],
  },
  absentCapability: null,
}

/* ====================================================================
 * 44A.20 — RECONNECTION FAILS MIDWAY.
 * Card L94403, rows L94405-L94423. Surfaces L94427, rows L94429-L94433.
 * Acceptance L94457 (SIX). Tests L94459 (SIX) — counted at both lines. This is
 * one of only two sections in the chapter carrying six of each.
 * ==================================================================== */

const STORYBOARD_20: Storyboard = {
  number: 20,
  identifier: 'SB-AI-20',
  fallback: { chapter: '44A.20', identifier: 'FB-AI-20' },
  cardHeaderRef: 'L94403',
  surfaceTableRef: 'L94427',
  content: {
    identifier: 'SB-AI-20; fallback contract FB-AI-20',
    preconditions:
      'TAB-014 with a queue of captures and a queue of pending commands; intermittent connectivity',
    trigger: 'Connectivity loss during an in-progress sync',
    actorsAndRoles:
      'Maya, Worker; Sam, Supervisor watching the sync-state module; Elena, Quality Manager for '
      + 'any conflict resolution',
    workerVisibleExperience:
      'The sync indicator shows progress and then shows an interrupted state with an outstanding '
      + 'count. It never shows a completed tick for an interrupted sync',
    automaticFallback:
      'Resume from the last completed item on the next connectivity window, with the same keys and '
      + 'order',
    manualFallback:
      'The worker moves the tablet to a known-good coverage area; the Supervisor may collect the '
      + 'device',
    fallbackOfFallback:
      'Persistently failing items park in a dead-letter state with a named owner and appear in the '
      + 'Command Center’s sync-conflict review panel where a human decision is needed',
    safeStop:
      'The device holds its data durably and continues working offline; nothing is lost, nothing '
      + 'is duplicated, nothing is presented as synced',
    localData:
      'The full queue with per-item states; applied commands with their identifiers; parked items',
    centralData:
      'Items received so far with their own states; the device’s last successful sync time; '
      + 'outstanding counts',
    notifications:
      'The connectivity-loss protocol applies at 30, 60, and 120 minutes: platform alert, Tenant '
      + 'Admin banner, on-call escalation [SoW Fact — §1.7]',
    reconnection:
      'Resumption from the last completed item; no restart from the beginning; no re-sending of '
      + 'already-acknowledged items except under idempotent retry',
    conflictResolution:
      'Where an offline write conflicts with a central change, the item enters the sync-conflict '
      + 'review panel; resolution is Quality Manager and above, with Supervisors viewing only '
      + '[SoW Fact — §3.5, §6.1.6]',
    finalOfficialState:
      'Every item reaches a terminal state: accepted, rejected with a reason, parked for review, '
      + 'or resolved through the conflict panel',
    audit:
      'Every sync attempt, every item state transition, every parking, and every conflict '
      + 'resolution',
    recoveryObjectives:
      'Recovery Point Objective is effectively zero for locally committed data, because the durable '
      + 'queue discards nothing. Service-side objectives are TBD — Client Decision Required — '
      + 'DEC-AIRTO-001',
    residualRisk:
      'A device that never reaches sustained coverage accumulates a growing queue; storyboard 23 '
      + 'governs the storage consequence',
    sourceStatus:
      'Connectivity-loss protocol values are SoW Fact — §1.7; ordering is the adopted DEC-SYNC-001 '
      + 'position, Derived Clarification — adopted working position; storage behaviour is '
      + 'DEC-STORE-001, still open',
  },
  surfaces: {
    DOH: affected(
      'Records what it has actually received; never infers the rest; owns the conflict record',
      'L94429',
    ),
    STU: noEffect('the Studio has no role in device synchronisation', 'L94430'),
    CC: affected(
      'Sync state and connectivity module shows the device’s last successful sync, '
      + 'outstanding count, and freshness class; the sync-conflict review panel holds items '
      + 'needing a decision',
      'L94431',
    ),
    FL: affected(
      'Shows per-item states and an honest interrupted indicator; continues full offline operation',
      'L94432',
    ),
    SA: affected(
      'Fleet-level connectivity telemetry; the connectivity-loss protocol’s platform alert at '
      + '30 minutes',
      'L94433',
    ),
  },
  audit: [
    { id: 'syncAttempts', statement: 'Every sync attempt', sourceRef: 'L94420' },
    {
      id: 'itemStateTransitions',
      statement: 'Every item state transition',
      sourceRef: 'L94420',
    },
    { id: 'parkings', statement: 'Every parking', sourceRef: 'L94420' },
    {
      id: 'conflictResolutions',
      statement: 'Every conflict resolution',
      sourceRef: 'L94420',
    },
  ],
  finalOfficialState: {
    name:
      'Every item reaches a terminal state: accepted, rejected with a reason, parked for review, '
      + 'or resolved through the conflict panel',
    derivedFrom: ['itemStateTransitions', 'parkings', 'conflictResolutions'],
  },
  facts: {
    // The sync is interrupted with items outstanding, so the storyboard
    // terminates with commands unacknowledged.
    deviceAcknowledgement: 'notAcknowledged',
    // L94409: it never shows a completed tick for an interrupted sync. L94429:
    // the Hub records what it has actually received and never infers the rest.
    surfacesShowingApplied: [],
    contentOrigin: 'authored',
    inference: 'noInference',
    gateOutcome: 'noGate',
    // The honest per-item states. "Nothing is presented as synced" (L94413) is
    // the reason none of these normalises to a collapsed name.
    stateNamesShown: [
      'queued',
      'upload interrupted',
      'interrupted',
      'accepted',
      'rejected with a reason',
      'parked for review',
      'resolved through the conflict panel',
    ],
    outcomeIsPartial: true,
    // L94399: both sides show a partial state honestly.
    partialLabelledPartial: true,
    connectivity: 'knownOffline',
    // L94451 Panel 3: no completed tick, no percentage that has stopped moving,
    // and no wording implying the sync finished.
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: DETERMINISTIC_UNCHANGED,
    // L94401: a safety-class command is never bypassed, and where it cannot be
    // applied the device reports the failure and does not proceed as if it had
    // been applied.
    aiActs: [],
  },
  absentCapability: {
    statement:
      'This storyboard sits directly on top of DEC-SYNC-001: the Statement of Work never fixes '
      + 'whether a reconnecting device uploads pending captures before or after pulling pending '
      + 'commands. Payload and ordering semantics are explicitly deferred to the Functional '
      + 'Specification. The adopted position is Option C, taken because it is the safer reading '
      + '[Derived Clarification — adopted working position — DEC-SYNC-001, adopted 2026-08-14, '
      + 'open for client ratification], and both source readings are preserved in the decision '
      + 'card.',
    sourceRef: 'L94390',
  },
}

/**
 * The ten, in section order. A literal list rather than a generated one, so a
 * card going missing is a red test rather than a shorter array.
 */
export const STORYBOARDS_11_TO_20 = [
  STORYBOARD_11,
  STORYBOARD_12,
  STORYBOARD_13,
  STORYBOARD_14,
  STORYBOARD_15,
  STORYBOARD_16,
  STORYBOARD_17,
  STORYBOARD_18,
  STORYBOARD_19,
  STORYBOARD_20,
] as const satisfies readonly Storyboard[]

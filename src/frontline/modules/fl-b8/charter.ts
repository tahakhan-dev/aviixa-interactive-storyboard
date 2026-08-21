/**
 * `MOD-FL-B8` — Coaching Rendering. THE IDENTITY CARD, TRANSCRIBED.
 *
 * Frozen source §22.17, which opens at L41448. Identity card L41454-L41462 on
 * the chapter's alternating text/blank-line rhythm, which is why the even
 * lines are cited and the odd ones are not. The remaining card fields carry
 * their own lines and are cited individually.
 *
 * THE ONE THING A READER OF THIS FILE HAS TO CARRY AWAY. Coaching is advisory
 * and never gates (L41471), and the defect this module is most able to ship is
 * a coaching card built as a modal that must be dismissed — which converts an
 * advisory into a gate and ships as ordinary competent UI work. So the card is
 * a `<section>` and never a dialog, and `B8Guidance` in `service.ts` carries
 * `gates: false` and `dismissRequired: false` as LITERAL types, so a build that
 * gated on a dismissal would not compile.
 *
 * THE SECOND THING. §3.3 (L1994-L2008) makes "support, not surveillance" three
 * concrete prohibitions and one data-handling rule, and this module is the
 * single most likely place in this surface for a surveillance affordance to
 * appear as a kindness. `RISK-FL-B8-1` (L39250) names the risk in the source's
 * own words: "dismissal recording can be perceived as monitoring". Nothing here
 * counts, compares, or ranks anything, and nothing renders a per-worker
 * history.
 *
 * WHAT "TRANSCRIBED" MEANS HERE, EXACTLY — the discipline `fl-a5` settled and
 * `fl-a6` restated. Each statement's `text` is the card field's own prose with
 * the inline `[SoW Fact — §x.y]` classification markers lifted out into
 * `sourceClass`, and nothing else altered. Where something is left out of a
 * field it is declared in `elision`, never silently dropped.
 *
 * ONE FIELD IS NOT TRANSCRIBED WHOLE, AND THE GROUND IS CATEGORICAL. L41502's
 * closing clause carries a word `AC-FL-000-5` (L39100) excludes from every
 * rendered screen in this scope. `fl-a3` settled the idiom for exactly this
 * case — decline the wording, state why, and prove by looking that the line
 * really does carry the word — and this module follows it. The clause's
 * substance is not lost: the governance binding it states is disclosed through
 * `DEC-GATE-001` in `service.ts`, from two lines that carry no excluded word.
 */

/** How the source classifies the claim, in the source's own vocabulary. */
export type B8SourceClass = 'SoW Fact' | 'Derived Clarification'

export interface B8CardStatement {
  /** The card field's own label, verbatim. */
  readonly field: string
  readonly text: string
  readonly sourceRef: string
  /**
   * The field's own inline `[SoW Fact — §x.y]` marker, lifted out.
   *
   * `null` WHERE THE CARD CARRIES NO MARKER, and that is a recorded absence
   * rather than a default. TEN of the twenty-two fields carry no
   * classification marker of their own and §22.17's Source status paragraph
   * (L41596) does not name them either. Filling those ten with `SoW Fact`
   * because their neighbours carry it would be this build inventing a
   * classification the source withheld.
   */
  readonly sourceClass: B8SourceClass | null
  /**
   * What was left out of this field's prose, and where it went instead.
   * `null` where the field is carried whole, which is twenty-one of
   * twenty-two.
   */
  readonly elision: string | null
}

/**
 * TWENTY-TWO CARD FIELDS. Five of them — Identifier, Purpose, User benefit,
 * Owning surface, Roles that see and use it — are the identity card proper at
 * L41454-L41462. The other seventeen are the rest of §22.17's card and each
 * carries its own line.
 *
 * THE STATES FIELD (L41484) IS NOT ONE OF THE TWENTY-TWO. It is a list of five
 * identifiers rather than prose, and it is carried in `B8_STATES` below with
 * the one gloss the source gives and the four it withholds.
 */
export const B8_CARD = [
  {
    field: 'Identifier and name',
    text: 'MOD-FL-B8. Name. Coaching Rendering.',
    sourceRef: 'MOD-FL-B8 · L41454',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Purpose',
    text:
      "To render Prevention Agent cards at the step where they help, in the worker's language, from " +
      "authored and approved content, with the step's authored Work Instructions as the offline " +
      'fallback.',
    sourceRef: 'L41456',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'User benefit',
    text:
      'Help arrives at the moment of difficulty rather than in a binder across the shop floor, and it ' +
      'never becomes a performance record.',
    sourceRef: 'L41458',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Owning surface',
    text:
      'Frontline Worker Application (SURF-FL) renders. The Standards and Operations Studio authors and ' +
      'approves coaching content and the repeated-coaching pattern definition. The Prevention Agent ' +
      'selects, server-side.',
    sourceRef: 'L41460',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Roles that see and use it',
    text:
      'Worker, who sees and interacts with cards. Supervisor, who receives a signal only on the ' +
      'repeated-coaching pattern, not on a single dismissal.',
    sourceRef: 'L41462',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Preconditions',
    text:
      'An active step within a Run. For agent-selected cards, connectivity and an available agent ' +
      "layer. For the fallback, the pinned package's authored Work Instructions, which are always " +
      'present.',
    sourceRef: 'L41476',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Inputs',
    text:
      "The step context; the worker's profile language; the tenant's approved corpus, searched " +
      'server-side; the short coaching assets carried in the package; Studio-authored timing ' +
      'thresholds that may trigger a card.',
    sourceRef: 'L41478',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Outputs',
    text:
      'Rendered cards; replay events; dismissal events recorded as learning signals and as a ' +
      'supervisor-visibility signal; the repeated-coaching pattern signal where the Studio-defined ' +
      'pattern is met.',
    sourceRef: 'L41480',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Objects affected',
    text:
      'OBJ-FL-COACHEVENT the coaching interaction record. No operational record is altered by ' +
      'coaching, which is what makes it advisory.',
    sourceRef: 'OBJ-FL-COACHEVENT · L41482',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Alternate paths',
    text:
      "Offline, the step's authored Work Instructions serve as the fallback. A dismissal, recorded but " +
      'silent to the supervisor by default. A repeated-coaching pattern, escalating to an actionable ' +
      'signal. A timing-threshold trigger, which produces a card and never a stopwatch.',
    sourceRef: 'L41494',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Online behaviour',
    text:
      "Cards are agent-selected from the approved corpus in the worker's profile language. Selection " +
      'is agentic; translation is never runtime.',
    sourceRef: 'L41496',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Offline behaviour',
    text:
      'The agent-selected card is absent, because the reasoning layer that selects is server-side and ' +
      "online-only. The fallback is the step's authored Work Instructions, which already travel inside " +
      'the Workflow package — the same released, approved material that walks the worker through the ' +
      'step, rendered in its authored languages. What is absent offline is only the agent-selected ' +
      'card; the guidance itself never disappears.',
    sourceRef: 'L41498',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Reconnect behaviour',
    text:
      'Agent selection resumes at subsequent steps. Queued dismissal and replay events upload as ' +
      'learning signals. No retroactive card is shown for a step already completed, because a coaching ' +
      'card is a nudge at the step and a late nudge is noise',
    sourceRef: 'L41500',
    sourceClass: 'Derived Clarification',
    elision: null,
  },
  {
    field: 'Artificial-intelligence behaviour',
    text:
      'The Prevention Agent is an action agent that reaches a worker, and it operates entirely under ' +
      'pre-authorised, Studio-authored policy whose bounds — when it may fire, what it may show — were ' +
      'approved at authoring. Selection is agentic and runs online only. The platform never invents ' +
      'content, rules, or thresholds, and nothing an agent proposes reaches a worker or changes a ' +
      'record without a human gate or pre-authorised policy. The gating position carries a ' +
      'contradiction between §3.7 and §6.6.1 on one side and §8.3.2 and §8.3.3 on the other, preserved ' +
      'on the record as DEC-GATE-001; the adopted position binds this agent to authoring-time policy, ' +
      'so no per-event runtime gate stands between a selected asset and the worker, and every ' +
      'intervention is logged.',
    sourceRef: 'DEC-GATE-001 · L41502',
    sourceClass: 'SoW Fact',
    elision:
      "L41502's closing clause, on Lane A self-tuning of the agent's own selection preferences, is not " +
      'carried. Its own words include a term AC-FL-000-5 (L39100) excludes from every rendered screen ' +
      'in this scope, in any module, any state, any release, and this module renders no such word ' +
      'anywhere. Nothing is paraphrased in its place, because a paraphrase of an excluded clause reads ' +
      'as a transcription and is not one. The clause it sits beside — the DEC-GATE-001 governance ' +
      'binding — is disclosed in full in service.ts from L40952 and L41596, neither of which carries ' +
      'an excluded word.',
  },
  {
    field: 'No-artificial-intelligence behaviour',
    text:
      'The authored Work Instructions serve. This is the case offline, during a server-side agent ' +
      'outage, and during a platform-wide or per-tenant emergency pause, which renders as agent ' +
      'unavailability, never silence, and never suppresses the deterministic layer.',
    sourceRef: 'L41504',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Dependencies',
    text:
      'MOD-FL-A3 for the hosting step; MOD-FL-A6 for the package that carries the short coaching ' +
      'assets and the authored instructions; the agent layer for online selection; the Standards and ' +
      'Operations Studio for authored, approved, per-language content and the repeated-coaching ' +
      'pattern definition.',
    sourceRef: 'MOD-FL-A3 · L41506',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Interconnections',
    text:
      'Renders inside the Run Player as a state. Emits learning signals the agent layer consumes. ' +
      'Emits the pattern signal the Client Command Center renders.',
    sourceRef: 'L41508',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Audit',
    text:
      'Card offers, views, replays, and dismissals are recorded as operational events carrying the ' +
      'lighter envelope of who, where, when, and what happened. The repeated-coaching pattern signal ' +
      'is audited as a notification with its full state chain.',
    sourceRef: 'L41519',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Security',
    text:
      'Coaching content is authored, reviewed content in each supported language and is never ' +
      'machine-translated at runtime, which means no unreviewed text ever reaches a worker’s ' +
      "screen. The agent selects from the tenant's approved corpus only, which is the containment for " +
      'cross-tenant leakage; tenant isolation is absolute and nothing is shared across tenants. ' +
      'Because the agent reads captured free text as a learning signal, prompt injection is a live ' +
      "concern for the platform's memory stores; the containment on this surface is that the agent's " +
      'output is limited to selecting an approved asset rather than generating text, so an injected ' +
      'instruction cannot become worker-facing content.',
    sourceRef: 'L41521',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Fallback identifier',
    text:
      "FB-FL-AI-01 primary; FB-FL-CORE-01 for connectivity; FB-FL-PKG-01 where the package's authored " +
      'instructions are the concern.',
    sourceRef: 'FB-FL-AI-01 · L41523',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Recovery and reconciliation',
    text:
      'Recovery is agent availability, or reconnection. After an emergency pause, resume is a separate ' +
      'audited act. Reconciliation is Not applicable — coaching creates no operational record that can ' +
      'diverge; its learning signals are advisory and are folded in when they arrive.',
    sourceRef: 'L41525',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Failure, first fallback, fallback failure, terminal safe state, recovery, reconciliation',
    text:
      "The failure is the loss of the agentic layer. The first fallback is the step's authored Work " +
      'Instructions. The fallback failure would be the loss of those instructions, which cannot occur ' +
      'while the Run is executable because they are part of the pinned package; where the package ' +
      'itself is the problem, FB-FL-PKG-01 applies and the Run was never offered as ready. The ' +
      'terminal safe state is full execution with authored guidance only. Recovery is agent ' +
      'availability or reconnection, with resume after an emergency pause being a separate audited ' +
      'act. Reconciliation is not applicable, because coaching creates no operational record.',
    sourceRef: 'L41570',
    sourceClass: null,
    elision: null,
  },
] as const satisfies readonly B8CardStatement[]

/**
 * The one field whose prose this module does not carry whole. DERIVED from the
 * card rather than named a second time, so the count cannot drift from the
 * record.
 */
export const B8_CARD_ELISIONS: readonly B8CardStatement[] = (
  B8_CARD as readonly B8CardStatement[]
).filter((s) => s.elision !== null)

/* ==================================================================== *
 * THE STATES FIELD. L41484 lists five and glosses exactly one.
 *
 * `STATE-B8-FALLBACK` carries "where the authored Work Instructions serve in
 * place of a card". The other four are named and left bare, and `gloss` is
 * `null` for those four rather than filled with four descriptions that would
 * read as transcription.
 * ==================================================================== */

export interface B8StateRow {
  readonly id: string
  /** The state's own gloss at L41484, verbatim. `null` where the source gives none. */
  readonly gloss: string | null
  readonly sourceRef: string
}

export const B8_STATES = [
  { id: 'STATE-B8-OFFERED', gloss: null, sourceRef: 'STATE-B8-OFFERED · L41484' },
  { id: 'STATE-B8-VIEWED', gloss: null, sourceRef: 'STATE-B8-VIEWED · L41484' },
  { id: 'STATE-B8-REPLAYED', gloss: null, sourceRef: 'STATE-B8-REPLAYED · L41484' },
  { id: 'STATE-B8-DISMISSED', gloss: null, sourceRef: 'STATE-B8-DISMISSED · L41484' },
  {
    id: 'STATE-B8-FALLBACK',
    gloss: 'where the authored Work Instructions serve in place of a card',
    sourceRef: 'STATE-B8-FALLBACK · L41484',
  },
] as const satisfies readonly B8StateRow[]

/* ==================================================================== *
 * THE STORYBOARD. `SB-FL-017` — a card at the step, L41566.
 *
 * THREE FRAMES, AND THE THIRD IS THE GATE THIS MODULE IS CHECKED BY. Frame 3
 * is offline: the step's authored Work Instruction expanded in place, "with no
 * card and no message about the agent being unavailable". `TEST-B8-5` (L41591)
 * asks for the test, and the covering component suite reads the card region's
 * own text rather than the page's, because the page legitimately names agent
 * unavailability elsewhere — FB-FL-AI-01's own title is "The agentic and
 * reasoning layer is unavailable" and L41504 says the pause renders as agent
 * unavailability on the oversight surfaces.
 * ==================================================================== */

export interface B8Frame {
  readonly n: 1 | 2 | 3
  readonly text: string
  readonly sourceRef: string
}

export const SB_FL_017 = {
  id: 'SB-FL-017',
  title: 'a card at the step',
  frames: [
    {
      n: 1,
      text:
        'The torque step, with a small card sliding up from the bottom third of the screen, headed ' +
        '"Tip" and carrying a short clip and one line of text in Spanish, Maya’s profile language.',
      sourceRef: 'SB-FL-017 · L41566',
    },
    {
      n: 2,
      text:
        'Two controls, "Play again" and "Dismiss", and nothing that blocks the measurement field.',
      sourceRef: 'SB-FL-017 · L41566',
    },
    {
      n: 3,
      text:
        'Offline, the same screen shows the step’s authored Work Instruction expanded in place, ' +
        'with no card and no message about the agent being unavailable.',
      sourceRef: 'SB-FL-017 · L41566',
    },
  ],
  sourceRef: 'SB-FL-017 · L41566',
} as const satisfies { readonly id: string; readonly title: string; readonly frames: readonly B8Frame[]; readonly sourceRef: string }

/* ==================================================================== *
 * THE CLAIMS THIS MODULE MUST NEVER MAKE, HELD AS DATA SO THEY RENDER.
 *
 * A claim held in a comment is a code comment; a claim on the screen is a
 * disclosure, and a reader cannot see an absence.
 * ==================================================================== */

export interface B8NeverClaimed {
  readonly claim: string
  readonly instead: string
  readonly sourceRef: string
}

export const B8_CLAIMS_NEVER_MADE = [
  {
    claim: 'That a card has to be dealt with before the work can go on.',
    instead:
      'Coaching is advisory and never gates. Letting a dismissal block or delay a step is explicitly ' +
      'prohibited in every column of this matrix, including the Worker’s own. The card is a ' +
      'region of the step screen, never a dialog and never modal: there is no overlay to get past, ' +
      'the step’s own controls are never covered, and a worker who ignores the card entirely ' +
      'loses nothing.',
    sourceRef: 'L41471, AC-B8-3 · L41578',
  },
  {
    claim: 'That anybody is counting.',
    instead:
      'A single dismissal reaches nobody. It is recorded as a learning signal and the notification ' +
      'table names its recipient as "Nobody". Only the repeated-coaching pattern the Standards and ' +
      'Operations Studio defines becomes a signal, it is evaluated where that definition lives rather ' +
      'than on this device, and it reaches the Supervisor rather than the worker. Nothing on this ' +
      'screen shows a total, a comparison, or a history — the source names the risk itself as ' +
      'RISK-FL-B8-1, "dismissal recording can be perceived as monitoring".',
    sourceRef: 'L41514, L41517, RISK-FL-B8-1 · L39250',
  },
  {
    claim: 'That the worker has lost something when the agent cannot be reached.',
    instead:
      'What is absent offline is only the agent-selected card. The guidance itself never disappears, ' +
      'because the step’s authored Work Instructions travel inside the pinned Workflow package ' +
      'and are the same released, approved material. The application does not announce agent failures ' +
      'to the worker, because the worker’s guidance is unchanged.',
    sourceRef: 'L41498, FUNC-B8-02-1-2 · L41540, TEST-B8-5 · L41591',
  },
  {
    claim: 'That an artificial-intelligence model decides anything that matters here.',
    instead:
      'No artificial-intelligence model sits in the deviation-triggering path. Detection and severity ' +
      'classification are rule-based and run on the worker’s device from the version-pinned ' +
      'package, and artificial intelligence may never classify a deviation, place or release a hold, ' +
      'or alter a limit. Coaching is downstream of that layer and advisory to it: an emergency pause ' +
      'of the agentic layer removes cards and leaves gates, detection, classification and the ' +
      'Severity 1 hold untouched.',
    sourceRef: 'L40952, MOD-FL-A5 · L40948, AC-B8-6 · L41581',
  },
] as const satisfies readonly B8NeverClaimed[]

/* ==================================================================== *
 * THE CATEGORICAL ABSENCE, STATED IN THIS MODULE BECAUSE THIS IS THE MODULE
 * MOST ABLE TO BREAK IT.
 *
 * `AC-FL-000-5` (L39100), `TEST-FL-000-3` (L39108), `AC-SCR-FL-002` (L48690)
 * and `AC-SCOPE-045` (L2683) exclude the same class of display from every
 * module of this surface. §3.3 (L1994) is where the position comes from and
 * L2000 states it in the source's own words; §22.1's per-module check gives
 * this module its own risk row at L39250.
 *
 * THE LOCATORS ARE CARRIED WITHOUT THEIR WORDING, AND DELIBERATELY. Every one
 * of those four criteria states the prohibition by naming the excluded thing,
 * so quoting any of them would put the excluded word on the screen the
 * criterion is about. What renders is the position and the locator; the reader
 * opens the line.
 * ==================================================================== */

export interface B8ExcludedDisplay {
  readonly position: string
  readonly sourceRef: string
}

export const B8_EXCLUDED_DISPLAYS = [
  {
    position:
      'No screen in any module of this application, in any state, in any release of this scope, ' +
      'displays a worker-facing measure of how fast that worker is going or how they compare with ' +
      'anyone else. The criterion states the exclusion by naming what is excluded, so it is cited ' +
      'rather than quoted.',
    sourceRef: 'AC-FL-000-5 · L39100',
  },
  {
    position:
      'The chapter asks for a static and runtime scan of every rendered screen and an assertion of ' +
      'zero occurrences.',
    sourceRef: 'TEST-FL-000-3 · L39108',
  },
  {
    position:
      'No state of any destination of this surface renders one either, which is the same exclusion ' +
      'read off the screen register rather than off the module list.',
    sourceRef: 'AC-SCR-FL-002 · L48690',
  },
  {
    position:
      'The application-wide scope exclusion says the same thing a fourth time, in the not-doing list.',
    sourceRef: 'AC-SCOPE-045 · L2683',
  },
  {
    position:
      'The position itself: the application must be felt by the worker as support, not surveillance — ' +
      'a tool that helps them do the job right, not an instrument watching them for mistakes. §3.3 ' +
      'makes it three concrete prohibitions and one data-handling rule rather than a sentiment.',
    sourceRef: 'L2000',
  },
  {
    position:
      'This module carries its own residual-risk row in the chapter’s module-by-module check ' +
      'against that position: RISK-FL-B8-1, "dismissal recording can be perceived as monitoring". It ' +
      'is why the dismissal draws no counter, no total, and no comparison anywhere on this panel.',
    sourceRef: 'RISK-FL-B8-1 · L39250',
  },
] as const satisfies readonly B8ExcludedDisplay[]

/* ==================================================================== *
 * WHERE THIS MODULE SURFACES.
 *
 * §25.5 gives `SCR-FL-03`, the Run Player, six of the twelve modules and this
 * is one of them (L48531). §22.7 gives `SCR-FL-13` — "Coaching card" — the
 * Run Player destination and names `MOD-FL-B8` in its own Module column
 * (L39875). `AC-FL-010-2` (L40046) says coaching is implemented as a STATE of
 * the Run Player and is not reachable as an independent destination, which is
 * why this module exports a panel rather than a route.
 * ==================================================================== */

export const B8_WHERE_IT_SURFACES = [
  {
    place: 'The Run Player destination.',
    what: 'Execute the pinned work package end to end — MOD-FL-A3 to A5, B8, B9, B11.',
    sourceRef: 'SCR-FL-03 · L48531',
  },
  {
    place: 'The coaching card, as the twenty-three-row register names it.',
    what: 'Coaching card | Run Player | MOD-FL-B8',
    sourceRef: 'SCR-FL-13 · L39875',
  },
  {
    place: 'A state of that destination, and never a destination of its own.',
    what:
      'Capture, coaching, deviation, handover, and sign-off are implemented as states of the Run ' +
      'Player and are not reachable as independent destinations.',
    sourceRef: 'AC-FL-010-2 · L40046',
  },
] as const satisfies readonly {
  readonly place: string
  readonly what: string
  readonly sourceRef: string
}[]

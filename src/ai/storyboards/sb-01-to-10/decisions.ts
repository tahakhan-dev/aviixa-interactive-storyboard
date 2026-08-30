/**
 * THE DECISION IDENTIFIERS STORYBOARDS 44A.1 TO 44A.10 NAME.
 *
 * Eleven distinct `DEC-*` identifiers travel inside the transcribed field text
 * of these ten cards, because that is where the source puts them:
 * `DEC-AIRTO-001` is the ENTIRE content of every card's `Recovery Time
 * Objective and Recovery Point Objective` row, and `DEC-ASK-001` is the whole
 * reason storyboard 1 exists at all. There is deliberately no `decisionRefs`
 * field on `Storyboard` and this module adds none: the identifiers stay in the
 * prose where the source wrote them, and this file is the disclosure beside it.
 *
 * ── FOUR ARE CANON-BACKED, SEVEN ARE NOT ───────────────────────────────────
 * `src/disclosure/decisions.ts` is wave 5's and read-only here. Measured
 * against its exported `DecisionId` union: `DEC-AIRETRY-001`,
 * `DEC-LANEB-001`, `DEC-LIB-001` and `DEC-WIDIFF-001` are members, so the
 * canon holds their record and nothing is restated here. The other seven are
 * not members of the exported union, so `decisionRecord` for any of them does
 * not compile and there is nothing to point at. They are disclosed locally, in
 * the same idiom as `CC06_PKGFIELD_DISCLOSURE`, and
 * `tests/unit/ai-storyboards-01-10-decisions.test.ts` asserts each one is
 * ABSENT from the canon — so a later slice that lifts one turns that suite red
 * and forces the switch rather than leaving two spellings of one question.
 *
 * ── TWO OF THE SEVEN ARE ALIASES THE CANON ALREADY HOLDS UNDER ANOTHER NAME ─
 * `DEC-ASK-001` and `DEC-LOCALAI-001` are each registered in the canon as the
 * `alias` of a canonical record — `DEC-AIHELP-001` and `DEC-ONDEVICE-001`
 * respectively. An alias is not a union member, so the same compile-time
 * absence applies, but the question is NOT undisclosed platform-wide and
 * saying otherwise would be this module's own error. Each local record names
 * the canonical identifier, so wave 5 wires the card to the canon's record
 * rather than to a second reading of the same question.
 *
 * This module is data. It computes nothing and decides nothing.
 */

/**
 * The identifiers whose record lives in the shared canon. A literal list; the
 * suite holds it by membership rather than by length, because a length agrees
 * with any substitution.
 */
export const SB_01_TO_10_CANON_BACKED_DECISIONS = [
  'DEC-AIRETRY-001',
  'DEC-LANEB-001',
  'DEC-LIB-001',
  'DEC-WIDIFF-001',
] as const

/** One reading of the source, and the line it is on. The canon's own shape. */
export interface StoryboardDecisionReading {
  readonly text: string
  readonly locator: string
}

export interface StoryboardLocalDisclosure {
  /** The source's own identifier, as the cards spell it. */
  readonly decisionRef: string
  /**
   * The canon's canonical identifier for the same question, where the canon
   * registers this spelling as an alias, and `null` where the canon holds no
   * record of the question at all.
   */
  readonly canonicalId: string | null
  readonly question: string
  /** Every reading, never only the one the build acted on. */
  readonly readings: readonly StoryboardDecisionReading[]
  /** Why the disclosure is local rather than a pointer into the canon. */
  readonly canonNote: string
  /** What these ten cards do under the open question. */
  readonly behaviour: string
  /** Which of the ten name it, by `SB-AI-NN`. */
  readonly namedBy: readonly string[]
}

export const SB_01_TO_10_LOCAL_DISCLOSURES = [
  {
    decisionRef: 'DEC-ASK-001',
    canonicalId: 'DEC-AIHELP-001',
    question:
      'Whether the Frontline Worker Application gains a worker-initiated question channel at '
      + 'all, and if so in what form.',
    readings: [
      {
        text:
          'Option (a) — no question channel. Coaching stays agent-initiated, triggered by a '
          + 'locally detected difficulty pattern, which is what the Statement of Work describes. '
          + 'Under this reading storyboards 1, 3, 4 and 21 collapse into the coaching-unavailable '
          + 'behaviour of section 44.1.',
        locator: 'DEC-ASK-001 · L92732',
      },
      {
        text:
          'Option (b), the source\'s own recommendation — a bounded request that re-invokes the '
          + 'same metadata-filtered coaching retrieval, adding no free text. It cannot answer a '
          + 'question the corpus does not already cover.',
        locator: 'DEC-ASK-001 · L92732',
      },
      {
        text:
          'Option (c) — a full free-text question channel, which is a new capture surface, a new '
          + 'agent entry point, a new prompt-injection surface, a new offline queue and a new '
          + 'localisation obligation.',
        locator: 'DEC-ASK-001 · L92732',
      },
      {
        text:
          'A fourth reading exists outside the card and is not one of its three options: the '
          + 'twelve Frontline modules contain no question channel, and the Training Library '
          + 'Viewer is online-only and a content viewer rather than a question channel.',
        locator: 'L92728',
      },
    ],
    canonNote:
      'DEC-ASK-001 is not a member of the exported union. The canon registers this question '
      + 'canonically as DEC-AIHELP-001 and carries DEC-ASK-001 as that record\'s alias, so there '
      + 'is a platform record of the question but no identifier to cite it by from here. The two '
      + 'are not restatements — the canon\'s own note says so — and §44A spells it DEC-ASK-001, '
      + 'which is the spelling these cards carry.',
    behaviour:
      'Storyboards 1 and 4 declare the presumed capability in their own text before describing '
      + 'behaviour, as AC-44A-005 requires, and describe the failure behaviour that is identical '
      + 'under all three options: no answer is fabricated, authored content renders, and the '
      + 'request becomes a durable signal rather than a promise.',
    namedBy: ['SB-AI-01', 'SB-AI-04'],
  },
  {
    decisionRef: 'DEC-LOCALAI-001',
    canonicalId: 'DEC-ONDEVICE-001',
    question: 'Whether any artificial-intelligence capability runs on the device.',
    readings: [
      {
        text:
          'Option (a) — no local model. Cached curated assets only, which is what the Statement '
          + 'of Work describes: it places the agentic and reasoning layer server-side and '
          + 'online-only, and there is no local model at V1.',
        locator: 'DEC-LOCALAI-001 · L92770',
      },
      {
        text:
          'Option (b), the source\'s own recommendation — a small local retrieval index over '
          + 'already-approved cached assets, with no generative capability, creating no new '
          + 'authority. Even this adds an artifact to version, distribute and verify on every '
          + 'device.',
        locator: 'DEC-LOCALAI-001 · L92770',
      },
      {
        text:
          'Option (c) — a full local model, which brings a model artifact, integrity checks, a '
          + 'version lifecycle, per-device rollback and a disagreement-resolution rule onto a '
          + 'fleet whose standardised device profile is still owed.',
        locator: 'DEC-LOCALAI-001 · L92770',
      },
    ],
    canonNote:
      'DEC-LOCALAI-001 is not a member of the exported union. The canon registers this question '
      + 'canonically as DEC-ONDEVICE-001 and carries DEC-LOCALAI-001 as that record\'s alias. '
      + '§44A spells it DEC-LOCALAI-001 and storyboard 3\'s card row spells it that way too.',
    behaviour:
      'Storyboard 3 declares in its own text that the capability is not specified in the '
      + 'Statement of Work, and its behaviour is written so that it is correct under option (a): '
      + 'what is unconditional is the curated default asset travelling inside the pinned work '
      + 'package, and the local-capability language is marked conditional throughout.',
    namedBy: ['SB-AI-03'],
  },
  {
    decisionRef: 'DEC-AIRTO-001',
    canonicalId: null,
    question:
      'What Recovery Time Objective and Recovery Point Objective the agentic layer carries, '
      + 'platform-wide or per agent.',
    readings: [
      {
        text:
          'Option (a) — one objective pair for the whole agentic layer, which is one number for '
          + 'a live quality response and a scheduled artifact alike.',
        locator: 'DEC-AIRTO-001 · L91585',
      },
      {
        text:
          'Option (b), the source\'s own recommendation — per-agent objective pairs, tightest for '
          + 'the Deviation and Containment Agent and loosest for the Shift Handoff Agent, at the '
          + 'cost of per-agent measurement and per-agent alerting.',
        locator: 'DEC-AIRTO-001 · L91585',
      },
      {
        text:
          'A third option appears only in the chapter-40 statement of the same card and not in '
          + 'the chapter-44 one: per-artifact Recovery Point Objectives — traces, decision '
          + 'records, episodic memory — with a single Recovery Time Objective for availability. '
          + 'That card also rules that no value is proposed and that inventing one would be a '
          + 'defect.',
        locator: 'DEC-AIRTO-001 · L87880',
      },
      {
        text:
          'A third reading of the question itself, from the same chapter-44 card: option (c), no '
          + 'contractual objective at all, with honest unavailability states only.',
        locator: 'DEC-AIRTO-001 · L91585',
      },
    ],
    canonNote:
      'DEC-AIRTO-001 is not a member of the exported union and the canon holds no record of it '
      + 'under any spelling, which is notable rather than incidental: it is the most-referenced '
      + 'decision in the chapter-44 span and it is the entire content of every one of these ten '
      + 'cards\' recovery-objective row.',
    behaviour:
      'The recovery-objective row of storyboards 1, 2, 3 and 5 is transcribed exactly as the '
      + 'source writes it — the decision identifier and the statement that the value is not yet '
      + 'set. No number is seeded anywhere. Storyboards 4, 6, 7, 8, 9 and 10 state instead that '
      + 'no recovery objective applies, each with the source\'s own reason.',
    namedBy: ['SB-AI-01', 'SB-AI-02', 'SB-AI-03', 'SB-AI-05'],
  },
  {
    decisionRef: 'DEC-NOSHIFT-001',
    canonicalId: null,
    question:
      'Whether the nobody-on-shift escalation default is the tenant\'s Quality Manager role '
      + 'irrespective of shift, or some other fallback target the client specifies.',
    readings: [
      {
        text:
          'The default as recommended: where nobody holding the target role is on shift, '
          + 'delivery falls back to the tenant\'s Quality Manager role irrespective of shift, '
          + 'explicitly marked as a fallback delivery. The platform never lets an escalation '
          + 'resolve to no one and never pretends a fallback was the plan.',
        locator: 'DEC-NOSHIFT-001 · L37850',
      },
      {
        text:
          'The possibility that the client specifies a different fallback target. Both readings '
          + 'are preserved in the source, and the confirmation of the default is what is '
          + 'outstanding rather than the existence of a fallback.',
        locator: 'DEC-NOSHIFT-001 · L37850',
      },
      {
        text:
          'The scope reading that makes the question bite: escalations resolve to people on '
          + 'shift only, and a gate item raised in an Area a Quality Manager does not hold is '
          + 'not visible to them and routes to a holder who does.',
        locator: 'DEC-NOSHIFT-001 · L35027',
      },
    ],
    canonNote:
      'DEC-NOSHIFT-001 is not a member of the exported union and the canon holds no record of '
      + 'it. It is the second most-referenced decision in the chapter-44 span.',
    behaviour:
      'Storyboards 2, 4 and 6 render the nobody-on-shift default exactly as the source states '
      + 'it, with the identifier travelling in the field text and the fallback marking named as '
      + 'a requirement of the delivery rather than as a display option. No routing target is '
      + 'chosen here.',
    namedBy: ['SB-AI-02', 'SB-AI-04', 'SB-AI-06'],
  },
  {
    decisionRef: 'DEC-PLUS-001',
    canonicalId: null,
    question:
      'What ordering, if any, the authority matrices\' `Supervisor+` and `QM+` forms assert '
      + 'across five additive, non-hierarchical roles.',
    readings: [
      {
        text:
          'Reading A treats the forms as a rank ordering — Worker below Supervisor below Quality '
          + 'Manager below Tenant Admin — which contradicts the source\'s own statement that '
          + 'multi-role is additive and that the audit records identity rather than acting as a '
          + 'role. Under reading A a Tenant Admin holding no operational role can acknowledge an '
          + 'escalation.',
        locator: 'DEC-PLUS-001 · L34969',
      },
      {
        text:
          'Reading B treats them as a set enumeration — the union of the named grants — which '
          + 'preserves additivity but must be enumerated explicitly per action rather than '
          + 'inferred. Under reading B a Tenant Admin cannot acknowledge, and the source\'s own '
          + 'statement that the Tenant Admin is not an in-shift actor supports it.',
        locator: 'DEC-PLUS-001 · L34969',
      },
      {
        text:
          'A third statement of the same question reads the shorthand as an additive union of '
          + 'the named roles without naming either lettered reading.',
        locator: 'DEC-PLUS-001 · L34526',
      },
    ],
    canonNote:
      'DEC-PLUS-001 is not a member of the exported union and the canon holds no record of it. '
      + 'It matters in storyboard 6 specifically because escalating upward presumes an ordering '
      + 'the role model does not define.',
    behaviour:
      'Storyboard 6 transcribes the source status row naming the identifier, and its escalation '
      + 'is described by authored tier rather than by rank. No role is granted an act by analogy '
      + 'with a role said to sit above it.',
    namedBy: ['SB-AI-06'],
  },
  {
    decisionRef: 'DEC-SYNC-001',
    canonicalId: null,
    question:
      'Whether a reconnecting device uploads pending captures before or after pulling pending '
      + 'commands.',
    readings: [
      {
        text:
          'Interpretation A, commands first: the reconnecting device pulls, validates and '
          + 'applies pending commands before offering any capture, because a suspension or '
          + 'de-authorisation must land before the device does anything else. Its cost is a '
          + 'narrow window in which a wipe could precede an upload.',
        locator: 'DEC-SYNC-001 · L80070',
      },
      {
        text:
          'Interpretation B, captures first: the device uploads and obtains acknowledgement for '
          + 'pending captures before pulling commands, because de-authorising a worker or a '
          + 'device must never silently destroy unsynced work. Its cost is that a suspended '
          + 'worker remains momentarily unrestricted.',
        locator: 'DEC-SYNC-001 · L80071',
      },
      {
        text:
          'Neither sentence is subordinate to the other in the source, and the deferral of '
          + 'payloads and ordering to the Functional Specification is explicit rather than '
          + 'accidental.',
        locator: 'DEC-SYNC-001 · L80069',
      },
      {
        text:
          'The adopted working position, Option C, split by urgency and adopted because it is '
          + 'the safer reading: phase one applies the stop class, phase two uploads the full '
          + 'durable queue with nothing discarded, phase three applies the enabling class. '
          + 'Ratification remains with the client.',
        locator: 'DEC-SYNC-001 · L80073',
      },
    ],
    canonNote:
      'DEC-SYNC-001 is not a member of the exported union and the canon holds no record of it, '
      + 'even though it carries an adopted working position rather than an open question. The '
      + 'adoption is the client\'s to ratify, so the disclosure travels with the card.',
    behaviour:
      'Storyboards 7 and 9 describe the observable behaviour under the adopted three-phase '
      + 'order, name it as the adopted position rather than as the source\'s ruling, and keep '
      + 'the superseded commands-first reading on the record in the field text, exactly as the '
      + 'source does. A lot release is an enabling-class command and therefore applies after the '
      + 'capture queue drains.',
    namedBy: ['SB-AI-07', 'SB-AI-09'],
  },
  {
    decisionRef: 'DEC-WIPE-001',
    canonicalId: null,
    question:
      'What happens to a wiped or never-returning device\'s pending commands, given that the '
      + 'source requires a final sync attempt an offline device cannot perform.',
    readings: [
      {
        text:
          'The source requires remote wipe to be server-triggered and preceded by a final sync '
          + 'attempt, and states neither a pending-command lifetime nor the never-returns '
          + 'behaviour. Recorded as unresolved in the same line that records it.',
        locator: 'DEC-WIPE-001 · L101430',
      },
      {
        text:
          'The reading the same entry rejects at V1: an automatic wipe after a set offline '
          + 'period. It is rejected because an automatic wipe on a device that was merely in a '
          + 'wash bay destroys unsynced captures, and because de-authorising a device must not '
          + 'destroy unsynced work.',
        locator: 'DEC-WIPE-001 · L101430',
      },
    ],
    canonNote:
      'DEC-WIPE-001 is not a member of the exported union. The canon mentions it once, inside '
      + 'another record\'s prose as a related-and-separate question, so there is no record to '
      + 'point at and no identifier to cite it by.',
    behaviour:
      'Storyboards 7 and 9 record an undeliverable command as undeliverable, never as applied, '
      + 'and reconcile the affected scope centrally. No pending-command lifetime is assumed and '
      + 'no wipe behaviour is built.',
    namedBy: ['SB-AI-07', 'SB-AI-09'],
  },
] as const satisfies readonly StoryboardLocalDisclosure[]

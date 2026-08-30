import { JOURNEY_SURFACES, effectStatement, type JourneySurfaceCode } from '@/ui/shared/journey'
import {
  DETERMINISTIC_CONTROLS,
  RESERVED_AI_ACTS,
  type Storyboard,
  type StoryboardNumber,
} from './contract'

/**
 * THE SIX RENDER-TIME PROHIBITIONS OF §44A, PLUS THE TWO RULES THAT BIND THEM,
 * PLUS `AC-44A-004`. ONE CHECKABLE ASSERTION EACH.
 *
 * Each of these is stated exactly ONCE in the frozen source, in prose, and
 * applies to all thirty storyboards. The wave that builds the thirty is three
 * tasks of ten. Three authors reading six prose prohibitions produce three
 * interpretations, and the chapter's own head says so at L92648: "a rule
 * stated once is a rule interpreted differently by every reader." So the
 * interpretation is fixed here, once, and tasks 16, 17 and 18 run it over
 * their ten cards each.
 *
 * ── WHY NONE OF THESE SCANS THE CARD'S PROSE ───────────────────────────────
 * The cards describe the prohibitions in order to obey them. L93457 reads "It
 * must not draw a tick and pretend the job moved"; L93500 reads "never shows a
 * completion tick on creation"; L93996 reads "never a spinner that lies". A
 * substring scan for a forbidden rendering flags every one of those honest
 * sentences, and a scan that first strips quoted text to avoid that has
 * already shipped in this build as a gate that could not fail. So every check
 * here reads STRUCTURED FACTS, and the facts are cross-checks between two
 * independently supplied values rather than a single self-certifying boolean.
 * `deviceAcknowledgement: 'notAcknowledged'` is legal. `surfacesShowingApplied:
 * ['CC']` is legal. Together they are a violation, and neither field says so
 * alone.
 *
 * ── EVERY ILLEGAL VALUE IS REPRESENTABLE, ON PURPOSE ───────────────────────
 * `DeterministicStandingClaim` admits `'relaxed'` and `contentOrigin` admits
 * `'modelGenerated'`. Narrowing them to their legal members would move the
 * check into the type system and leave functions that cannot go red. A gate
 * that cannot fail reads as coverage and is worse than no gate, so the illegal
 * value stays writable and the check stays a check.
 *
 * ── AND WHERE A TYPE *CLAIMED* TO DO IT AND DID NOT ────────────────────────
 * `everySurfaceStatesWhatChanges` is the tenth, and it exists because the
 * opposite mistake also shipped here: `@/ui/shared/journey` requires a `reason`
 * on the absent arm and its comment called an empty string "structurally
 * impossible", but `reason: string` admits `''`. Requiring a field is not
 * requiring its content. See that invariant's own note.
 *
 * ── NO COUNTS ──────────────────────────────────────────────────────────────
 * Nothing here stores how many invariants, controls, acts or names there are.
 * `STORYBOARD_INVARIANTS`, `DETERMINISTIC_CONTROLS`, `RESERVED_AI_ACTS` and
 * `COLLAPSED_STATE_NAMES` are literal lists, and the tests prove them by
 * ADDING a member. A length assertion agrees with any substitution.
 *
 * This module is pure functions and literal lists. It renders nothing and reads
 * no I/O.
 */

export type StoryboardInvariantId =
  | 'noImpliedReceiptOrApplication'
  | 'noInventedContent'
  | 'failedInferenceIsNeverAPass'
  | 'noStateCollapse'
  | 'noTheatre'
  | 'fixedMessageIsNotParaphrased'
  | 'deterministicLayerUnaffected'
  | 'artificialIntelligenceIsAdvisoryOnly'
  | 'finalStateDerivableFromAuditAlone'
  | 'everySurfaceStatesWhatChanges'

export interface StoryboardViolation {
  readonly invariant: StoryboardInvariantId
  readonly storyboard: StoryboardNumber
  /** What is wrong, as a sentence. A boolean is a finding someone disables. */
  readonly message: string
  /** The line the rule is read from, so a reviewer can open it. */
  readonly sourceRef: string
}

export type StoryboardInvariant = (storyboard: Storyboard) => readonly StoryboardViolation[]

function violation(
  invariant: StoryboardInvariantId,
  storyboard: Storyboard,
  sourceRef: string,
  message: string,
): StoryboardViolation {
  return { invariant, storyboard: storyboard.number, message, sourceRef }
}

function surfaceName(code: JourneySurfaceCode): string {
  return JOURNEY_SURFACES.find((surface) => surface.code === code)!.name
}

/* ====================================================================
 * 1. NO SURFACE IMPLIES AN OFFLINE TABLET RECEIVED OR APPLIED ANYTHING.
 *
 * L93459 calls it "the strictest in the blueprint": no surface may imply an
 * offline tablet received or applied anything, and an action is never shown as
 * completed because the server created a command. `AC-44A-003` (L92748) is the
 * chapter-level form and seven storyboards restate it in their own words —
 * L93457, L93500, L93928, L94409, L94880, L93537, L93364.
 *
 * `noDeviceCommand` is not a licence. L93928 is "Receives nothing; no surface
 * implies otherwise" — a storyboard with no command still may not show one
 * applied, so the only acknowledgement value that permits a surface to show it
 * is `acknowledged`.
 * ==================================================================== */

export const noImpliedReceiptOrApplication: StoryboardInvariant = (storyboard) => {
  if (storyboard.facts.deviceAcknowledgement === 'acknowledged') return []
  return storyboard.facts.surfacesShowingApplied.map((code) =>
    violation(
      'noImpliedReceiptOrApplication',
      storyboard,
      'L93459',
      `The ${surfaceName(code)} shows the act as received or applied while the device has `
        + `not acknowledged it (${storyboard.facts.deviceAcknowledgement}). No surface may `
        + 'imply an offline tablet received or applied anything, and an action is never shown '
        + 'as completed because the server created a command.',
    ),
  )
}

/* ====================================================================
 * 2. THE PLATFORM NEVER INVENTS CONTENT, RULES, OR THRESHOLDS.
 *
 * L93026, `[SoW Fact — §3.7]`, called absolute in the source's own words: a
 * generative substitute for missing instructions violates it "under every
 * failure condition in this chapter". L93024 adds the second half — the tablet
 * must not invent to fill a gap, NOR quietly let the worker skip the step. So a
 * stated absence with a passed gate is the same defect wearing the honest
 * label, and both branches are checked.
 * ==================================================================== */

export const noInventedContent: StoryboardInvariant = (storyboard) => {
  const { contentOrigin, gateOutcome } = storyboard.facts
  if (contentOrigin === 'modelGenerated') {
    return [
      violation(
        'noInventedContent',
        storyboard,
        'L93026',
        'The storyboard renders model-generated content, rules or thresholds. The platform '
          + 'never invents content, rules, or thresholds, and a generative substitute for '
          + 'missing instructions is prohibited under every failure condition in this chapter.',
      ),
    ]
  }
  if (contentOrigin === 'statedAbsence' && gateOutcome === 'passed') {
    return [
      violation(
        'noInventedContent',
        storyboard,
        'L93026',
        'The authored content is absent and the gate passed anyway. The platform may neither '
          + 'invent something to fill the gap nor quietly let the worker skip the step.',
      ),
    ]
  }
  return []
}

/* ====================================================================
 * 3. A FAILED INFERENCE IS NEVER TREATED AS A PASS.
 *
 * L94553, "the single most important sentence in this chapter". Inconclusive is
 * checked alongside failed because the Vision contract's own terminal safe
 * state is "Human inspection, gate unpassed until proof" (L95368) — an
 * inference that reached no conclusion has proved nothing either.
 * ==================================================================== */

export const failedInferenceIsNeverAPass: StoryboardInvariant = (storyboard) => {
  const { inference, gateOutcome } = storyboard.facts
  const conclusive = inference === 'passed' || inference === 'noInference'
  if (conclusive || gateOutcome !== 'passed') return []
  return [
    violation(
      'failedInferenceIsNeverAPass',
      storyboard,
      'L94553',
      `An inference that ${inference === 'failed' ? 'failed' : 'reached no conclusion'} left `
        + 'the gate passed. A failed inference is never treated as a pass.',
    ),
  ]
}

/* ====================================================================
 * 4. NO STATE COLLAPSE.
 *
 * L92652: capture states, command states and notification states are never
 * collapsed into "synced", "sent" or "done". L93313 adds that a partial
 * outcome is displayed as partial, never as complete.
 *
 * The three names are matched as WHOLE state names, case-insensitively, with
 * surrounding punctuation trimmed. Not as substrings: "not done until
 * acknowledged" and "upload interrupted" are honest names, and a substring
 * scan would call the first a violation.
 * ==================================================================== */

/**
 * The three collapsed names L92652 forbids, in the source's own order. A
 * literal list, so the gate is proved by ADDING a fourth rather than by a
 * count that agrees with any substitution.
 */
export const COLLAPSED_STATE_NAMES = ['synced', 'sent', 'done'] as const

function normaliseStateName(name: string): string {
  return name.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase()
}

export const noStateCollapse: StoryboardInvariant = (storyboard) => {
  const out: StoryboardViolation[] = []
  for (const name of storyboard.facts.stateNamesShown) {
    const normalised = normaliseStateName(name)
    if ((COLLAPSED_STATE_NAMES as readonly string[]).includes(normalised)) {
      out.push(
        violation(
          'noStateCollapse',
          storyboard,
          'L92652',
          `A surface shows the state name "${name}". Capture states, command states and `
            + 'notification states are never collapsed into "synced", "sent" or "done"; every '
            + 'state is shown honestly and by its true name.',
        ),
      )
    }
  }
  if (storyboard.facts.outcomeIsPartial && !storyboard.facts.partialLabelledPartial) {
    out.push(
      violation(
        'noStateCollapse',
        storyboard,
        'L93313',
        'The outcome is partial and the rendering does not say so. A partial release is '
          + 'displayed as partial, never as complete.',
      ),
    )
  }
  return out
}

/* ====================================================================
 * 5. NO THEATRE.
 *
 * L92843: no spinner and no retry control against a KNOWN-offline state,
 * "because a retry against a known-offline state would be theatre". L93996
 * restates it as "Never a duplicate, never a silent loss, never a spinner that
 * lies".
 *
 * `unknown` connectivity is not known-offline and is not treated as such. A
 * spinner while connectivity is genuinely unknown is a spinner telling the
 * truth, and widening the rule to cover it would be this build's invention
 * rather than the source's rule.
 * ==================================================================== */

export const noTheatre: StoryboardInvariant = (storyboard) => {
  const { connectivity, showsSpinner, showsRetryControl } = storyboard.facts
  if (connectivity !== 'knownOffline') return []
  const out: StoryboardViolation[] = []
  if (showsSpinner) {
    out.push(
      violation(
        'noTheatre',
        storyboard,
        'L92843',
        'A spinner renders against a known-offline state. There is no spinner and no retry '
          + 'control against a known-offline state, because a retry against a known-offline '
          + 'state would be theatre.',
      ),
    )
  }
  if (showsRetryControl) {
    out.push(
      violation(
        'noTheatre',
        storyboard,
        'L92843',
        'A retry control renders against a known-offline state, which would be theatre.',
      ),
    )
  }
  return out
}

/* ====================================================================
 * 6. A FIXED WORKER MESSAGE IS NOT PARAPHRASED OR RE-LOCALISED.
 *
 * L94876: `SCR-FL-LOCK-01`'s wording "is fixed by the source and must not be
 * paraphrased or localised into a different meaning; it is authored in both
 * supported languages as approved content". `AC-44A-25-2` (L94880) says the
 * same about the message being exactly the source's wording in both languages.
 *
 * THE SPANISH CANNOT BE PINNED, AND THAT IS DISCLOSED RATHER THAN PAPERED
 * OVER. Measured: the frozen source contains no Spanish string anywhere for
 * this message — the whole file was searched. `TEST-44A-004` (L92757) still
 * requires the message set complete in both English and Spanish, so a missing
 * Spanish rendering is a violation citing that test, while a present one is
 * checked for presence only. Asserting an invented Spanish string would be a
 * test asserting this build's own invention.
 *
 * A rendered fixed message naming a screen this list does not pin is reported
 * too. Silence there would let a second fixed message ship unpoliced, which is
 * the same defect one level up.
 *
 * ── "FIXED BY THE SOURCE" IS NOT "THE SOURCE SAYS IT ONCE" ─────────────────
 * THE ENGLISH WORDING EXISTS TWICE IN THE FROZEN DOCUMENT, AND THE DOCUMENT
 * SAYS SO ITSELF. `DEC-MSG-001` is registered at L5263 — "the fixed
 * worker-facing compliance-suspension message is worded differently in two
 * Parts" — with Reading A at L5265 (`SoW Fact` — §4.2.3, repeated verbatim at
 * §7.11) and Reading B at L5266 (`SoW Fact` — §8.9.2, "Operation suspended —
 * your work has been saved."). Both are real source strings under an open
 * `Client Decision Required`; the register's own recommendation is Option 1,
 * adopt Reading A, because it appears twice and carries the actionable
 * instruction. This build already discloses the pair at
 * `src/frontline/modules/fl-a1/service.ts:257,262` and
 * `src/frontline/modules/fl-a7/service.ts:335,339`.
 *
 * This invariant pins READING A, and the reason is local to §44A rather than a
 * preference: L94829 is the wording §44A itself writes in `SB-AI-25`'s
 * Worker-visible experience row, and `AC-44A-25-2` (L94880) requires "the
 * compliance-suspension worker message is exactly the source's wording, in
 * both supported languages, with no paraphrase". So within this chapter the
 * wording is fixed — but a card supplying Reading B is supplying a real source
 * string under an open decision, NOT inventing a paraphrase, and the violation
 * says which of the two it is. That distinction is the whole point of the
 * disclosure: tasks 16-18 must not read "fixed by the source" as "the source
 * says this once".
 *
 * THE SPANISH IS THE SECOND HALF OF THE SAME DECISION, and it is not in the
 * document at all — measured independently by two tasks, including zero
 * occurrences of `Operación`/`suspendida` in 18MB. `DEC-MSG-001`'s trade-off
 * line (L5270) calls for "a locale-file update in English and Spanish", which
 * is the client's editorial act rather than this build's. So the Spanish
 * violation on `SB-AI-25` STANDS BY DESIGN: the only way to silence it is to
 * omit the fixed message, and omitting it would silence the one paraphrase
 * prohibition the source actually states. A reader seeing that violation is
 * seeing the open half of `DEC-MSG-001`, not a defect somebody forgot.
 * ==================================================================== */

/**
 * A second source wording for the same fixed message, registered as an open
 * decision. `null` on a message the source writes one way only.
 */
export interface WordingCollision {
  /** The decision the source registers the pair under, e.g. `DEC-MSG-001`. */
  readonly decision: string
  /** Where the decision is registered. */
  readonly decisionRef: string
  /** The register's label for the reading this invariant pins. */
  readonly adoptedReading: string
  /** Where the register writes the adopted reading. */
  readonly adoptedReadingRef: string
  /** The register's label for the other reading. */
  readonly otherReading: string
  /** The other reading, verbatim. A real source string, not a paraphrase. */
  readonly otherReadingText: string
  /** Where the register writes the other reading. */
  readonly otherReadingRef: string
  /** Why THIS chapter fixes the adopted one. Local, not a global preference. */
  readonly whyAdopted: string
}

export interface PinnedWorkerMessage {
  readonly screen: string
  /** Verbatim from the source. */
  readonly english: string
  /** `null` where the source writes none. Measured, not assumed. */
  readonly spanish: string | null
  /** The line carrying the English wording. */
  readonly englishRef: string
  /** The line prohibiting the paraphrase. */
  readonly prohibitionRef: string
  /** The open decision the wording sits under, or `null` where there is none. */
  readonly collision: WordingCollision | null
}

export const PINNED_WORKER_MESSAGES = [
  {
    screen: 'SCR-FL-LOCK-01',
    english: 'Operation suspended. Contact your supervisor. Your work has been saved.',
    spanish: null,
    englishRef: 'L94829',
    prohibitionRef: 'L94876',
    collision: {
      decision: 'DEC-MSG-001',
      decisionRef: 'L5263',
      adoptedReading: 'Reading A',
      adoptedReadingRef: 'L5265',
      otherReading: 'Reading B',
      otherReadingText: 'Operation suspended — your work has been saved.',
      otherReadingRef: 'L5266',
      whyAdopted:
        '§44A writes Reading A itself, in SB-AI-25\'s Worker-visible experience row at L94829, '
        + 'and AC-44A-25-2 (L94880) requires exactly the source\'s wording with no paraphrase. '
        + 'The register\'s own recommendation is the same reading, because it appears twice and '
        + 'carries the actionable instruction Reading B drops.',
    },
  },
] as const satisfies readonly PinnedWorkerMessage[]

/**
 * Why the rendered English is wrong — and, where the source writes two
 * readings, WHICH of the two ways it is wrong. A card supplying the other
 * reading has supplied a real source string under an open decision; a card
 * supplying neither has paraphrased. Reporting both as "not the source's
 * wording" is what let a source string be filed as an invention.
 */
function describeEnglishDivergence(rendered: string, pinned: PinnedWorkerMessage): string {
  const { collision } = pinned
  if (collision === null) {
    return `Its wording is fixed by the source at ${pinned.englishRef} and must not be `
      + 'paraphrased or localised into a different meaning.'
  }
  const base =
    `The source writes this message TWO ways and registers the divergence itself as `
    + `${collision.decision} (${collision.decisionRef}): ${collision.adoptedReading} at `
    + `${collision.adoptedReadingRef}, "${pinned.english}", and ${collision.otherReading} at `
    + `${collision.otherReadingRef}, "${collision.otherReadingText}". §44A fixes `
    + `${collision.adoptedReading}: ${collision.whyAdopted} `
  return rendered === collision.otherReadingText
    ? base
      + `This card renders ${collision.otherReading} — a real source string under an open `
      + 'Client Decision Required, NOT an invented paraphrase. It is still a violation here, '
      + `because ${pinned.englishRef} is the wording this chapter writes and `
      + `${pinned.prohibitionRef} forbids rendering a different meaning; it resolves when `
      + `${collision.decision} is decided, not by editing this card.`
    : base
      + 'This card renders neither reading, so it is a paraphrase. Neither reading may be '
      + 'paraphrased or localised into a different meaning.'
}

export const fixedMessageIsNotParaphrased: StoryboardInvariant = (storyboard) => {
  const out: StoryboardViolation[] = []
  for (const message of storyboard.facts.fixedMessages) {
    const pinned = PINNED_WORKER_MESSAGES.find((entry) => entry.screen === message.screen)
    if (pinned === undefined) {
      out.push(
        violation(
          'fixedMessageIsNotParaphrased',
          storyboard,
          'L94876',
          `A fixed worker message renders for ${message.screen}, which no pinned wording `
            + 'covers. A fixed message with nothing to check it against is a paraphrase '
            + 'waiting to happen.',
        ),
      )
      continue
    }
    if (message.english !== pinned.english) {
      out.push(
        violation(
          'fixedMessageIsNotParaphrased',
          storyboard,
          pinned.prohibitionRef,
          `${message.screen}'s message renders as "${message.english}". `
            + describeEnglishDivergence(message.english, pinned),
        ),
      )
    }
    if (message.spanish === null || message.spanish.trim() === '') {
      out.push(
        violation(
          'fixedMessageIsNotParaphrased',
          storyboard,
          'L92757',
          `${message.screen}'s message set has no Spanish rendering. Every storyboard's `
            + "worker-facing message set exists complete in both English and Spanish before "
            + 'release. The source writes no Spanish string for it anywhere, so the approved '
            + 'translation is a client-supplied input rather than something this build derives'
            + (pinned.collision === null
              ? '.'
              : ` — it is the open second half of ${pinned.collision.decision} `
                + `(${pinned.collision.decisionRef}), whose trade-off line calls for a locale-file `
                + 'update in English and Spanish. This violation therefore STANDS rather than '
                + 'being fixed: the only way to silence it is to omit the fixed message, and '
                + 'omitting it would silence the one paraphrase prohibition the source states.'),
        ),
      )
    }
  }
  return out
}

/* ====================================================================
 * THE TWO RULES THAT BIND THE SET.
 * ==================================================================== */

/**
 * THE DETERMINISTIC LAYER IS UNAFFECTED IN EVERY STORYBOARD.
 *
 * L92650, `[SoW Fact — §7.9.1, §7.9.4, §8.7.5]`: gates, deviation detection,
 * severity classification and the Severity 1 hold continue exactly as
 * authored. `AC-44A-002` (L92747) makes it testable by naming the four
 * controls, and those four — and only those four — are `DETERMINISTIC_CONTROLS`.
 */
export const deterministicLayerUnaffected: StoryboardInvariant = (storyboard) =>
  DETERMINISTIC_CONTROLS.filter(
    (control) => storyboard.facts.deterministicStandings[control.id] !== 'unchanged',
  ).map((control) =>
    violation(
      'deterministicLayerUnaffected',
      storyboard,
      'L92747',
      `The ${control.label} relaxes in this storyboard. In no storyboard does a failure of `
        + 'artificial intelligence cause a specification gate, evaluation gate, qualification '
        + 'gate, or Severity 1 hold to relax.',
    ),
  )

/**
 * ARTIFICIAL INTELLIGENCE IS ADVISORY UNLESS THE SOURCE GRANTS EXECUTION
 * AUTHORITY.
 *
 * L92650's fourth rule at L92653: it "never classifies, never releases a hold,
 * never bypasses a gate, never self-approves, and never executes a stale
 * queued action". Storyboard 21 restates the last at L94545. The check is not
 * "no act is declared" but "no act is declared without the line that grants
 * it" — the source's own sentence is conditional, and a check that refused all
 * five outright would be stricter than the source and would have to be
 * overridden somewhere, which is how a rule stops being enforced.
 */
export const artificialIntelligenceIsAdvisoryOnly: StoryboardInvariant = (storyboard) =>
  storyboard.facts.aiActs
    .filter((act) => act.executionAuthorityRef === null)
    .map((act) => {
      const definition = RESERVED_AI_ACTS.find((entry) => entry.id === act.act)!
      return violation(
        'artificialIntelligenceIsAdvisoryOnly',
        storyboard,
        'L92653',
        `Artificial intelligence ${definition.label} in this storyboard and the source grants `
          + 'no execution authority for it. Artificial intelligence is advisory unless the '
          + 'source grants execution authority.',
      )
    })

/* ====================================================================
 * `AC-44A-004` — THE FINAL OFFICIAL STATE IS DERIVABLE FROM THE AUDIT ALONE.
 *
 * L92749, and `TEST-44A-003` (L92756) reconstructs it. This is the sharpest of
 * the five chapter criteria to build for, because it is an assertion about what
 * the card EMITS rather than a label it carries: a state naming no audit event
 * is not derivable from the audit log, and a state naming an event the log does
 * not hold is derivable from something else.
 *
 * Duplicate audit identifiers are a violation too. Reconstruction resolves a
 * reference to one event; two events answering to one identifier means the
 * reconstruction is ambiguous, and an ambiguous reconstruction is not one.
 * ==================================================================== */

export const finalStateDerivableFromAuditAlone: StoryboardInvariant = (storyboard) => {
  const out: StoryboardViolation[] = []
  const { name, derivedFrom } = storyboard.finalOfficialState

  if (name.trim() === '') {
    out.push(
      violation(
        'finalStateDerivableFromAuditAlone',
        storyboard,
        'L92749',
        'The storyboard terminates in no named final official state.',
      ),
    )
  }

  const ids = storyboard.audit.map((event) => event.id)
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))]
  if (duplicates.length > 0) {
    out.push(
      violation(
        'finalStateDerivableFromAuditAlone',
        storyboard,
        'L92749',
        `The audit log holds more than one event under ${duplicates.join(', ')}, so a `
          + 'reconstruction from it is ambiguous rather than derivable.',
      ),
    )
  }

  if (derivedFrom.length === 0) {
    out.push(
      violation(
        'finalStateDerivableFromAuditAlone',
        storyboard,
        'L92749',
        `The final official state "${name}" names no audit event, so it is not derivable from `
          + 'the audit log alone.',
      ),
    )
    return out
  }

  const missing = derivedFrom.filter((id) => !ids.includes(id))
  if (missing.length > 0) {
    out.push(
      violation(
        'finalStateDerivableFromAuditAlone',
        storyboard,
        'L92749',
        `The final official state "${name}" is derived from ${missing.join(', ')}, which the `
          + 'audit log does not hold.',
      ),
    )
  }
  return out
}

/* ====================================================================
 * EVERY SURFACE STATES WHAT CHANGES.
 *
 * L92664: "**The five-surface reaction** states, for each surface, what
 * changes." Measured across the thirty tables at
 * `STORYBOARD_SURFACE_TABLE_REFS`: 150 reaction cells, 0 blank. Where a
 * surface changes nothing the source still writes WHY — L92818 "No change;
 * after reconnection the signal contributes to instruction-review candidates
 * for the screen's author", L94688 "Not applicable — the Studio has no device
 * storage role". Measured too: the string "No direct effect" appears NOWHERE in
 * L92596-L95408. It is this build's rendering of the source's rule, so the
 * reason is the half that carries what the source actually wrote, and a blank
 * reason renders a label the source never wrote and nothing else.
 *
 * ── WHY THE TYPE DOES NOT ALREADY DO THIS ──────────────────────────────────
 * `@/ui/shared/journey`'s absent arm requires `reason: string`, and
 * `reason: string` admits `''`. `noEffect('', ref)` compiles, and
 * `effectStatement` then returns "No direct effect — " with nothing after the
 * dash: a blank cell wearing a label, which reads as a rendering to everything
 * downstream. TypeScript has no non-empty-string type, so requiring the FIELD
 * is not requiring its CONTENT, and the nine invariants above never read
 * `storyboard.surfaces` at all. That gap was found by a content task's own
 * test before this contract found it — the precise failure L92648 names, on
 * the one chapter rule this module had left to three transcription tasks to
 * reinterpret.
 *
 * ── THE CROSS-CHECK ────────────────────────────────────────────────────────
 * `kind: 'noDirectEffect'` is legal. `reason: ''` is a legal string. Together
 * they are a violation and neither field says so alone — the same shape as
 * `deviceAcknowledgement` against `surfacesShowingApplied`. The surface set is
 * `JOURNEY_SURFACES`, the literal list declared outside this module, so a
 * sixth surface is policed the day it is added rather than the day someone
 * remembers to widen a count.
 * ==================================================================== */

export const everySurfaceStatesWhatChanges: StoryboardInvariant = (storyboard) => {
  const out: StoryboardViolation[] = []
  for (const surface of JOURNEY_SURFACES) {
    const effect = storyboard.surfaces[surface.code]
    const supplied = effect.kind === 'affected' ? effect.statement : effect.reason
    if (supplied.trim() !== '') continue
    out.push(
      violation(
        'everySurfaceStatesWhatChanges',
        storyboard,
        'L92664',
        `The ${surface.name} row renders as "${effectStatement(effect)}" — `
          + (effect.kind === 'affected'
            ? 'an affected surface stating nothing about what changed. '
            : 'an absent surface with no reason, which is a blank cell wearing a label. ')
          + 'The five-surface reaction states, for each surface, what changes, and every one '
          + "of the 150 reaction cells in the chapter's thirty tables carries text.",
      ),
    )
  }
  return out
}

/* ====================================================================
 * THE SET, AND THE RUNNER.
 * ==================================================================== */

export interface StoryboardInvariantDefinition {
  readonly id: StoryboardInvariantId
  readonly check: StoryboardInvariant
  /** The line the rule is stated on, once, in the source. */
  readonly sourceRef: string
}

/**
 * The set, as a literal list. Tasks 16, 17 and 18 run `storyboardViolations`
 * over their ten cards; nothing consumes them one at a time except the tests
 * that prove each can go red.
 *
 * No count is written here. Adding `everySurfaceStatesWhatChanges` to this list
 * reddened the membership assertion in
 * `tests/unit/ai-storyboard-contract-invariants.test.ts` before that test's own
 * literal list was widened, and reddened the "runs every one of them" case with
 * it — which is what proves the gate is a list and not a length.
 */
export const STORYBOARD_INVARIANTS = [
  { id: 'noImpliedReceiptOrApplication', check: noImpliedReceiptOrApplication, sourceRef: 'L93459' },
  { id: 'noInventedContent', check: noInventedContent, sourceRef: 'L93026' },
  { id: 'failedInferenceIsNeverAPass', check: failedInferenceIsNeverAPass, sourceRef: 'L94553' },
  { id: 'noStateCollapse', check: noStateCollapse, sourceRef: 'L92652' },
  { id: 'noTheatre', check: noTheatre, sourceRef: 'L92843' },
  { id: 'fixedMessageIsNotParaphrased', check: fixedMessageIsNotParaphrased, sourceRef: 'L94876' },
  { id: 'deterministicLayerUnaffected', check: deterministicLayerUnaffected, sourceRef: 'L92650' },
  {
    id: 'artificialIntelligenceIsAdvisoryOnly',
    check: artificialIntelligenceIsAdvisoryOnly,
    sourceRef: 'L92653',
  },
  {
    id: 'finalStateDerivableFromAuditAlone',
    check: finalStateDerivableFromAuditAlone,
    sourceRef: 'L92749',
  },
  {
    id: 'everySurfaceStatesWhatChanges',
    check: everySurfaceStatesWhatChanges,
    sourceRef: 'L92664',
  },
] as const satisfies readonly StoryboardInvariantDefinition[]

type MissingFromInvariants = Exclude<
  StoryboardInvariantId,
  (typeof STORYBOARD_INVARIANTS)[number]['id']
>
const _invariantsExhaustive: MissingFromInvariants extends never ? true : never = true
void _invariantsExhaustive

/**
 * Every way this storyboard breaks the chapter's render-time rules, as
 * sentences. Empty means it holds.
 *
 * It runs the whole list rather than a chosen subset, so a tenth invariant
 * added to `STORYBOARD_INVARIANTS` cannot be declared and then skipped by the
 * thirty callers that matter.
 */
export function storyboardViolations(storyboard: Storyboard): readonly StoryboardViolation[] {
  return STORYBOARD_INVARIANTS.flatMap((invariant) => invariant.check(storyboard))
}

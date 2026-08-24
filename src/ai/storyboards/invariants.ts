import { JOURNEY_SURFACES, type JourneySurfaceCode } from '@/ui/shared/journey'
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
 * check into the type system and leave nine functions that cannot go red. A
 * gate that cannot fail reads as coverage and is worse than no gate, so the
 * illegal value stays writable and the check stays a check.
 *
 * ── NO COUNTS ──────────────────────────────────────────────────────────────
 * Nothing here stores how many invariants, controls, acts or names there are.
 * `STORYBOARD_INVARIANTS`, `DETERMINISTIC_CONTROLS`, `RESERVED_AI_ACTS` and
 * `COLLAPSED_STATE_NAMES` are literal lists, and the tests prove them by
 * ADDING a member. A length assertion agrees with any substitution.
 *
 * This module is nine pure functions and three literal lists. It renders
 * nothing and reads no I/O.
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
 * ==================================================================== */

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
}

export const PINNED_WORKER_MESSAGES = [
  {
    screen: 'SCR-FL-LOCK-01',
    english: 'Operation suspended. Contact your supervisor. Your work has been saved.',
    spanish: null,
    englishRef: 'L94829',
    prohibitionRef: 'L94876',
  },
] as const satisfies readonly PinnedWorkerMessage[]

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
          `${message.screen}'s message renders as "${message.english}". Its wording is fixed `
            + `by the source at ${pinned.englishRef} and must not be paraphrased or localised `
            + 'into a different meaning.',
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
            + 'release. The source writes no Spanish string for it, so the approved '
            + 'translation is a client-supplied input rather than something this build derives.',
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
 * THE SET, AND THE RUNNER.
 * ==================================================================== */

export interface StoryboardInvariantDefinition {
  readonly id: StoryboardInvariantId
  readonly check: StoryboardInvariant
  /** The line the rule is stated on, once, in the source. */
  readonly sourceRef: string
}

/**
 * The nine, as a literal list. Tasks 16, 17 and 18 run `storyboardViolations`
 * over their ten cards; nothing consumes them one at a time except the tests
 * that prove each can go red.
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

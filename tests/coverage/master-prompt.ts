import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

/**
 * THE GOVERNING DOCUMENT, READ RATHER THAN PARAPHRASED (audit round 4,
 * R4-B13).
 *
 * The tree held exactly six `master prompt §X` citations and every one was
 * prose in a comment or a doc — not one was inside an assertion. That is what
 * made the prompt's own completeness sections unauditable by anyone but the
 * session that received the message: a gate cannot go red against a sentence
 * nothing in the suite reads.
 *
 * The prompt is now a committed artefact. This module reads it, pins its
 * sha256, and hands a gate the ACTUAL WORDS of an obligation, so a gate
 * asserts the build against the document instead of against a comment
 * somebody wrote about the document.
 *
 * WHY THE HASH IS ASSERTED HERE AND NOT ONLY IN `src/`. The artefact's own
 * header says it is a transcription from the client's message text rather
 * than a byte-identical copy of an attachment, so it can legitimately be
 * corrected — and when it is, every obligation quoted below must be re-read
 * against the new bytes rather than silently carried forward. A changed hash
 * turns this red and forces that re-reading.
 *
 * BARE `§N.N` IN THIS REPOSITORY MEANS THE BLUEPRINT, whose chapters collide
 * with the prompt's section numbers and have caught three authors. Every
 * reference here is written "master prompt §X" in full.
 */
export const MASTER_PROMPT_PATH =
  'docs/process/master-prompt/AVIIXA_Interactive_Storyboard_Master_Prompt_v1.0.md'

export const MASTER_PROMPT_SHA256 =
  '96b67c835a880745c748cfd1c270c53fb86fd924c5881478c430582e3506e280'

export function masterPromptText(): string {
  const text = readFileSync(MASTER_PROMPT_PATH, 'utf8')
  const actual = createHash('sha256').update(text, 'utf8').digest('hex')
  if (actual !== MASTER_PROMPT_SHA256) {
    throw new Error(
      `The master prompt artefact at ${MASTER_PROMPT_PATH} hashes ${actual}, not the pinned ` +
        `${MASTER_PROMPT_SHA256}. Every obligation quoted out of it must be re-read against the ` +
        'new bytes before this pin is updated -- a gate quoting a document it has not re-read ' +
        'is the paraphrase problem this module exists to remove.',
    )
  }
  return text
}

/**
 * The exact obligation sentences the gates in this directory assert against.
 * Each is a VERBATIM substring of the artefact and `masterPromptObligation`
 * fails if it is not, so a reworded prompt cannot leave a gate quietly
 * enforcing a sentence the document no longer contains.
 */
export const OBLIGATIONS = {
  /** master prompt §9.6 — where the reconciliation table must be published. */
  reconciliationTable:
    'publish one reconciliation table — candidate, extracted count, count scope, deduplication rule, delta, and resolution — in the coverage dashboard and the review package',
  /** master prompt §9.6 — the fourteen browsable registry indexes. */
  registryIndexes:
    'The application must also render a browsable registry index screen, with live counts and per-item implementation status, for each inventory',
  /** master prompt §9.6 — each index drills into the item's card. */
  indexDrillDown: "Each index drills into the item's card",
  /** master prompt §10.5 — the eight Workflow Index dimensions. */
  workflowIndexDimensions:
    'The Workflow Index screen must list every workflow with its ID, plain-language name, owning surface and module, initiating and participating roles, primary objects, implementation status, and variant coverage summary, filterable by each of those dimensions.',
  /** master prompt §13.1 — the census and its two-way closure. */
  censusDimensions:
    'Generate a per-surface, per-module actionable-item census from the `ControlDefinition` registry — counts by surface, module, control type, and implementation status',
  censusTwoWayClosure:
    'The census must close both ways: zero rendered controls outside the census, and zero census rows without either a rendered control or an explicit decision-blocked/not-applicable record.',
  /** master prompt §9.2 — what a Not applicable classification must carry. */
  notApplicableEvidence: 'a `Not applicable` classification without reason, owner, and source/decision evidence',
  /** master prompt §21.1 — the package checksum is not authenticity. */
  checksumNotAuthenticity:
    'Label this checksum as accidental-corruption and integrity detection, not cryptographic authenticity, signer identity, or non-repudiation.',
} as const

export type ObligationKey = keyof typeof OBLIGATIONS

/**
 * Returns the obligation's text, having first proved the artefact contains it
 * verbatim. Call this in a gate rather than inlining the string: the point is
 * that the assertion is anchored to the document, and a copied literal is
 * anchored to nothing.
 */
export function masterPromptObligation(key: ObligationKey): string {
  const text = masterPromptText()
  const sentence = OBLIGATIONS[key]
  if (!text.includes(sentence)) {
    throw new Error(
      `master prompt §-obligation "${key}" is not a verbatim substring of ${MASTER_PROMPT_PATH}. ` +
        'The gate that asserts the build against it would be enforcing a sentence the governing ' +
        `document does not contain. Looked for:\n  ${sentence}`,
    )
  }
  return sentence
}

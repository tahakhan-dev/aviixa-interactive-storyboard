/**
 * THE TWO GOVERNING ARTEFACTS, HASHED IN ONE PLACE (audit round 4, R4-B13).
 *
 * A review package declares a `sourceHash` and a `promptHash` so two packages
 * reviewed against different inputs can be told apart. Until this file the
 * prompt half had no value anywhere in the tree except the test literal
 * `p-1`, because the governing document was not an artefact at all — it lived
 * only in the client's first message, so §2.1's drift procedure had a
 * frozen-source hash on one side and nothing on the other.
 *
 * The prompt is now committed at the path below and both hashes live here,
 * once each. Deliberately NOT read from disk at runtime: this module is
 * imported by a client component, the browser has no filesystem, and a
 * storyboard that fetched either artefact would break master prompt §4.1's
 * no-network boundary. The literal is the shipped claim and
 * `tests/unit/review-artefact-hashes.test.ts` recomputes both from the files
 * on disk, so the claim is checked rather than trusted — which is the only
 * arrangement under which a literal hash is honest.
 *
 * WHY THE PROMPT'S HASH IS NOT A DRIFT GATE THE WAY THE SOURCE'S IS. The
 * frozen source is frozen: a changed hash there is master prompt §2.1's
 * source drift and stops the build. The prompt artefact is a transcription
 * from the client's message text and its own header says so, so a changed
 * hash there means the transcription was corrected. Both are asserted; only
 * the first is a stop.
 */

/** Path relative to the repository root, for the test that recomputes these. */
export const FROZEN_SOURCE_PATH = '../AVIIXA_Production_Product_Blueprint.md'
export const MASTER_PROMPT_PATH =
  'docs/process/master-prompt/AVIIXA_Interactive_Storyboard_Master_Prompt_v1.0.md'

/** sha256 of the frozen product blueprint, 18,565,031 bytes, 122,241 lines. */
export const FROZEN_SOURCE_SHA256 =
  '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'

/** sha256 of the committed master prompt artefact. */
export const MASTER_PROMPT_SHA256 =
  '96b67c835a880745c748cfd1c270c53fb86fd924c5881478c430582e3506e280'

import { STORYBOARDS_01_TO_10 } from '@/ai/storyboards/sb-01-to-10'
import { STORYBOARDS_11_TO_20 } from '@/ai/storyboards/sb-11-to-20'
import { SB_21_TO_30 } from '@/ai/storyboards/sb-21-to-30/storyboards'
import type { Storyboard } from '@/ai/storyboards/contract'

/**
 * THE SCOPE OF `/workflows/ai-and-its-absence`, AND THE LITERALS THAT MAKE THE
 * THIRTY STORYBOARDS REACHABLE.
 *
 * ── THE ROUTE IS DERIVED, AND IT RENDERS AS DERIVED ────────────────────────
 * The frozen source carries no URL notation for this page. Measured: `grep -n`
 * for `/workflows/ai-and-its-absence` across all 122,241 lines returns zero,
 * the same measurement `/super-admin/ai-incidents` recorded before it shipped.
 * Its SUBJECT is source-defined and exactly bounded — `## 44A. Required
 * Artificial-Intelligence and Fallback Storyboards` at L92596, the chapter's
 * closing rule at L95408 — but the decision to give that chapter one page of
 * its own is this build's. It is labelled a client-delegated choice under
 * APP-012 above the fold, on the same pattern the six-module slice scope and
 * the incident route already use.
 *
 * ── WHY THE THIRTY IDENTIFIERS ARE A LITERAL LIST IN THIS DIRECTORY ────────
 * `registries/generated/ai-storyboards.json` read 0 of 48 for the `SB-AI-*`
 * register on the tree this route landed on, and that zero was correct rather
 * than broken. `scripts/build-registries.mjs` walks each directory under `app/`
 * that holds a `page.tsx`, reads the `.ts` and `.tsx` files sitting directly in
 * it, and collects every hyphenated capitalised token; a row reads
 * `demonstrated-in-storyboard` only when that set holds its exact identifier as
 * a whole token. Six `SB-AI-*` identifiers were already named under `src/` and
 * not one of them moved a status, because `src/` is not `app/`.
 *
 * So a page that resolves its identifiers at run time out of an imported data
 * module renders them for a human and is invisible to that scan. That is not a
 * hypothesis: `FEAT-SA-0703`, `SUB-SA-0703` and `FUNC-SA-0703` are real source
 * identifiers at L47803, rendered on the incident console since wave 3, and all
 * three read `not-represented` for precisely this reason.
 *
 * The list below is therefore not a duplicate of the data. It is the page's own
 * navigable index — thirty cards of nineteen fields and a five-row surface
 * reaction is a long document, and a document that long needs a way in — and it
 * is declared where the evidence class can see it.
 * `tests/unit/ai-and-its-absence-route.test.ts` holds it against its own
 * literal list and against the aggregated cards, so it cannot drift into an
 * index that agrees with nothing.
 *
 * ── NO MODULE IDENTIFIER IS WRITTEN IN THIS DIRECTORY ──────────────────────
 * The registry build reads a route's own `MOD-*` mentions as OWNERSHIP evidence
 * and resolves ties by throwing. This chapter mints no module identifier at all
 * — measured for the whole slice: zero occurrences of `MOD-AI-` in the frozen
 * source — so naming any module here would hand this route to a module that
 * does not own it. The reader still sees the pause feature's source-attributed
 * module, rendered out of the record where the claim and its line live
 * together. Same rule, same reason, as the incident route's own gate.
 */

export const AI_AND_ITS_ABSENCE_ROUTE = {
  path: '/workflows/ai-and-its-absence',
  title: 'Artificial intelligence and its absence',
  /** `## 44A.` at L92596 to the chapter's closing rule at L95408. */
  chapterSpan: 'L92596-L95408',
  sourceStatus:
    'The slug and the decision to collect this chapter on one page are this build\'s, not the '
    + 'source\'s: the frozen source carries no URL notation for it and names no screen that holds '
    + 'the thirty storyboards together. Client-delegated choice under APP-012. What is '
    + 'source-defined is the subject and its bounds.',
} as const

/**
 * THE THIRTY, IN THE CHAPTER'S OWN ORDER.
 *
 * Transcribed from the card identifier rows rather than counted or generated.
 * `SB-AI-01` is the identifier row at L92793, `SB-AI-15` at L93992 and
 * `SB-AI-30` at L95251; `src/ai/storyboards/contract.ts` carries the full index
 * of all thirty rows and each entry below was confirmed against it.
 *
 * A generated list — `map` over the data, or a loop over a numeric range —
 * would agree with any population the data happened to hold, which is the
 * defect a membership gate exists to catch. This is a literal list, and adding
 * a member to it or dropping one is red.
 */
export const STORYBOARD_IDENTIFIER_ORDER = [
  'SB-AI-01', 'SB-AI-02', 'SB-AI-03', 'SB-AI-04', 'SB-AI-05',
  'SB-AI-06', 'SB-AI-07', 'SB-AI-08', 'SB-AI-09', 'SB-AI-10',
  'SB-AI-11', 'SB-AI-12', 'SB-AI-13', 'SB-AI-14', 'SB-AI-15',
  'SB-AI-16', 'SB-AI-17', 'SB-AI-18', 'SB-AI-19', 'SB-AI-20',
  'SB-AI-21', 'SB-AI-22', 'SB-AI-23', 'SB-AI-24', 'SB-AI-25',
  'SB-AI-26', 'SB-AI-27', 'SB-AI-28', 'SB-AI-29', 'SB-AI-30',
] as const

/**
 * The thirty cards, in one list, from the three data modules wave 4 built.
 *
 * Concatenated here rather than in a new module under `src/ai/storyboards/`,
 * because this is the only consumer and a shared aggregate with one caller is a
 * file to keep in step for no reader's benefit. Nothing is reordered and nothing
 * is filtered: in particular storyboard 25 keeps reporting its violation, which
 * `StoryboardCard` renders in an alert. Filtering it out would silence the one
 * paraphrase prohibition the source actually states, at L94876.
 */
export const ALL_THIRTY_STORYBOARDS = [
  ...STORYBOARDS_01_TO_10,
  ...STORYBOARDS_11_TO_20,
  ...SB_21_TO_30,
] as const satisfies readonly Storyboard[]

/**
 * THE FOURTH OWNER OF THIS PAGE'S FIRST FALLBACK LITERAL, NAMED.
 *
 * `FB-AI-01` names four different contracts in four places that do not
 * cross-reference each other, which is why every card on this page renders a
 * compound key of section number and literal rather than the bare literal. One
 * of the other three owners is the chapter-24 family row at L46951:
 * "Artificial-intelligence degraded or unavailable, including the platform
 * emergency pause."
 *
 * L47803 is where that emergency pause is filed, and it is filed as a
 * source-attributed feature whose OWN declared fallback is that same literal:
 * `FEAT-SA-0703` "The emergency pause", `SUB-SA-0703` "Checkpoint at stage
 * boundary, resume separately", `FUNC-SA-0703` "Render agent unavailability
 * honestly and never suppress the on-device deterministic layer", actor Root
 * Super Admin, fallback `FB-AI-01`, classified `SoW Fact — §8.7.5`.
 *
 * So a reader looking at storyboard 1's `44A.1 · FB-AI-01` and told that
 * sixteen of these literals mean something else needs the feature the family
 * owner belongs to, by name. That is what this triple is for, and it is the
 * reason it is a literal here rather than a field read at render time: the
 * record already exists in `src/ai/controls/decisions.ts` and is already
 * rendered on the incident console, and all three identifiers still read
 * `not-represented` in three of the client's named inventories because that
 * console names them only through a constant.
 *
 * The names, the actor, the classification and the module are all rendered from
 * the record and not retyped here. Only the three identifiers are literal, and
 * `tests/unit/ai-and-its-absence-route.test.ts` asserts they are the record's
 * own, so a divergence is red rather than plausible.
 */
export const PAUSE_FEATURE_IDENTIFIERS = [
  'FEAT-SA-0703',
  'SUB-SA-0703',
  'FUNC-SA-0703',
] as const

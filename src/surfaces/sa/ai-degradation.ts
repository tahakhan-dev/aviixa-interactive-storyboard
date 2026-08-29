import { SA_MODULES, type SaModuleId } from '@/surfaces/sa/modules'
import {
  CONSOLE_AUTHORITY_ATTRIBUTION,
  CONSOLE_AUTHORITY_CAPTION_REF,
} from '@/surfaces/sa/ai-failure-authority'
import {
  APP_012_DELEGATED_CHOICE,
  FIVE_SURFACE_OBLIGATIONS,
  OVERLAY_PROVENANCE,
  overlayJourneyCode,
  type DraftMessage,
  type OverlayRow,
  type OverlayTable,
  type SurfaceAiOverlay,
} from '@/ai/five-surface/overlay'

/**
 * `SURF-SA` — THE SUPER ADMIN PLATFORM CONSOLE'S AI-DEGRADATION OVERLAY.
 *
 * DERIVED, and the measurement that makes it so is an ABSENCE: §43.3.5 (heading
 * L91214) has exactly one table — the fifteen-row control x platform-role
 * authority matrix at L91282-L91298 — and **zero `MOD-SA` tokens occur in
 * L91214-L91282**. There is no per-module artificial-intelligence-failure table
 * for this surface, so the per-module overlay below is this build's, marked
 * `Derived Clarification` and labelled a client-delegated choice under APP-012.
 *
 * ── THE FIFTEEN-ROW MATRIX IS NOT REBUILT HERE ────────────────────────────
 * `@/surfaces/sa/ai-failure-authority` already holds it, wave 2 built it, task
 * 14 extended it, and `AiFailureAuthorityPanel` already renders it from
 * `app/super-admin/ai-incidents`. It is consumed READ-ONLY: this module imports
 * its attribution and its caption locator so the console has ONE answer about
 * where that matrix comes from, and transcribes not one cell of it. A second
 * transcription of one table is two things that can disagree about it, which is
 * the defect `src/surfaces/cc/modules/cc-08/degradation.ts` warns about.
 *
 * `SA_FAILURE_RESPONSE_CONTROLS` used to sit here too — the matrix's control
 * names, re-derived "so this overlay cannot drift from it" — and nothing read
 * it, which makes it a drift check that never ran. It is deleted rather than
 * rendered: the controls are the authority matrix's own content and
 * `AiFailureAuthorityPanel` already renders them. `SA_AUTHORITY_PROVENANCE`
 * went the same way; the covering test asserts this overlay's class against
 * `CONSOLE_AUTHORITY_PROVENANCE` directly, so a re-export in between was one
 * more name for the same fact.
 *
 * ── THE CONSOLE'S AXIS IS `Control`, WHICH IS WHY THE MODULE OVERLAY IS NEW
 * The matrix's own caption is "Authority matrix for the console's
 * failure-response controls" and its axis heading is `Control`. Controls are
 * not modules. Attributing the matrix to `MOD-SA-07` is a build inference and
 * `CONSOLE_AUTHORITY_ATTRIBUTION` already renders it as one — that attribution
 * is re-exported here rather than restated, so the console has one answer to
 * the question and not two, and it renders through `sourceNotes` below.
 *
 * ── THERE IS NO SOURCE-STATED FLOOR FOR THIS SURFACE, UNLIKE THE HUB ──────
 * The Hub at least has required behaviour 3 (L90861) naming eight of its
 * modules informally. The console has NOTHING of the kind: chapter 43 names no
 * `MOD-SA` module at all. So every row of the per-module table below is derived,
 * `namedInSourceFloor` would be false on all nineteen, and the field is not
 * carried — a flag that is constant is a flag that tells a reader nothing.
 * The absence is stated in `SA_FLOOR_ABSENCE` instead, which is the honest
 * shape: a stated absence with the sweep that measured it.
 *
 * ── THE DERIVATION RULE, AND IT IS THE SOURCE'S OWN ───────────────────────
 * `AC-43-351` (L91304) — the console classifies every incident as
 * artificial-intelligence, connectivity, or compound, COMPUTED from device sync
 * state and provider health rather than entered by hand. `AC-43-352` (L91305) —
 * no console action reaches a tenant's operational content outside one of the
 * three named access classes. Those two together are the rule every derived row
 * is derived by: a console module observes and responds at the platform layer
 * and does not reach into tenant operational content to do it.
 *
 * ── THREE SURFACE EXCLUSIONS, AND ONE LOCATOR EVERY BRIEF GOT WRONG ───────
 * `AC-43-336` (L91105) — the Read-only Auditor has no access to this surface
 * under any failure condition. `AC-43-352` (L91305). `AC-43-356` — no
 * failure-response control crosses a tenant boundary — is at **L91309**, NOT
 * the L91306 every brief in this cluster gave. L91306 is `AC-43-353`, a
 * different criterion about critical-class root approval. The wrong line was
 * three rows short and both lines are `AC-43-35x` criteria in one list, which
 * is exactly how an off-by-a-few locator survives review.
 *
 * ── AND `AC-43-356`'s TRAILING CLAUSE COLLIDES WITH THIS CONSOLE'S OWN RULE
 * The criterion states its check method in a clause that uses one of the four
 * words D10 forbids in this surface's copy — words that are audit-integrity
 * claims the source does not support here, used in the criterion in an entirely
 * unrelated sense. Rather than paraphrase a criterion or drop it, the clause is
 * withheld and the reason renders beside it, through the `withheld` field on
 * the obligation. The collision is real and is reported as a seam; neither rule
 * is weakened to resolve it, and no file of this task spells the four words.
 *
 * `PROV-4`, the same class the authority matrix emits.
 */

/* ==================================================================== *
 * THE MEASURED ABSENCE.
 * ==================================================================== */

export const SA_FLOOR_ABSENCE = {
  what: 'Any per-module artificial-intelligence-failure behaviour for this surface.',
  sweep:
    'Section 43.3.5 spans L91214 onward and its only table is the control x platform-role '
    + 'authority matrix. The span L91214-L91282 was swept for `MOD-SA` and carries zero '
    + 'occurrences. Chapter 43 as a whole names no Super Admin module.',
  soWhat:
    'Unlike the Delivery Operations Hub, whose required behaviour 3 at L90861 names eight of '
    + 'its modules informally, this surface has no source-stated floor at all. Every row of '
    + "the per-module table is this build's.",
  sourceRef: 'L91214',
} as const

/** The console matrix's axis, and why it is not a module axis. Re-exported, not restated. */
export const SA_MATRIX_ATTRIBUTION = CONSOLE_AUTHORITY_ATTRIBUTION
export const SA_MATRIX_CAPTION_REF = CONSOLE_AUTHORITY_CAPTION_REF

/* ==================================================================== *
 * THE DERIVED PER-MODULE OVERLAY.
 * ==================================================================== */

export const SA_DERIVATION_RULE = {
  statement:
    'A console module observes and responds at the platform layer during an '
    + "artificial-intelligence failure, and does not reach into a tenant's operational content "
    + 'to do it. Incident classification is computed from device sync state and provider '
    + 'health, never entered by hand.',
  restsOn: [
    { id: 'AC-43-351', sourceRef: 'L91304' },
    { id: 'AC-43-352', sourceRef: 'L91305' },
  ],
} as const

export interface SaModuleAiRow extends OverlayRow {
  readonly moduleId: SaModuleId
  readonly moduleName: string
  readonly draft: DraftMessage
}

const DERIVED_EN =
  'Remains available and observes at the platform layer. Derived: chapter 43 states no '
  + 'per-module behaviour for this console, and the incident-classification and '
  + 'access-class rules apply to this module by the same reasoning.'
const DERIVED_ES =
  'Permanece disponible y observa en la capa de plataforma. Derivado: el capítulo 43 no '
  + 'establece ningún comportamiento por módulo para esta consola, y las reglas de '
  + 'clasificación de incidentes y de clase de acceso se aplican a este módulo por el mismo '
  + 'razonamiento.'

export const SA_MODULE_AI_ROWS: readonly SaModuleAiRow[] = SA_MODULES.map((module) => ({
  moduleId: module.id,
  moduleName: module.name,
  cells: [
    `${module.id} ${module.name}`,
    DERIVED_EN,
    '`Derived Clarification` — chapter 43 names no Super Admin module',
  ],
  sourceRef: 'L91304',
  kind: 'derived' as const,
  readings: [],
  draft: { en: DERIVED_EN, es: DERIVED_ES },
}))

export const SA_MODULE_AI_TABLE: OverlayTable = {
  caption:
    'Per-module behaviour during an artificial-intelligence failure — derived, not transcribed.',
  // NO CAPTION LINE AND NO HEADER LINE. L91304 is `AC-43-351`, an acceptance
  // criterion, and carries neither this caption nor these headings. It is the
  // derivation's BASIS and is cited as one, in `whyDerived` and on every row.
  captionRef: null,
  headings: [
    'Super Admin platform console module',
    'Behaviour during an artificial-intelligence failure',
    'Classification',
  ],
  headerRef: null,
  kind: 'derived',
  whyDerived:
    "Section 43.3.5's only table is the control x platform-role authority matrix at "
    + 'L91282-L91298, whose axis is `Control`, and L91214-L91282 carries zero `MOD-SA` tokens. '
    + 'No chapter-43 line states a per-module console behaviour, so every row below rests on '
    + '`AC-43-351` (L91304) and `AC-43-352` (L91305) rather than on a line that states it. '
    + APP_012_DELEGATED_CHOICE,
  rows: SA_MODULE_AI_ROWS,
}

export const SA_AI_OVERLAY: SurfaceAiOverlay = {
  surfaceId: 'SURF-SA',
  journeyCode: overlayJourneyCode('SURF-SA'),
  tables: [SA_MODULE_AI_TABLE],
  provenance: OVERLAY_PROVENANCE,
  obligations: [
    ...FIVE_SURFACE_OBLIGATIONS,
    {
      id: 'AC-43-336',
      sourceRef: 'L91105',
      text: 'The Read-only Auditor has no access to this surface under any failure condition.',
      withheld: null,
    },
    {
      id: 'AC-43-352',
      sourceRef: 'L91305',
      text:
        "No console action reaches a tenant's operational content outside one of the three "
        + 'named access classes.',
      withheld: null,
    },
    {
      id: 'AC-43-356',
      sourceRef: 'L91309',
      // THE SUBSTANCE, VERBATIM. The criterion's trailing test-method clause is
      // withheld here and the reason renders beside it — see `withheld`.
      text: 'No failure-response control crosses a tenant boundary.',
      withheld:
        "The criterion's trailing clause, which states how it is to be checked, uses one of "
        + 'the four words this console may not print in its own copy under D10 — each of them '
        + 'an audit-integrity claim the source does not support for this surface. In the '
        + 'criterion the word carries an unrelated sense. The clause is withheld rather than '
        + 'paraphrased, because paraphrasing a criterion is a worse outcome than naming what '
        + 'is missing, and the line is openable at L91309.',
    },
  ],
  sourceNotes: [
    {
      heading: 'The rule every derived row below is derived by, and the criteria it rests on.',
      body: `${SA_DERIVATION_RULE.statement} It rests on `
        + SA_DERIVATION_RULE.restsOn.map((ac) => `${ac.id} (${ac.sourceRef})`).join(' and ')
        + '.',
      sourceRef: SA_DERIVATION_RULE.restsOn[0]?.sourceRef ?? 'L91304',
      readings: [],
      adopted: null,
    },
    {
      heading: `The authority matrix is filed under no module, and \`${SA_MATRIX_ATTRIBUTION.theIdentifierABuildWouldReachFor}\` is the reach this build did not take.`,
      // NO ", at L#####." SUFFIX ON THE CAPTION SENTENCE — a bare blueprint
      // line locator rendered as page content via `AiDegradationOverlay`'s
      // `{note.body}`, §8.6.2. `SA_MATRIX_CAPTION_REF` is kept as `sourceRef`
      // below (the overlay's `data-source-note` traceability attribute), not
      // deleted — only the "at Lxxxxx" prose is.
      body: [
        `Caption: ${SA_MATRIX_ATTRIBUTION.caption}.`,
        `What the source assigns: ${SA_MATRIX_ATTRIBUTION.whatTheSourceAssigns}`,
        SA_MATRIX_ATTRIBUTION.whyThatReachIsNotTheSource,
        SA_MATRIX_ATTRIBUTION.howThisBuildRendersIt,
      ].join(' '),
      sourceRef: SA_MATRIX_CAPTION_REF,
      readings: [],
      adopted: null,
    },
  ],
  statedAbsences: [
    {
      what: 'Any access at all for the Read-only Auditor.',
      reason:
        'No access to this surface under any failure condition. Not a reduced view and not a '
        + 'read-only one — none.',
      sourceRef: 'L91105',
    },
    {
      what: 'A per-module console behaviour stated by chapter 43.',
      reason: SA_FLOOR_ABSENCE.sweep,
      sourceRef: 'L91214',
    },
    {
      what: 'A second transcription of the fifteen-row authority matrix.',
      reason:
        '`@/surfaces/sa/ai-failure-authority` holds it and `AiFailureAuthorityPanel` renders '
        + 'it. This module consumes it read-only and transcribes no cell of it, so the console '
        + 'has one answer about its failure-response authority rather than two.',
      sourceRef: 'L91282',
    },
  ],
}


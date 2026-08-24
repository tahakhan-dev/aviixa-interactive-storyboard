import {
  DOH_MODULES,
  DOH_OUT_OF_SLICE_MODULES,
  type DohCanonicalModuleId,
} from '@/surfaces/doh/modules'
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
 * `SURF-DOH` — THE DELIVERY OPERATIONS HUB'S AI-DEGRADATION OVERLAY.
 *
 * TWO TABLES, AND THEY ARE DIFFERENT KINDS OF CLAIM.
 *
 * ── TABLE ONE: TRANSCRIBED, AND ITS AXIS IS NOT A MODULE ──────────────────
 * The line that makes it transcribed is the header at **L90905**:
 * `| Failure family | Official record | Deterministic validation |
 * Artificial-intelligence-derived fields | Export | Audit |`, under the caption
 * `**Behaviour matrix by failure family.**` at L90903, in §43.3.1 (heading
 * L90849). The rule at L90906 and SIX content rows at L90907-L90912 — COUNTED
 * from the header.
 *
 * Six columns wide, and the axis is `Failure family`, not a module. This is
 * §43.3.1's ONLY table.
 *
 * ── TABLE TWO: DERIVED, BECAUSE THE HUB HAS NO PER-MODULE AI TABLE ────────
 * There is no per-module artificial-intelligence-failure table for this
 * surface anywhere in chapter 43. The nearest module content is PROSE:
 * required behaviour 3 at **L90861**, which names Hub modules informally in a
 * comma-separated appositive and states no number.
 *
 * SO THE PER-MODULE OVERLAY IS THIS BUILD'S, marked `Derived Clarification`,
 * labelled a client-delegated choice under APP-012, and NO CHAPTER-43 LINE IS
 * CITED AS THOUGH IT STATED A PER-MODULE HUB BEHAVIOUR. L90861 is cited as
 * what it is: the prose the derivation rests on.
 *
 * ── THE INFORMAL LIST HAS EIGHT ITEMS, AND EVERY BRIEF SAID NINE ──────────
 * MEASURED by splitting L90861's appositive on its commas:
 *
 *   worker lifecycle · job lifecycle and approval · run scheduling ·
 *   assignment · execution summary review · permissions · notifications ·
 *   audit and retention
 *
 * EIGHT items, not nine. The source itself states no count — "Every Hub module
 * — [list] — operates without artificial intelligence" is an appositive, and
 * the number came from the briefs rather than the line. Resolved to
 * `MOD-DOH-04` through `MOD-DOH-11` in registry order, which is contiguous and
 * is the strongest available corroboration that the mapping is the intended
 * one. Nothing below stores a count; `DOH_AI_FLOOR_MODULE_IDS` is a literal
 * membership list, so a deletion fails by name.
 *
 * ── AND "EVERY HUB MODULE" READS TWO WAYS, SO BOTH READINGS RENDER ────────
 * Reading A: `Every` is universal, so all nineteen modules are source-stated.
 * Reading B: the appositive enumerates the modules meant, so the eight named
 * are source-stated and the rest are not.
 *
 * This build obeys B for the eight and derives the remainder, because derived
 * is the WEAKER claim and a build may not upgrade its own inference to a
 * source fact. Reading A is disclosed on screen with its locator rather than
 * discarded, because it is the more natural reading of the word `Every` and a
 * reader who takes it is not making a mistake. Both render; neither is
 * presented as the source's answer.
 *
 * ── THE ROLE IN THE RULE IS WHY THE FLOOR IS A FLOOR ──────────────────────
 * L90861's own reason: artificial intelligence "contributes commentary and
 * proposals, never records". The Hub is the tenant system of record, so an
 * artificial-intelligence failure can cost it commentary and can never cost it
 * a record. That is the rule the derived rows are derived BY, stated once, and
 * it is also why `AC-43-312` (L90919) binds here hardest: every
 * artificial-intelligence-derived field is always in exactly one of four
 * labelled states and BLANK IS NEVER RENDERED.
 *
 * `PROV-4`. Every row is a deterministic rule — transcribed in table one,
 * derived by a stated rule in table two, and the difference is on every row.
 */

/* ==================================================================== *
 * TABLE ONE — TRANSCRIBED. THE FAILURE-FAMILY MATRIX.
 * ==================================================================== */

const familyRow = (cells: readonly string[], sourceRef: string): OverlayRow => ({
  cells,
  sourceRef,
  kind: 'transcribed',
  readings: [],
})

export const DOH_FAILURE_FAMILY_TABLE: OverlayTable = {
  caption: 'Behaviour matrix by failure family.',
  captionRef: 'L90903',
  headings: [
    'Failure family',
    'Official record',
    'Deterministic validation',
    'Artificial-intelligence-derived fields',
    'Export',
    'Audit',
  ],
  headerRef: 'L90905',
  kind: 'transcribed',
  whyDerived: null,
  rows: [
    familyRow(
      [
        'Provider and model',
        'Allowed — unaffected',
        'Allowed',
        'Pending label',
        'Allowed with conditions — pending panel included',
        'Allowed',
      ],
      'L90907',
    ),
    familyRow(
      [
        'Orchestration and agent',
        'Allowed — unaffected',
        'Allowed',
        'Failed label with reason',
        'Allowed with conditions',
        'Allowed',
      ],
      'L90908',
    ),
    familyRow(
      [
        'Retrieval, memory, content',
        'Allowed — unaffected',
        'Allowed',
        'Pending or failed label',
        'Allowed with conditions',
        'Allowed',
      ],
      'L90909',
    ),
    familyRow(
      [
        'Governance and evaluation',
        'Allowed — unaffected',
        'Allowed',
        'Pending label; capability disabled',
        'Allowed with conditions',
        'Allowed',
      ],
      'L90910',
    ),
    familyRow(
      [
        'Connectivity and device',
        'Allowed — records land late, flagged',
        'Allowed',
        'Pending label',
        'Allowed with conditions',
        'Allowed',
      ],
      'L90911',
    ),
    familyRow(
      [
        'Recovery and reconciliation',
        'Allowed — recomputed with as-of stamps',
        'Allowed',
        'Stale label where context changed',
        'Allowed with conditions',
        'Allowed',
      ],
      'L90912',
    ),
  ],
}

/* ==================================================================== *
 * TABLE TWO — DERIVED. THE PER-MODULE OVERLAY.
 * ==================================================================== */

/**
 * The rule required behaviour 3 states, verbatim, and the reason it gives.
 * Quoted once, cited once, and it is what every derived row is derived by.
 */
export const DOH_MANUAL_WORKFLOW_RULE = {
  statement:
    'Manual workflow remains fully available. Every Hub module operates without artificial '
    + 'intelligence, because artificial intelligence contributes commentary and proposals, '
    + 'never records.',
  sourceRef: 'L90861',
  classification: '`SoW Fact — §4.1.3 module inventory`',
} as const

/**
 * The modules L90861's appositive NAMES, resolved to identifiers. A literal
 * membership list typed to the canonical union: a deletion fails to compile
 * against the union AND fails the covering test by name, and an addition fails
 * the covering test against the appositive parsed out of the frozen line.
 *
 * NO COUNT IS STORED. The source states none and every brief's number was
 * wrong.
 */
export const DOH_AI_FLOOR_MODULE_IDS: readonly DohCanonicalModuleId[] = [
  'MOD-DOH-04',
  'MOD-DOH-05',
  'MOD-DOH-06',
  'MOD-DOH-07',
  'MOD-DOH-08',
  'MOD-DOH-09',
  'MOD-DOH-10',
  'MOD-DOH-11',
]

/** The appositive's own words, in the order the line writes them, for the join. */
export const DOH_AI_FLOOR_PHRASES: readonly {
  readonly phrase: string
  readonly moduleId: DohCanonicalModuleId
}[] = [
  { phrase: 'worker lifecycle', moduleId: 'MOD-DOH-04' },
  { phrase: 'job lifecycle and approval', moduleId: 'MOD-DOH-05' },
  { phrase: 'run scheduling', moduleId: 'MOD-DOH-06' },
  { phrase: 'assignment', moduleId: 'MOD-DOH-07' },
  { phrase: 'execution summary review', moduleId: 'MOD-DOH-08' },
  { phrase: 'permissions', moduleId: 'MOD-DOH-09' },
  { phrase: 'notifications', moduleId: 'MOD-DOH-10' },
  { phrase: 'audit and retention', moduleId: 'MOD-DOH-11' },
]

/**
 * The two readings of `Every Hub module`, both rendered, neither obeyed
 * silently. Disclosure rather than adjudication: the source authorises both
 * and this build has no authority to settle it.
 */
export const DOH_EVERY_MODULE_READINGS: readonly {
  readonly reading: string
  readonly text: string
  readonly sourceRef: string
}[] = [
  {
    reading: 'A — universal',
    text:
      '`Every Hub module` is universal, so the sentence states the behaviour of all nineteen '
      + 'canonical modules and the comma-separated list is illustrative.',
    sourceRef: 'L90861',
  },
  {
    reading: 'B — enumerative',
    text:
      'The appositive enumerates the modules meant, so the eight it names are source-stated '
      + 'and the remainder are not stated at all.',
    sourceRef: 'L90861',
  },
]

/** Which reading this build built on, and why it is the weaker one. */
export const DOH_READING_ADOPTED = {
  adopted: 'B — enumerative',
  why:
    'Derived is the weaker claim. Building on A would let this overlay present eleven rows '
    + 'this build wrote as behaviour the source stated, and a build may not upgrade its own '
    + 'inference into a source fact. Reading A renders beside it because it is the more '
    + 'natural reading of `Every` and a reader who takes it is not mistaken.',
  bothRender: true,
} as const

export interface DohModuleAiRow extends OverlayRow {
  readonly moduleId: DohCanonicalModuleId
  readonly moduleName: string
  /** True where L90861's appositive names this module. */
  readonly namedInSourceFloor: boolean
  /**
   * The derived sentence, in both authored locales, marked draft. Present on
   * every row: even a floor row's SENTENCE is this build's wording, because
   * L90861 writes one sentence over a list rather than a sentence per module.
   */
  readonly draft: DraftMessage
}

/** Every canonical Hub module, routed or not, from the registry rather than typed. */
const ALL_HUB_MODULES: readonly { readonly id: DohCanonicalModuleId; readonly name: string }[] = [
  ...DOH_MODULES.map((m) => ({ id: m.id as DohCanonicalModuleId, name: m.name })),
  ...DOH_OUT_OF_SLICE_MODULES.map((m) => ({ id: m.id as DohCanonicalModuleId, name: m.name })),
]

const FLOOR_DRAFT_EN =
  'Operates without artificial intelligence. This module is named in required behaviour 3, '
  + 'which states that manual workflow remains fully available.'
const FLOOR_DRAFT_ES =
  'Funciona sin inteligencia artificial. Este módulo se nombra en el comportamiento requerido '
  + '3, que establece que el flujo de trabajo manual permanece totalmente disponible.'
const DERIVED_DRAFT_EN =
  'Operates without artificial intelligence. Derived: required behaviour 3 does not name this '
  + 'module, and the rule it states — artificial intelligence contributes commentary and '
  + 'proposals, never records — applies to it by the same reasoning.'
const DERIVED_DRAFT_ES =
  'Funciona sin inteligencia artificial. Derivado: el comportamiento requerido 3 no nombra '
  + 'este módulo, y la regla que establece — la inteligencia artificial aporta comentarios y '
  + 'propuestas, nunca registros — se le aplica por el mismo razonamiento.'

export const DOH_MODULE_AI_ROWS: readonly DohModuleAiRow[] = ALL_HUB_MODULES.map((module) => {
  const named = DOH_AI_FLOOR_MODULE_IDS.includes(module.id)
  return {
    moduleId: module.id,
    moduleName: module.name,
    namedInSourceFloor: named,
    cells: [
      `${module.id} ${module.name}`,
      named ? FLOOR_DRAFT_EN : DERIVED_DRAFT_EN,
      named
        ? 'Source-stated floor — `SoW Fact — §4.1.3 module inventory`, named in required behaviour 3'
        : '`Derived Clarification` — not named in required behaviour 3',
    ],
    // Both are derived ROWS: the source writes one sentence over a list, never
    // a row per module. `namedInSourceFloor` is what separates the two claims,
    // and it is a field rather than a `kind` because the ROW is derived either
    // way.
    sourceRef: 'L90861',
    kind: 'derived' as const,
    readings: [],
    draft: {
      en: named ? FLOOR_DRAFT_EN : DERIVED_DRAFT_EN,
      es: named ? FLOOR_DRAFT_ES : DERIVED_DRAFT_ES,
    },
  }
})

export const DOH_MODULE_AI_TABLE: OverlayTable = {
  caption:
    'Per-module behaviour during an artificial-intelligence failure — derived, not transcribed.',
  captionRef: 'L90861',
  headings: [
    'Delivery Operations Hub module',
    'Behaviour during an artificial-intelligence failure',
    'Classification',
  ],
  headerRef: 'L90861',
  kind: 'derived',
  whyDerived:
    'Chapter 43 carries no per-module artificial-intelligence-failure table for this surface. '
    + "Section 43.3.1's only table has the axis `Failure family` (header L90905), and the "
    + 'nearest module content is required behaviour 3 at L90861, which names Hub modules in a '
    + 'comma-separated appositive and states no per-module behaviour. Every row below is this '
    + "build's, derived from that rule. " + APP_012_DELEGATED_CHOICE,
  rows: DOH_MODULE_AI_ROWS,
}

/** Modules whose row rests on this build's reasoning rather than the appositive. */
export const DOH_DERIVED_ONLY_MODULE_IDS: readonly DohCanonicalModuleId[] =
  DOH_MODULE_AI_ROWS.filter((row) => !row.namedInSourceFloor).map((row) => row.moduleId)

export const DOH_AI_OVERLAY: SurfaceAiOverlay = {
  surfaceId: 'SURF-DOH',
  journeyCode: overlayJourneyCode('SURF-DOH'),
  tables: [DOH_FAILURE_FAMILY_TABLE, DOH_MODULE_AI_TABLE],
  provenance: OVERLAY_PROVENANCE,
  obligations: [
    ...FIVE_SURFACE_OBLIGATIONS,
    {
      id: 'AC-43-312',
      sourceRef: 'L90919',
      text:
        'Every artificial-intelligence-derived field is always in exactly one of four labelled '
        + 'states; blank is never rendered.',
      withheld: null,
    },
    {
      id: 'TEST-43-332',
      sourceRef: 'L91110',
      text: 'Staleness-rendering test asserting dated history rather than current presentation.',
      withheld: null,
    },
  ],
  statedAbsences: [
    {
      what: 'A per-module artificial-intelligence-failure behaviour stated by chapter 43.',
      reason:
        "Section 43.3.1's only table has the axis `Failure family`, and no `MOD-DOH` "
        + 'identifier occurs in chapter 43 at all. The per-module table this overlay carries is '
        + 'derived and says so on every row.',
      sourceRef: 'L90905',
    },
    {
      what: 'An artificial-intelligence-derived field rendered blank.',
      reason:
        'Exactly one of four labelled states, always. Pending, failed with reason, stale, or '
        + 'present — never empty.',
      sourceRef: 'L90919',
    },
  ],
}

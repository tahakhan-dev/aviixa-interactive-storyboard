import {
  APP_012_DELEGATED_CHOICE,
  FIVE_SURFACE_OBLIGATIONS,
  OVERLAY_PROVENANCE,
  overlayJourneyCode,
  type OverlayRow,
  type OverlayTable,
  type SurfaceAiOverlay,
} from '@/ai/five-surface/overlay'

/**
 * `SURF-STU` — THE STANDARDS AND OPERATIONS STUDIO'S AI-DEGRADATION OVERLAY.
 *
 * TRANSCRIBED, and the line that makes it so is the header at **L90989**:
 * `| Capability | Artificial intelligence healthy | Artificial intelligence
 * failed | Classification |`, under the caption `**Behaviour matrix.**` at
 * L90987, in §43.3.2 (heading L90933). The rule at L90990 and twelve content
 * rows at L90991-L91002 — COUNTED by walking the pipe-prefixed lines beneath
 * the header, not taken from a span.
 *
 * ── THE AXIS IS `Capability`, AND THERE IS NO JOIN KEY TO A MODULE ─────────
 * §43.3.2 was swept end to end: ZERO occurrences of `MOD-STU-`. This table
 * does not name a Studio module and cannot be turned into one that does. The
 * eighteen-module Studio registry is itself derived — L4036 says the count is
 * `Derived Clarification` under `DEC-STUDIO-001`, and that Part V publishes no
 * module inventory at all, unlike the Hub's §4.1.3, the Command Center's
 * §6.1.6 and the Frontline's §7.3. So there is no module column here, no
 * module column may be invented, and NO GATE MAY TREAT THIS TABLE AS COVERAGE
 * OF `SURF-STU`'S EIGHTEEN MODULES. Twelve capabilities and eighteen modules
 * are two different populations; a gate reading one as the other would report
 * 12/18 coverage of a thing this table never claimed to cover.
 *
 * ── THE STUDIO RENDERS NO RUNTIME AVAILABILITY STATE, AND THAT IS STATED ──
 * §42.6's queued-request matrix reads `Not applicable` in the Studio column on
 * ALL TWELVE rows (L89697-L89708), and row one carries the long form: "the
 * Studio authors content, it does not observe runtime requests". `AC-42-301`
 * (L89400) is CONDITIONAL — it binds "every surface that DISPLAYS an
 * artificial-intelligence availability state" — so a surface displaying none
 * is out of scope for mode parity rather than in breach of it. An overlay that
 * rendered a Studio runtime state to satisfy a five-surface parity rule would
 * contradict the source it was trying to obey. The absence is declared in
 * `statedAbsences` with its reason, which is what makes it a statement.
 *
 * ── ONE ROW IS UNDECIDED AND ITS DECISION IS NOT IN THE CANON ─────────────
 * `Fallback-readiness validation` at L91002 reads `Allowed` in both condition
 * columns with the classification `Client Decision Required` under
 * `DEC-AIFALLBACK-001`. That identifier is NOT a member of the exported
 * `DecisionId` union, and `src/disclosure/decisions.ts` is wave 5's. So it is
 * disclosed LOCALLY, in the slice-8 pattern, through `STU_UNCANONISED_DECISIONS`
 * below — which is RENDERED, through `sourceNotes` on the overlay, and was not
 * when this sentence was first written: the record had exactly one occurrence
 * in the tree, its own declaration, while this comment said it was disclosed.
 * It is reported as a seam rather than added to a module this task does not
 * own. The row still renders whole, classification included: dropping the
 * classification because the canon cannot hold the identifier would delete the
 * one thing telling a reader the row is unsettled.
 *
 * `PROV-4`. Everything here is a transcribed deterministic rule.
 */

const row = (cells: readonly string[], sourceRef: string): OverlayRow => ({
  cells,
  sourceRef,
  kind: 'transcribed',
  readings: [],
})

export const STU_AI_BEHAVIOUR_TABLE: OverlayTable = {
  caption: 'Behaviour matrix.',
  captionRef: 'L90987',
  headings: [
    'Capability',
    'Artificial intelligence healthy',
    'Artificial intelligence failed',
    'Classification',
  ],
  headerRef: 'L90989',
  kind: 'transcribed',
  whyDerived: null,
  rows: [
    row(
      ['Manual authoring of screens and limits', 'Allowed', 'Allowed', '`SoW Fact — §5.4, §5.5`'],
      'L90991',
    ),
    row(
      [
        'Artificial-intelligence drafting of the two other difficulty levels',
        'Allowed',
        'Queued while unavailable',
        '`SoW Fact — §5.9`',
      ],
      'L90992',
    ),
    row(
      [
        'Manual authoring of all three difficulty levels',
        'Allowed',
        'Allowed',
        '`Derived Clarification`',
      ],
      'L90993',
    ),
    row(['Draft persistence', 'Allowed', 'Allowed', '`Derived Clarification`'], 'L90994'),
    row(
      ['Submission into the approval chain', 'Allowed', 'Allowed', '`SoW Fact — §5.11.1`'],
      'L90995',
    ),
    row(
      [
        'Publication with an undrafted level',
        'Explicitly prohibited',
        'Explicitly prohibited',
        '`SoW Fact — §5.9`',
      ],
      'L90996',
    ),
    row(
      [
        'Publication with an incomplete locale',
        'Explicitly prohibited',
        'Explicitly prohibited',
        '`SoW Fact — §8.7.3`',
      ],
      'L90997',
    ),
    row(
      [
        'Publication of quarantined drafted content',
        'Explicitly prohibited',
        'Explicitly prohibited',
        '`Derived Clarification`',
      ],
      'L90998',
    ),
    row(
      ['Rollback to a prior approved version', 'Allowed', 'Allowed', '`SoW Fact — §5.12.1`'],
      'L90999',
    ),
    row(
      [
        'Agent Builder composition and submission',
        'Allowed',
        'Unavailable — sandbox evaluation cannot run',
        '`SoW Fact — §5.15, §8.5.1`',
      ],
      'L91000',
    ),
    row(
      [
        'Device package-version visibility',
        'Allowed',
        'Read-only — telemetry may lag',
        '`SoW Fact — §8.13.2`',
      ],
      'L91001',
    ),
    row(
      [
        'Fallback-readiness validation',
        'Allowed',
        'Allowed',
        '`Client Decision Required` under `DEC-AIFALLBACK-001`',
      ],
      'L91002',
    ),
  ],
}

/**
 * What this table is NOT, in the words a screen prints. A measurement, and the
 * covering test repeats the sweep against the frozen bytes rather than
 * trusting this string.
 */
export const STU_AXIS_ATTRIBUTION = {
  axisHeading: 'Capability',
  whatTheSourceAssigns:
    'No Studio module. Section 43.3.2 was swept end to end and contains zero occurrences of '
    + '`MOD-STU-`. The table names capabilities, and a capability is not a module.',
  whyNoModuleColumnMayBeAdded:
    'Part V publishes no module inventory, so the Studio module registry this build carries '
    + 'is itself a `Derived Clarification` under `DEC-STUDIO-001` (L4036). Joining a '
    + 'derived registry to a table that names no module would manufacture a key the source has '
    + 'nowhere, and any coverage figure computed from it would measure nothing.',
  soNoGateMayReadItAsModuleCoverage:
    'Capabilities and modules are two different populations. This table is not coverage of '
    + '`SURF-STU` module behaviour and is not offered as any.',
  delegatedChoice: APP_012_DELEGATED_CHOICE,
} as const

/**
 * `DEC-*` identifiers this overlay names that the exported `DecisionId` union
 * does not hold. Disclosed locally and reported as a seam; none of them is
 * added to the canon by this task, because the canon is wave 5's.
 */
export const STU_UNCANONISED_DECISIONS: readonly {
  readonly id: string
  readonly question: string
  readonly sourceRef: string
}[] = [
  {
    id: 'DEC-AIFALLBACK-001',
    question:
      'Whether fallback-readiness validation is allowed while artificial intelligence is '
      + 'failed. The row grants it in both condition columns and classifies the row '
      + '`Client Decision Required`, so the grant and the openness are stated together.',
    sourceRef: 'L91002',
  },
  {
    id: 'DEC-STUDIO-001',
    question:
      "The Studio's module count, which Part V never publishes. Named here only to say why "
      + 'this table carries no module column.',
    sourceRef: 'L4036',
  },
]

export const STU_AI_OVERLAY: SurfaceAiOverlay = {
  surfaceId: 'SURF-STU',
  journeyCode: overlayJourneyCode('SURF-STU'),
  tables: [STU_AI_BEHAVIOUR_TABLE],
  provenance: OVERLAY_PROVENANCE,
  obligations: FIVE_SURFACE_OBLIGATIONS,
  sourceNotes: [
    {
      heading: 'This table\u2019s axis is a capability, and it is not module coverage.',
      body: [
        STU_AXIS_ATTRIBUTION.whatTheSourceAssigns,
        STU_AXIS_ATTRIBUTION.whyNoModuleColumnMayBeAdded,
        STU_AXIS_ATTRIBUTION.soNoGateMayReadItAsModuleCoverage,
        STU_AXIS_ATTRIBUTION.delegatedChoice,
      ].join(' '),
      sourceRef: 'L90989',
      readings: [],
      adopted: null,
    },
    ...STU_UNCANONISED_DECISIONS.map((decision) => ({
      heading: `${decision.id} is not a member of the exported \`DecisionId\` union, so it is disclosed here.`,
      body: `${decision.question} The canon is wave 5\u2019s; this is the slice-8 local pattern and it is reported as a seam.`,
      sourceRef: decision.sourceRef,
      readings: [],
      adopted: null,
    })),
  ],
  statedAbsences: [
    {
      what: 'A queued-request runtime state.',
      reason:
        'Not applicable — the Studio authors content, it does not observe runtime requests. '
        + 'The Studio column of the queued-request state-to-surface matrix reads '
        + '`Not applicable` on every row.',
      sourceRef: 'L89697',
    },
    {
      what: 'An artificial-intelligence availability state for a tenant.',
      reason:
        '`AC-42-301` binds every surface that DISPLAYS such a state. This surface displays '
        + 'none, so it is outside mode parity rather than in breach of it, and rendering one '
        + 'here to satisfy a parity rule would contradict the twelve `Not applicable` cells.',
      sourceRef: 'L89400',
    },
  ],
}

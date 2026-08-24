import {
  FIVE_SURFACE_OBLIGATIONS,
  OVERLAY_PROVENANCE,
  overlayJourneyCode,
  type CellReading,
  type OverlayRow,
  type OverlayTable,
  type SurfaceAiOverlay,
} from '@/ai/five-surface/overlay'

/**
 * `SURF-FL` — THE FRONTLINE WORKER APPLICATION'S AI-DEGRADATION OVERLAY.
 *
 * TRANSCRIBED, and the line that makes it so is the header at **L91179**:
 * `| Frontline module | Behaviour during an artificial-intelligence failure |
 * Classification |`, under the caption `**Behaviour matrix by module.**` at
 * L91177, in §43.3.4 (heading L91116). The rule at L91180 and twelve content
 * rows at L91181-L91192 — COUNTED from the header.
 *
 * ── THIS IS THE ONLY §43.3.x TABLE CARRYING REAL MODULE IDENTIFIERS ───────
 * `MOD-FL-A1` through `MOD-FL-B12`, in the table's own first column. Measured
 * across the whole of chapter 43, the only module identifiers anywhere in the
 * chapter are these twelve. The Studio table names capabilities, the Command
 * Center table names modules in words, and the Hub and console have no
 * per-module table at all — so this is the one place the identifier is
 * transcribed rather than supplied.
 *
 * ── THREE CELLS DESCRIBE CONNECTIVITY UNDER AN AI-FAILURE HEADING ─────────
 * The table is headed "Behaviour during an artificial-intelligence failure"
 * and three of its cells describe something else:
 *
 *   L91188  `MOD-FL-B8`  Cached read-only WHILE OFFLINE
 *   L91190  `MOD-FL-B10` Queued WHILE OFFLINE
 *   L91192  `MOD-FL-B12` Unavailable — ONLINE ONLY BY DESIGN
 *
 * `MOD-FL-B12`'s is not even connectivity-conditional: online-only by design is
 * an ARCHITECTURAL BOUNDARY, true at full artificial-intelligence health and
 * full connectivity alike. Each of the three renders with BOTH readings and its
 * own locator, through `readings`. The source is not corrected by moving the
 * row into a connectivity table, and a connectivity behaviour is not silently
 * filed under an artificial-intelligence heading — because a worker reading
 * "unavailable during an AI failure" would walk to a better signal, and for
 * `MOD-FL-B12` that is the wrong action.
 *
 * This is the same distinction `AC-42-303` (L89402) protects at the mode layer:
 * a paused platform and an unreachable one call for different human responses.
 * Here it is the table layer, and the confusion is the same one.
 *
 * ── THE WORKER SURFACE IS WHERE A CONTRADICTION COSTS THE MOST ────────────
 * `AC-43-251` (L90664) — no surface ever indicates that an offline device has
 * received or applied any command or answer. `AC-42-602` (L89715) — no surface
 * renders one state's vocabulary for another. `AC-AI-105-5` (L88557) — no
 * surface presents queued or sent as delivered, or delivered as read. All three
 * bind hardest here, and all three are in `obligations`.
 *
 * ── NO GATE-DECISION AND NO RECONCILIATION CONTROL ON THE DEVICE ──────────
 * §42.6 puts the human gate and cancellation-with-a-reason on the Client
 * Command Center (L89702, L89706) and reconciliation on the Delivery Operations
 * Hub (L89708). The Frontline column SHOWS those states and offers none of
 * those acts. Building either control here would put a Command Center act and
 * a Hub act on the floor interface. Both are declared absences below.
 *
 * `PROV-4`. Every cell is a transcribed deterministic rule. Note what that
 * means for row `MOD-FL-B8`: cached approved guidance is `PROV-3`, never
 * `PROV-1`, and this overlay's own marker is `PROV-4` because it renders the
 * RULE about the cache rather than the cached content.
 *
 * ── REACHABILITY, STATED ───────────────────────────────────────────────────
 * MEASURED ON THIS TREE, AND WRITTEN DOWN BECAUSE A STATED ABSTENTION AND AN
 * OVERSIGHT LOOK IDENTICAL FROM OUTSIDE. There is no Frontline route among the
 * eight route directories this task extends, and there is no `app/frontline`
 * module route to hang a surface overlay on — so nothing under `app/` mounts
 * `AiDegradationOverlay` with this overlay directly, and no route will until a
 * Frontline module route exists.
 *
 * It is NOT unreachable. `FL_AI_OVERLAY` is a member of `FIVE_SURFACE_OVERLAYS`
 * and is resolved by `overlayForSurfaceCode('FL')`, and the Hub journey
 * register acts on `FL` at one of its steps — so `app/hub/journey/JourneyScreen`
 * renders this overlay whenever that step is open. That is the path, it is
 * asserted by name in `tests/unit/ai-five-surface-overlays.test.ts`, and it is
 * the whole of it. This is the surface where a contradiction costs the most, so
 * the reachability is stated rather than assumed.
 */

const flRow = (
  moduleCell: string,
  behaviour: string,
  classification: string,
  sourceRef: string,
  readings: readonly CellReading[] = [],
): OverlayRow => ({
  cells: [moduleCell, behaviour, classification],
  sourceRef,
  kind: 'transcribed',
  readings,
})

/** The reading a cell carries beyond its heading. Column index 1 is behaviour. */
const alsoConnectivity = (asHeaded: string, alsoReads: string, sourceRef: string): CellReading => ({
  cellIndex: 1,
  asHeaded,
  alsoReads,
  sourceRef,
})

export const FL_AI_BEHAVIOUR_TABLE: OverlayTable = {
  caption: 'Behaviour matrix by module.',
  captionRef: 'L91177',
  headings: [
    'Frontline module',
    'Behaviour during an artificial-intelligence failure',
    'Classification',
  ],
  headerRef: 'L91179',
  kind: 'transcribed',
  whyDerived: null,
  rows: [
    flRow(
      '`MOD-FL-A1` Identity, Auth and Device Mode',
      'Allowed — unaffected; forced sync still required before designated high-risk actions',
      '`SoW Fact — §7.10.5`',
      'L91181',
    ),
    flRow('`MOD-FL-A2` My Runs', 'Allowed — unaffected', '`SoW Fact — §7.6`', 'L91182'),
    flRow('`MOD-FL-A3` Run Player', 'Allowed — unaffected', '`SoW Fact — §7.19`', 'L91183'),
    flRow(
      '`MOD-FL-A4` Data Capture and Evidence',
      'Allowed — unaffected',
      '`SoW Fact — §7.8`',
      'L91184',
    ),
    flRow(
      '`MOD-FL-A5` On-Device Detection and Containment',
      'Allowed — unaffected, mandatory',
      '`SoW Fact — §7.9`',
      'L91185',
    ),
    flRow(
      '`MOD-FL-A6` Offline and Sync Engine',
      'Allowed — unaffected',
      '`SoW Fact — §7.10`',
      'L91186',
    ),
    flRow(
      '`MOD-FL-A7` Security and Data Protection',
      'Allowed — unaffected',
      '`SoW Fact — §7.11`',
      'L91187',
    ),
    flRow(
      '`MOD-FL-B8` Coaching Rendering',
      'Cached read-only while offline — authored Work Instructions and packaged assets only',
      '`SoW Fact — §7.12`',
      'L91188',
      [
        alsoConnectivity(
          'A behaviour during an artificial-intelligence failure, per the table heading.',
          'A CONNECTIVITY behaviour. The cell is conditioned on being offline, not on '
            + 'artificial intelligence having failed. A device online with a failed model and a '
            + 'device offline with a healthy one reach this cell by different routes, and only '
            + 'one of them is fixed by walking to a better signal.',
          'L91188',
        ),
      ],
    ),
    flRow(
      '`MOD-FL-B9` Gates and Sign-Off Authority',
      'Allowed — unaffected',
      '`SoW Fact — §7.13`',
      'L91189',
    ),
    flRow(
      '`MOD-FL-B10` Notifications',
      'Queued while offline — creation local, delivery deferred',
      '`SoW Fact — §7.14`',
      'L91190',
      [
        alsoConnectivity(
          'A behaviour during an artificial-intelligence failure, per the table heading.',
          'A CONNECTIVITY behaviour. Queueing is conditioned on being offline. `AC-43-251` '
            + '(L90664) is what makes the distinction load-bearing: no surface may indicate '
            + 'that an offline device has received or applied anything, so a queued '
            + 'notification must never render as a delivered one.',
          'L91190',
        ),
      ],
    ),
    flRow(
      '`MOD-FL-B11` Worker Lifecycle on Device',
      'Allowed with conditions — subject to the credential-trust window',
      '`SoW Fact — §7.10.5`',
      'L91191',
    ),
    flRow(
      '`MOD-FL-B12` Training Library Viewer',
      'Unavailable — online only by design',
      '`SoW Fact — §1.4 seam 12`',
      'L91192',
      [
        alsoConnectivity(
          'A behaviour during an artificial-intelligence failure, per the table heading.',
          'AN ARCHITECTURAL BOUNDARY, and not even connectivity-conditional. Online only by '
            + 'design is true at full artificial-intelligence health and full connectivity '
            + 'alike. Nothing about an artificial-intelligence failure causes this cell and '
            + 'nothing about recovery clears it.',
          'L91192',
        ),
      ],
    ),
  ],
}

export const FL_AI_OVERLAY: SurfaceAiOverlay = {
  surfaceId: 'SURF-FL',
  journeyCode: overlayJourneyCode('SURF-FL'),
  tables: [FL_AI_BEHAVIOUR_TABLE],
  provenance: OVERLAY_PROVENANCE,
  obligations: [
    ...FIVE_SURFACE_OBLIGATIONS,
    {
      id: 'AC-43-251',
      sourceRef: 'L90664',
      text:
        'No surface ever indicates that an offline device has received or applied any command '
        + 'or answer.',
      withheld: null,
    },
    {
      id: 'AC-42-602',
      sourceRef: 'L89715',
      text:
        "No surface renders one state's vocabulary for another; in particular, `uploaded` is "
        + 'never rendered as answered and `answer available` is never rendered as acted upon.',
      withheld: null,
    },
    {
      id: 'AC-AI-105-5',
      sourceRef: 'L88557',
      text:
        'Delivery states are rendered distinctly; no surface presents queued or sent as '
        + 'delivered, or delivered as read.',
      withheld: null,
    },
  ],
  sourceNotes: [
    {
      heading:
        'Three cells of an artificial-intelligence-failure table describe connectivity, and '
        + 'neither reading is dropped.',
      body:
        'The table is headed "Behaviour during an artificial-intelligence failure" and the '
        + 'cells for Coaching Rendering, Notifications and the Training Library Viewer describe '
        + 'something else — cached-while-offline, queued-while-offline, and online-only by '
        + 'design, which is an architectural boundary true at full artificial-intelligence '
        + 'health. Each renders under the heading it has AND with its other reading, on the row '
        + 'itself, each with its own locator. The source is not corrected by moving a row, and a '
        + 'connectivity behaviour is not silently filed under an artificial-intelligence '
        + 'heading: a worker reading "unavailable during an artificial-intelligence failure" '
        + 'would walk to a better signal, and online-only-by-design is not fixed by walking '
        + 'anywhere.',
      sourceRef: 'L91179',
      readings: [],
      adopted: null,
    },
  ],
  statedAbsences: [
    {
      what: 'A gate-decision control.',
      reason:
        'The human gate is exercised on the Client Command Center — "Allowed — the gate is '
        + 'exercised here". This surface shows the `pending human review` state and offers no '
        + 'act on it; building one would put a Command Center act on the device.',
      sourceRef: 'L89702',
    },
    {
      what: 'A cancel-with-a-reason control.',
      reason:
        'Cancellation with a reason is a Supervisor or Quality Manager act on the Client '
        + 'Command Center.',
      sourceRef: 'L89706',
    },
    {
      what: 'A reconciliation control, and the reconciled state itself.',
      reason:
        'Unavailable — the worker sees the outcome, not the bookkeeping. Reconciliation is a '
        + 'Delivery Operations Hub act, where the record of truth holds it.',
      sourceRef: 'L89708',
    },
  ],
}

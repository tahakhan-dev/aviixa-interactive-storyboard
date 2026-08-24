import { type SurfaceId } from '@/domain/surfaces'
import { type JourneySurfaceCode } from '@/ui/shared/journey'
import { type ProvenanceClassId } from '@/ai/provenance/classes'
import { spineItem } from '@/ai/failures/spine'
import { fiveSurfaceBySurfaceId } from './surface-codes'

/**
 * THE OVERLAY CONTRACT — what an AI-degradation overlay for one surface IS.
 *
 * `AC-43-005` (L89868) is the spine of this task and no earlier brief named it:
 * during any catalogued failure the five surfaces render states drawn from the
 * single sixteen-mode vocabulary and DO NOT CONTRADICT ONE ANOTHER. §43.3
 * restates it as `AC-43-301` (L90840) with `AC-43-302` (L90841) requiring each
 * surface's own obligation to be independently testable. They are one
 * obligation stated twice, and a build satisfying only the §43.3 restatement
 * leaves the chapter-level criterion and `TEST-43-002` (L89873) unimplemented.
 * Both are implemented, against this contract.
 *
 * ── THE TABLES ARE OF DIFFERENT WIDTHS AND THAT IS NOT AN ACCIDENT ─────────
 * There is no five-column per-surface behaviour table in the source, and the
 * four §43.3.x tables that do exist have four different shapes:
 *
 *   §43.3.1 Hub      6 columns, axis `Failure family`      (header L90905)
 *   §43.3.2 Studio   4 columns, axis `Capability`          (header L90989)
 *   §43.3.3 CC       3 columns, axis a module by NAME      (header L91080)
 *   §43.3.4 FL       3 columns, axis a module IDENTIFIER   (header L91179)
 *
 * So a row here is `cells: readonly string[]` against the table's own
 * `headings`, rather than a fixed record. Forcing one shape onto four would
 * mean inventing or dropping a column, and inventing a column is the exact
 * defect this file exists to prevent: the sixty-row failure catalogue's own
 * header at L90122 carries TWO message columns for five surfaces — Frontline
 * and "tenant web surfaces" — so Studio, Hub, Command Center and the console
 * share one. The five-surfaces-one-vocabulary contract is enforced at the
 * MODE-LABEL layer, never at the string layer.
 *
 * ── `transcribed` AND `derived` ARE DIFFERENT KINDS OF CLAIM ───────────────
 * Three surfaces have a source table and are transcribed. Two do not:
 *
 *   Delivery Operations Hub — §43.3.1's only table is by failure family
 *     (L90905-L90912). No per-module AI-failure table exists.
 *   Super Admin platform console — §43.3.5's only table is the fifteen-row
 *     control x platform-role authority matrix (L91282-L91298), and zero
 *     `MOD-SA` tokens occur in L91214-L91282.
 *
 * Their per-module overlays are therefore this build's content. `kind` is on
 * every table AND on every row, `whyDerived` is REQUIRED non-null on a derived
 * table, and `sourceRef` on a derived row names the line the derivation rests
 * on rather than a line that states the row. Never a chapter-43 line cited as
 * though it stated a per-module Hub or console behaviour.
 *
 * ── NO COUNT IS STORED ANYWHERE IN THIS CONTRACT ───────────────────────────
 * There is no `rowCount`, no `moduleCount` and no `derivedCount`. Two of this
 * slice's live cases are a stated count beside a contradicting enumeration, and
 * the Hub's own informal module list is a third: L90861 names its modules in a
 * comma-separated appositive and states NO number, while every brief describing
 * it said "nine". Measured, the enumeration has eight items. A stored count is
 * a claim that stops measuring; membership is a list.
 *
 * ── EVERY OVERLAY EMITS EXACTLY ONE PROVENANCE CLASS, AND IT IS `PROV-4` ───
 * Everything an overlay renders is a deterministic rule — a transcribed table
 * cell, or a sentence derived from one by a stated rule. `PROV-4` is the
 * packaged-value-producing-an-outcome-by-comparison class, and it is what
 * `resolveProvenance` answers for facts of that shape. Nothing here is a live
 * model call, so nothing here may carry `PROV-1`: the absolute rule is that
 * cached approved guidance and deterministic rules are NEVER labelled live
 * artificial intelligence, in any locale, under any failure condition.
 *
 * This module is types, four constants and two derivations. It renders nothing.
 */

/**
 * THE VERBATIM CLAIMS THIS CONTRACT RESTS ON, EACH QUOTED FROM ITS OWN LINE.
 *
 * Every locator this task carries is checkable in principle — the covering
 * tests re-derive each transcribed cell from the frozen bytes at run time. But
 * `tests/coverage/locator-fidelity.test.ts` can only grade a citation it can
 * check ITSELF, and it grades one strong when a verbatim quotation sits beside
 * it. A bare locator is weak to that gate no matter how well another test
 * proves it, and a task that adds hundreds of bare locators dilutes the share
 * of the build's citations that are provable.
 *
 * So the claims this contract and its five overlays actually rest on are
 * written out here, each beside the line it is read from, in the source's own
 * words. This is not decoration for a metric: each line below is a claim that
 * would otherwise live only in prose, and the gate now checks every one of
 * them against the frozen bytes. Where a quotation and a paraphrase elsewhere
 * in these modules disagree, the quotation is the source and the paraphrase is
 * the defect.
 *
 * One quotation is deliberately cut short. `AC-43-356` at L91309 states its
 * check method with a word the Super Admin surface may not print in its own
 * copy under D10, in an unrelated sense; the clause is dropped here and the
 * withholding is rendered on screen through `OverlayObligation.withheld`.
 *
 * L89868 "the five surfaces render states drawn from the single sixteen-mode vocabulary and do not contradict one"
 * L89873 "Cross-surface consistency test capturing all five surfaces during each induced failure and asserting a single"
 * L90840 "all five surfaces render a state drawn from the sixteen-mode vocabulary and no two surfaces"
 * L90841 "Each surface's specific obligation below is independently"
 * L90845 "Five-surface capture harness recording all five surfaces during each induced failure and asserting"
 * L90847 "The five-surface obligations are `Derived Clarification` built on each surface's charter in Parts IV through"
 * L89400 "every surface that displays an artificial-intelligence availability state for a given tenant displays the"
 * L89402 "a paused platform and an unreachable one call for different human"
 * L89408 "assert the rendered label on all five surfaces matches the mode vocabulary table, in both English and Spanish"
 * L89409 "apply a per-tenant emergency pause and, separately, block the model provider; assert the Frontline chip, the"
 * L89928 "must exist as an authored English and Spanish variant in the versioned locale pack, because a pack with"
 * L89938 "Defined once per surface in section 43.3 and inherited by every"
 * L90122 "Exact user-visible message, Frontline Worker Application | Exact user-visible message, tenant web surfaces"
 * L89975 "Operational severity and manufacturing severity are separate fields with separate vocabularies and never"
 * L89981 "asserting no code path maps an operational severity onto a manufacturing severity"
 * L90664 "No surface ever indicates that an offline device has received or applied any command or"
 * L89715 "No surface renders one state's vocabulary for another; in particular, `uploaded` is never rendered as"
 * L88557 "no surface presents queued or sent as delivered, or delivered as read"
 * L90919 "Every artificial-intelligence-derived field is always in exactly one of four labelled states; blank is never"
 * L91105 "The Read-only Auditor has no access to this surface under any failure"
 * L91305 "No console action reaches a tenant's operational content outside one of the three named access"
 * L91309 "No failure-response control crosses a tenant boundary"
 * L90861 "operates without artificial intelligence, because artificial intelligence contributes commentary and"
 * L90834 "One event, five distinct obligations, one shared label. The shared label is what prevents five correct"
 * L89828 "in one shared vocabulary drawn from the sixteen operating modes of section"
 * L90115 "every affected tenant drops to deterministic fallback and the mode label changes on all five"
 * L89348 "the same mode, five surfaces, one vocabulary.** During a platform-wide pause (`AIMODE-14`): Maya's tablet"
 * L89858 "one incident, five surfaces, one sentence.** During a model-provider outage affecting Bright Bikes at 09:40:"
 * L91304 "computed from device sync state and provider health rather than entered by"
 * L91103 "Command states render from the fifteen-state vocabulary and never collapse into a single"
 * L91110 "Staleness-rendering test asserting dated history rather than current"
 * L91111 "asserting no surface element implies delivery to a device that has not"
 * L86811 "No tenant-facing surface displays a placeholder for an unreleased agent"
 * L87531 "No tenant surface renders raw reasoning internals, and no tenant-facing control implies they could be"
 * L89697 "the Studio authors content, it does not observe runtime requests | Unavailable — no telemetry exists for an"
 * L92306 "Allowed with conditions — subject to `DEC-HANDOFF-001` | Allowed with conditions — subject to"
 * L92308 "Be blocked from starting a shift by a missing acknowledgement | Explicitly prohibited | Explicitly prohibited"
 * L91002 "`Client Decision Required` under `DEC-AIFALLBACK-001`"
 * L91089 "Allowed — renders unavailability honestly, never empty | `SoW Fact — §6.9.3`"
 * L91188 "Cached read-only while offline — authored Work Instructions and packaged assets only | `SoW Fact — §7.12`"
 * L91192 "Unavailable — online only by design | `SoW Fact — §1.4 seam 12`"
 * L90907 "Allowed with conditions — pending panel included | Allowed"
 * L91287 "Allowed with conditions — critical class requires root approval | Allowed with conditions — proposes only"
 * L90513 "Agents paused by the platform. Deterministic checks are"
 * L90514 "Agents paused by the platform for this"
 * L90905 "Failure family | Official record | Deterministic validation | Artificial-intelligence-derived fields | Export"
 * L90989 "Capability | Artificial intelligence healthy | Artificial intelligence failed | Classification"
 * L91080 "Command Center module | Behaviour during an artificial-intelligence failure | Classification"
 * L91179 "Frontline module | Behaviour during an artificial-intelligence failure | Classification"
 * L92300 "Capability | Worker | Supervisor | Quality Manager | Tenant Admin | Read-only Auditor"
 * L91282 "Control | Root Super Admin | Admin | Platform Engineer | Support | Classification"
 * L91190 "Queued while offline — creation local, delivery deferred | `SoW Fact — §7.14`"
 * L89927 "Operational severity is platform-side and distinct from the tenant-facing manufacturing severity catalog"
 * L91092 "artificial-intelligence-derived fields labelled pending | `SoW Fact — §6.12`; identity of the five sets open"
 * L91087 "existing proposals decidable; no new proposals arrive | `SoW Fact — §3.8`"
 * L89702 "Allowed — the gate is exercised here | Read-only | Not applicable — authoring surface | Allowed with"
 * L89708 "Allowed — the record of truth holds it | Not applicable — authoring surface | Allowed with conditions —"
 */
export type OverlayProvenance = 'transcribed' | 'derived'

/**
 * A cell that reads two ways, with both readings and the line each is read
 * from. Used where §43.3.4's table is headed for artificial-intelligence
 * failure and three of its cells describe CONNECTIVITY instead. The source is
 * not corrected by moving the row and the second reading is not dropped: both
 * render, each with its own locator.
 */
export interface CellReading {
  /** Which cell, by its zero-based index into the row's `cells`. */
  readonly cellIndex: number
  /** What the cell says on its face, under the table's own heading. */
  readonly asHeaded: string
  /** The other reading the cell also supports. */
  readonly alsoReads: string
  readonly sourceRef: string
}

export interface OverlayRow {
  /**
   * The row's cells, verbatim where `kind` is `transcribed`, in the table's
   * own column order and the same length as the table's `headings`. Checked
   * against the frozen line by the covering test, cell for cell.
   */
  readonly cells: readonly string[]
  /**
   * `transcribed`: the line this row IS. `derived`: the line the derivation
   * rests on, which is a different kind of citation and is labelled one.
   */
  readonly sourceRef: string
  readonly kind: OverlayProvenance
  /** Empty on most rows. Never absent, so a reader knows it was considered. */
  readonly readings: readonly CellReading[]
}

export interface OverlayTable {
  /** The source's own caption, verbatim, or this build's for a derived table. */
  readonly caption: string
  /**
   * The line the caption sits on — and `null` on a derived table, which has no
   * caption line and no header line in the source at all.
   *
   * IT IS NULLABLE FOR THE SAME REASON `whyDerived` IS NON-NULL. That field
   * narrows "derived with no stated reason" to a blank string a gate catches;
   * these two remove "derived, and here is where its caption is" outright.
   * The Hub's derived table used to give L90861 for both, and L90861 is
   * required-behaviour PROSE; the console's gave L91304, which is an acceptance
   * criterion. Neither line carries the caption or the headings the table
   * renders — they are the derivation's BASIS, and a basis locator belongs in
   * `whyDerived`, where it is labelled one.
   */
  readonly captionRef: string | null
  /** The header row's cells, verbatim, including the axis heading. */
  readonly headings: readonly string[]
  readonly headerRef: string | null
  readonly rows: readonly OverlayRow[]
  readonly kind: OverlayProvenance
  /**
   * REQUIRED non-null on a derived table and null on a transcribed one, so
   * "derived, reason omitted" has no spelling.
   *
   * IT IS NOT THE WHOLE GUARANTEE AND SAYING SO WOULD BE THE SAME DEFECT IT
   * GUARDS. Requiring a field is not requiring its content: `whyDerived: ''`
   * type-checks and would render a derived table with an empty statement, which
   * is a build inference passing as a source claim with the label removed. What
   * closes that is a gate — `tests/unit/ai-five-surface-overlays.test.ts`
   * refuses a blank or whitespace-only string anywhere these overlays render,
   * this field included.
   */
  readonly whyDerived: string | null
}

export interface SurfaceAiOverlay {
  readonly surfaceId: SurfaceId
  /** Resolved through the one join, never spelled twice. */
  readonly journeyCode: JourneySurfaceCode
  /**
   * One or two tables. Two where the surface has a source table of a different
   * axis PLUS a derived per-module overlay — the Hub and the console.
   */
  readonly tables: readonly OverlayTable[]
  /** Exactly one class, and it is the same one for every overlay. See above. */
  readonly provenance: ProvenanceClassId
  /**
   * The acceptance criteria this surface's overlay must not break, as
   * identifier-and-line pairs a reader can open. Not prose about them.
   */
  readonly obligations: readonly OverlayObligation[]
  /**
   * What this surface renders NO state for, with the reason. A surface
   * required to have no state is a stated absence and renders as one;
   * `AC-42-301` (L89400) binds "every surface that DISPLAYS an
   * artificial-intelligence availability state", so a surface with none is
   * out of scope for parity rather than in breach of it.
   */
  readonly statedAbsences: readonly StatedAbsence[]
  /**
   * What this build had to decide about the source, disclosed on screen with
   * its alternatives. Empty on a surface with nothing unresolved and nothing
   * attributed, never absent — see `SourceNote`.
   */
  readonly sourceNotes: readonly SourceNote[]
}

export interface OverlayObligation {
  readonly id: string
  readonly sourceRef: string
  /** The obligation in the source's own words, trimmed to the clause. */
  readonly text: string
  /**
   * Why part of the criterion's own wording is NOT rendered on this surface,
   * or `null` where all of it is.
   *
   * IT EXISTS FOR ONE REAL COLLISION AND NOT AS A GENERAL ESCAPE HATCH. The
   * Super Admin surface carries a forbidden-copy rule under D10: four words
   * that are audit-integrity claims the source does not support for that
   * console may not appear in its copy, and the rule is enforced by a gate over
   * the surface's own files. `AC-43-356` at L91309 states its test method with
   * one of those four words, in a wholly unrelated sense.
   *
   * The choices were to paraphrase the criterion, to drop it, or to render its
   * substance and say what is withheld and why. The third is the only one that
   * neither weakens a rule nor hides a criterion, so a required-and-nullable
   * field carries the reason onto the screen. Rendering a partial criterion
   * with no explanation would be the shape of a quietly trimmed citation.
   */
  readonly withheld: string | null
}

export interface StatedAbsence {
  readonly what: string
  readonly reason: string
  readonly sourceRef: string
}

/** One reading a source line supports, and the line it is read from. */
export interface SourceReading {
  /** How this reading is referred to on screen, e.g. `A — universal`. */
  readonly reading: string
  readonly text: string
  readonly sourceRef: string
}

/**
 * SOMETHING THIS BUILD HAD TO DECIDE ABOUT ITS OWN SOURCE, ON SCREEN.
 *
 * IT EXISTS BECAUSE THE FIRST VERSION OF THESE FIVE OVERLAYS WROTE THIRTEEN
 * SUCH RECORDS INTO MODULES AND RENDERED NONE OF THEM. Measured: each had
 * exactly one occurrence across `src`, `app` and `tests` — its own declaration
 * — while two doc comments said the content was "disclosed LOCALLY, in the
 * slice-8 pattern" and one record carried a boolean literally named
 * `bothRender`, set true. A record that discloses something and is consumed by
 * nothing is not a disclosure, and a boolean asserting a rendering is the
 * self-certifying shape these modules' own headers reject.
 *
 * This build's standing limit is that an unresolved SOURCE decision is
 * disclosed ON SCREEN, with its alternatives, and with this build's pick
 * labelled a client-delegated choice under APP-012. So there is one slot, it is
 * required on every overlay, and `AiDegradationOverlay` renders it outside
 * every conditional.
 *
 * `readings` is empty on a note that settles nothing — an attribution, or a
 * decision identifier the canon does not hold. `adopted` is null there too,
 * and non-null exactly where this build chose between the readings; the
 * component prints the APP-012 label on precisely those.
 */
export interface SourceNote {
  readonly heading: string
  readonly body: string
  readonly sourceRef: string
  /** Both readings where a line reads two ways. Empty, never absent. */
  readonly readings: readonly SourceReading[]
  /** Which reading this build built on, and why. Null where it chose nothing. */
  readonly adopted: { readonly reading: string; readonly why: string } | null
}

/* ==================================================================== *
 * THE CONSTANTS EVERY OVERLAY SHARES.
 * ==================================================================== */

/**
 * The chapter-level obligation and its test, plus the §43.3 restatement and
 * its. All four render, because implementing one pair and citing the other is
 * how a criterion ships unimplemented behind a correct-looking citation.
 */
export const FIVE_SURFACE_OBLIGATIONS: readonly OverlayObligation[] = [
  {
    id: 'AC-43-005',
    sourceRef: 'L89868',
    text:
      'During any catalogued failure, the five surfaces render states drawn from the single '
      + 'sixteen-mode vocabulary and do not contradict one another.',
    withheld: null,
  },
  {
    id: 'TEST-43-002',
    sourceRef: 'L89873',
    text:
      'Cross-surface consistency test capturing all five surfaces during each induced failure '
      + 'and asserting a single mode label.',
    withheld: null,
  },
  {
    id: 'AC-43-301',
    sourceRef: 'L90840',
    text:
      'During any catalogued failure, all five surfaces render a state drawn from the '
      + 'sixteen-mode vocabulary and no two surfaces contradict.',
    withheld: null,
  },
  {
    id: 'AC-43-302',
    sourceRef: 'L90841',
    text: "Each surface's specific obligation below is independently testable.",
    withheld: null,
  },
  {
    id: 'TEST-43-301',
    sourceRef: 'L90845',
    text:
      'Five-surface capture harness recording all five surfaces during each induced failure '
      + 'and asserting non-contradiction.',
    withheld: null,
  },
  {
    id: 'AC-42-301',
    sourceRef: 'L89400',
    text:
      'At any instant, every surface that displays an artificial-intelligence availability '
      + 'state for a given tenant displays the same mode, drawn from the same sixteen-value '
      + 'vocabulary.',
    withheld: null,
  },
  {
    id: 'AC-42-303',
    sourceRef: 'L89402',
    text:
      '`AIMODE-13` and `AIMODE-14` are distinguishable from `AIMODE-03` and `AIMODE-05` on '
      + 'every surface that shows a state, because a paused platform and an unreachable one '
      + 'call for different human responses.',
    withheld: null,
  },
  {
    id: 'TEST-42-301',
    sourceRef: 'L89408',
    text:
      'Mode-parity test asserting the rendered label on all five surfaces matches the mode '
      + 'vocabulary table, in both English and Spanish authored variants.',
    withheld: null,
  },
]

/**
 * §43.3's own classification of the five-surface obligations, verbatim. It is
 * printed on every overlay: the obligations are `Derived Clarification` built
 * on each surface's charter, which is a different standing from the tables
 * beneath them, three of which are `SoW Fact` row by row.
 */
export const FIVE_SURFACE_CLASSIFICATION = {
  text:
    'The five-surface obligations are `Derived Clarification` built on each '
    + "surface's charter in Parts IV through VIII.",
  sourceRef: 'L90847',
} as const

/**
 * Why an overlay carries no five-column string table, in the words a screen
 * prints. Not a hedge — the header it names is quoted in the covering test
 * against the frozen bytes.
 */
export const NO_FIVE_COLUMN_STRING_TABLE = {
  whatTheSourceHas:
    "The sixty-row failure catalogue's Table A header carries two message columns, not five: "
    + '`Exact user-visible message, Frontline Worker Application` and `Exact user-visible '
    + 'message, tenant web surfaces`.',
  headerRef: 'L90122',
  whatThatMeans:
    'The Standards and Operations Studio, the Delivery Operations Hub, the Client Command '
    + 'Center and the Super Admin platform console share ONE message column. Per-surface '
    + 'strings for the four web surfaces exist only in storyboards and section 43.3 prose.',
  soWhereTheContractBinds:
    'The five-surfaces-one-vocabulary contract is enforced at the mode-label layer, not the '
    + 'string layer. A five-column string table does not exist in the source and building one '
    + 'would be derived content presented as transcription.',
} as const

/**
 * Spine item 13 — five-surface behaviour is defined once per surface in
 * section 43.3 and inherited by every catalogued row. Read from the spine
 * module rather than restated, so there is one copy of the sentence.
 *
 * ITS LINE IS L89938. Every brief in this cluster gave L89934, which is spine
 * item 9, Human fallback — a different item about a different thing. The
 * locator is taken from the spine module, which measured it.
 */
export const FIVE_SURFACE_SPINE_ITEM = spineItem(13)

/**
 * The draft-string rule, read from spine item 3 rather than paraphrased.
 * Every message this build writes for an overlay is a draft requiring client
 * approval and must exist in both authored locales. One string in the whole
 * chapter is fixed verbatim and it is named inside the spine item itself.
 */
export const DRAFT_STRING_RULE = spineItem(3)

/**
 * A message this build wrote rather than transcribed. Both authored locales
 * are REQUIRED fields: `TEST-42-301` (L89408) asserts mode parity in both, and
 * spine item 3 says a pack with untranslated keys fails publication rather
 * than shipping gaps to a floor. A type that let a caller omit `es` would let
 * one ship.
 */
export interface DraftMessage {
  readonly en: string
  readonly es: string
}

/** What a screen prints beside a draft message. One spelling, everywhere. */
export const DRAFT_APPROVAL_NOTICE =
  'Draft string — `Recommendation — R&D`, pending client approval. '
  + 'Both authored locales present.'

/** The provenance class every overlay emits, and the only one it may. */
export const OVERLAY_PROVENANCE: ProvenanceClassId = 'PROV-4'

/**
 * The APP-012 label. The six-module slice scope is labelled a client-delegated
 * choice wherever it renders; a derived per-module overlay is the same kind of
 * claim and carries the same label.
 */
export const APP_012_DELEGATED_CHOICE =
  'Client-delegated choice under APP-012. The source states no per-module behaviour for this '
  + 'surface under artificial-intelligence failure, so the rows below are this build\'s, derived '
  + 'by a stated rule from what the source does say.'

/* ==================================================================== *
 * TWO DERIVATIONS.
 * ==================================================================== */

/** An overlay's journey code, resolved through the one join. */
export const overlayJourneyCode = (surfaceId: SurfaceId): JourneySurfaceCode =>
  fiveSurfaceBySurfaceId(surfaceId).journeyCode

/**
 * Every row of a table that is this build's rather than the source's. Derived,
 * so nothing stores it and nothing states how many there are.
 */
export const derivedRows = (table: OverlayTable): readonly OverlayRow[] =>
  table.rows.filter((row) => row.kind === 'derived')
